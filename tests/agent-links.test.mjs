import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readlink,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { installAgents } from "../plugins/pstack/skills/setup-pstack/scripts/install-agents.mjs";

const installer = fileURLToPath(
  new URL("../plugins/pstack/skills/setup-pstack/scripts/install-agents.mjs", import.meta.url),
);
const agentNames = ["poteto-agent", "comment-sicko"];

const fakeCodexSource = `#!/usr/bin/env node
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";
const home = process.env.CODEX_HOME;
const statePath = path.join(home, "rpc-state.json");
const configPath = path.join(home, "config.toml");
const logPath = path.join(home, "rpc-log.jsonl");
const load = () => existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : { version: 0, agents: {} };
const lines = readline.createInterface({ input: process.stdin });
lines.on("line", line => {
  const message = JSON.parse(line);
  if (message.method === "initialized") return;
  appendFileSync(logPath, JSON.stringify(message) + "\\n");
  if (message.method === "initialize") {
    process.stdout.write(JSON.stringify({ id: message.id, result: { codexHome: home } }) + "\\n");
    return;
  }
  const state = load();
  if (message.method === "config/read") {
    process.stdout.write(JSON.stringify({ id: message.id, result: { layers: [{ name: { type: "user", file: configPath }, version: "v" + state.version, config: { agents: state.agents } }] } }) + "\\n");
    return;
  }
  if (message.method === "config/batchWrite") {
    if (message.params.expectedVersion !== "v" + state.version) throw new Error("bad version");
    const changed = new Set();
    for (const edit of message.params.edits) {
      const [, name, field] = edit.keyPath.split(".");
      state.agents[name] ??= {};
      state.agents[name][field] = edit.value;
      changed.add(name);
    }
    let config = existsSync(configPath) ? readFileSync(configPath, "utf8") : "";
    for (const name of changed) {
      const agent = state.agents[name];
      config += "\\n[agents." + name + "]\\ndescription = " + JSON.stringify(agent.description) + "\\nconfig_file = " + JSON.stringify(agent.config_file) + "\\n";
    }
    state.version += 1;
    writeFileSync(configPath, config);
    writeFileSync(statePath, JSON.stringify(state));
    process.stdout.write(JSON.stringify({ id: message.id, result: {} }) + "\\n");
  }
});
`;

async function fixture(t, options = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "pstack-agent-registration-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const definitions = path.join(directory, "definitions");
  const pluginRoot = path.join(directory, "plugin");
  const sourceDirectory = path.join(pluginRoot, "agents");
  const codexHome = path.join(directory, "codex");
  const codexBinary = path.join(directory, "fake-codex.mjs");
  await mkdir(definitions, { recursive: true });
  await mkdir(sourceDirectory, { recursive: true });
  await mkdir(codexHome, { recursive: true });
  await Promise.all(agentNames.map(async name => {
    if (name === options.missingAgent) return;
    const definition = path.join(definitions, `${name}.toml`);
    if (name === options.invalidAgent) await mkdir(definition);
    else await writeFile(definition, `name = "${name}"\n`);
    await symlink(definition, path.join(sourceDirectory, `${name}.toml`));
  }));
  await writeFile(codexBinary, fakeCodexSource);
  await chmod(codexBinary, 0o755);
  await writeFile(path.join(codexHome, "rpc-state.json"), JSON.stringify({
    version: 0,
    agents: options.configuredAgents ?? {},
  }));
  return { directory, pluginRoot, codexHome, codexBinary };
}

async function assertMissing(file) {
  await assert.rejects(lstat(file), error => error.code === "ENOENT");
}

test("registers canonical source paths, preserves config, and is idempotent", async t => {
  const { pluginRoot, codexHome, codexBinary } = await fixture(t);
  const original = "# keep this comment\nmessage = '''\n[agents.comment-sicko]\n'''\n";
  const configPath = path.join(codexHome, "config.toml");
  await writeFile(configPath, original);

  const installed = await installAgents(pluginRoot, codexHome, codexBinary);
  const firstConfig = await readFile(configPath, "utf8");
  assert.equal(firstConfig.startsWith(original), true);
  for (const agent of installed) {
    assert.equal(agent.configFile, await realpath(path.join(pluginRoot, "agents", `${agent.name}.toml`)));
    assert.match(firstConfig, new RegExp(`config_file = ${JSON.stringify(agent.configFile).replaceAll("\\", "\\\\")}`));
  }

  await installAgents(pluginRoot, codexHome, codexBinary);
  assert.equal(await readFile(configPath, "utf8"), firstConfig);
  const log = (await readFile(path.join(codexHome, "rpc-log.jsonl"), "utf8")).trim().split("\n").map(JSON.parse);
  assert.equal(log.filter(entry => entry.method === "config/batchWrite").length, 1);
});

test("moves matching legacy links into the PStack backup directory", async t => {
  const { pluginRoot, codexHome, codexBinary } = await fixture(t);
  const agentsDirectory = path.join(codexHome, "agents");
  await mkdir(agentsDirectory);
  for (const name of agentNames) {
    await symlink(path.join(pluginRoot, "agents", `${name}.toml`), path.join(agentsDirectory, `${name}.toml`));
  }

  await installAgents(pluginRoot, codexHome, codexBinary);
  for (const name of agentNames) {
    const original = path.join(agentsDirectory, `${name}.toml`);
    const backup = path.join(codexHome, "backups", "pstack-agent-symlinks", `${name}.toml`);
    await assertMissing(original);
    assert.equal(await readlink(backup), path.join(pluginRoot, "agents", `${name}.toml`));
  }
});

for (const conflict of ["regular file", "foreign symlink", "existing backup"]) {
  test(`preserves ${conflict} before changing config`, async t => {
    const { directory, pluginRoot, codexHome, codexBinary } = await fixture(t);
    const agentsDirectory = path.join(codexHome, "agents");
    await mkdir(agentsDirectory);
    const legacy = path.join(agentsDirectory, "comment-sicko.toml");
    if (conflict === "regular file") await writeFile(legacy, "keep me\n");
    else if (conflict === "foreign symlink") {
      const foreign = path.join(directory, "foreign.toml");
      await writeFile(foreign, "foreign\n");
      await symlink(foreign, legacy);
    } else {
      await symlink(path.join(pluginRoot, "agents", "comment-sicko.toml"), legacy);
      const backup = path.join(codexHome, "backups", "pstack-agent-symlinks", "comment-sicko.toml");
      await mkdir(path.dirname(backup), { recursive: true });
      await writeFile(backup, "keep backup\n");
    }
    const before = await readFile(legacy, "utf8");
    await assert.rejects(installAgents(pluginRoot, codexHome, codexBinary), /Refusing to replace/);
    assert.equal(await readFile(legacy, "utf8"), before);
    await assertMissing(path.join(codexHome, "rpc-log.jsonl"));
  });
}

test("preserves a user role registration pointing elsewhere before moving links", async t => {
  const configuredAgents = { "comment-sicko": { description: "custom", config_file: "/elsewhere/agent.toml" } };
  const { pluginRoot, codexHome, codexBinary } = await fixture(t, { configuredAgents });
  const agentsDirectory = path.join(codexHome, "agents");
  await mkdir(agentsDirectory);
  const legacy = path.join(agentsDirectory, "comment-sicko.toml");
  await symlink(path.join(pluginRoot, "agents", "comment-sicko.toml"), legacy);

  await assert.rejects(installAgents(pluginRoot, codexHome, codexBinary), /config_file: \/elsewhere\/agent\.toml/);
  assert.equal((await lstat(legacy)).isSymbolicLink(), true);
  const log = (await readFile(path.join(codexHome, "rpc-log.jsonl"), "utf8")).trim().split("\n").map(JSON.parse);
  assert.equal(log.some(entry => entry.method === "config/batchWrite"), false);
});

test("preserves a custom description when the registered source matches", async t => {
  const { pluginRoot, codexHome, codexBinary } = await fixture(t);
  const source = await realpath(path.join(pluginRoot, "agents", "comment-sicko.toml"));
  await writeFile(path.join(codexHome, "rpc-state.json"), JSON.stringify({
    version: 0,
    agents: { "comment-sicko": { description: "My description", config_file: source } },
  }));

  await installAgents(pluginRoot, codexHome, codexBinary);
  const state = JSON.parse(await readFile(path.join(codexHome, "rpc-state.json"), "utf8"));
  assert.equal(state.agents["comment-sicko"].description, "My description");
});

test("checks every source before starting Codex or creating backups", async t => {
  for (const options of [{ missingAgent: "comment-sicko" }, { invalidAgent: "comment-sicko" }]) {
    const { pluginRoot, codexHome, codexBinary } = await fixture(t, options);
    await assert.rejects(installAgents(pluginRoot, codexHome, codexBinary), /Agent source (?:does not exist|is not a file)/);
    await assertMissing(path.join(codexHome, "rpc-log.jsonl"));
    await assertMissing(path.join(codexHome, "backups"));
  }
});

test("CLI validates arguments and honors CODEX_HOME", async t => {
  const { pluginRoot, codexHome, codexBinary } = await fixture(t);
  const run = arguments_ => spawnSync(process.execPath, [installer, ...arguments_], {
    encoding: "utf8",
    env: { ...process.env, CODEX_HOME: codexHome },
  });
  for (const arguments_ of [[], ["relative"], [pluginRoot, "relative"], [pluginRoot, codexBinary, codexBinary]]) {
    const result = run(arguments_);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage: node install-agents\.mjs/);
  }
  const result = run([pluginRoot, codexBinary]);
  assert.equal(result.status, 0, result.stderr);
  const state = JSON.parse(await readFile(path.join(codexHome, "rpc-state.json"), "utf8"));
  assert.deepEqual(Object.keys(state.agents).sort(), agentNames.toSorted());
});

test("creates a missing CODEX_HOME and reports a missing Codex binary", async t => {
  const { directory, pluginRoot, codexBinary } = await fixture(t);
  const newCodexHome = path.join(directory, "new-codex-home");
  await installAgents(pluginRoot, newCodexHome, codexBinary);
  const state = JSON.parse(await readFile(path.join(newCodexHome, "rpc-state.json"), "utf8"));
  assert.deepEqual(Object.keys(state.agents).sort(), agentNames.toSorted());

  await assert.rejects(
    installAgents(pluginRoot, path.join(directory, "failed-codex-home"), path.join(directory, "missing-codex")),
    /ENOENT/,
  );
});
