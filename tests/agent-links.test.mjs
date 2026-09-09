import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
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
const agentNames = ["poteto-agent.toml", "comment-sicko.toml"];

async function fixture(t, missingAgent) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "pstack-agent-links-"));
  t.after(() => rm(directory, { recursive: true, force: true }));

  const pluginRoot = path.join(directory, "plugin");
  const sourceDirectory = path.join(pluginRoot, "agents");
  const agentsDirectory = path.join(directory, "codex", "agents");
  await mkdir(sourceDirectory, { recursive: true });
  await Promise.all(agentNames.map(name => {
    if (name === missingAgent) return undefined;
    return writeFile(path.join(sourceDirectory, name), `name = "${name}"\n`);
  }));

  return { directory, pluginRoot, agentsDirectory };
}

async function assertMissing(file) {
  await assert.rejects(lstat(file), error => error.code === "ENOENT");
}

test("installs resolvable agent links and is idempotent", async t => {
  const { pluginRoot, agentsDirectory } = await fixture(t);

  await installAgents(pluginRoot, agentsDirectory);
  const firstStats = await Promise.all(agentNames.map(async name => {
    const source = path.join(pluginRoot, "agents", name);
    const destination = path.join(agentsDirectory, name);
    assert.equal((await lstat(destination)).isSymbolicLink(), true);
    assert.equal(await realpath(destination), await realpath(source));
    assert.equal(await readFile(destination, "utf8"), `name = "${name}"\n`);
    return lstat(destination);
  }));

  await installAgents(pluginRoot, agentsDirectory);
  const secondStats = await Promise.all(
    agentNames.map(name => lstat(path.join(agentsDirectory, name))),
  );
  assert.deepEqual(secondStats.map(entry => entry.ino), firstStats.map(entry => entry.ino));
});

test("checks every source before creating the destination", async t => {
  const { pluginRoot, agentsDirectory } = await fixture(t, "comment-sicko.toml");

  await assert.rejects(
    installAgents(pluginRoot, agentsDirectory),
    /Agent source does not exist: .*comment-sicko\.toml/,
  );
  await assertMissing(agentsDirectory);
});

test("preserves a regular-file conflict without installing another link", async t => {
  const { pluginRoot, agentsDirectory } = await fixture(t);
  await mkdir(agentsDirectory, { recursive: true });
  const conflict = path.join(agentsDirectory, "comment-sicko.toml");
  await writeFile(conflict, "keep me\n");

  await assert.rejects(installAgents(pluginRoot, agentsDirectory), /Refusing to replace existing file/);
  assert.equal(await readFile(conflict, "utf8"), "keep me\n");
  await assertMissing(path.join(agentsDirectory, "poteto-agent.toml"));
});

test("preserves a foreign symlink without installing another link", async t => {
  const { directory, pluginRoot, agentsDirectory } = await fixture(t);
  await mkdir(agentsDirectory, { recursive: true });
  const foreign = path.join(directory, "foreign.toml");
  const conflict = path.join(agentsDirectory, "comment-sicko.toml");
  await writeFile(foreign, "foreign\n");
  await symlink(foreign, conflict);

  await assert.rejects(installAgents(pluginRoot, agentsDirectory), /Refusing to replace existing symlink/);
  assert.equal(await readlink(conflict), foreign);
  await assertMissing(path.join(agentsDirectory, "poteto-agent.toml"));
});

test("CLI validates its source argument and installs under CODEX_HOME", async t => {
  const { directory, pluginRoot } = await fixture(t);
  const codexHome = path.join(directory, "cli-codex-home");
  const run = arguments_ => spawnSync(process.execPath, [installer, ...arguments_], {
    encoding: "utf8",
    env: { ...process.env, CODEX_HOME: codexHome },
  });

  for (const arguments_ of [[], ["relative"], [pluginRoot, pluginRoot]]) {
    const result = run(arguments_);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage: node install-agents\.mjs <absolute-plugin-root>/);
  }

  const result = run([pluginRoot]);
  assert.equal(result.status, 0, result.stderr);
  for (const name of agentNames) {
    assert.equal(
      await realpath(path.join(codexHome, "agents", name)),
      await realpath(path.join(pluginRoot, "agents", name)),
    );
  }
});
