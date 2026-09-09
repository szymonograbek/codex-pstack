import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("../", import.meta.url));
const root = path.join(repo, "plugins/pstack");
const manifest = JSON.parse(readFileSync(path.join(root, ".codex-plugin/plugin.json"), "utf8"));
const marketplace = JSON.parse(readFileSync(path.join(repo, ".agents/plugins/marketplace.json"), "utf8"));
assert.equal(manifest.name, "pstack");
assert.equal(marketplace.plugins[0].source.path, "./plugins/pstack");

const names = readdirSync(path.join(root, "skills"));
for (const name of names) {
  const skill = readFileSync(path.join(root, "skills", name, "SKILL.md"), "utf8");
  assert.match(skill, new RegExp(`^---\\nname: ${name}\\n`), name);
  assert.ok(`pstack:${name}`.length <= 64, `Skill identity too long: ${name}`);
}

for (const relative of readdirSync(root, { recursive: true })) {
  if (relative.split(path.sep).includes("node_modules")) continue;
  const file = path.join(root, relative);
  if (!statSync(file).isFile() || !/\.(md|mjs|json|ya?ml)$/.test(file)) continue;
  const source = readFileSync(file, "utf8");
  assert.doesNotMatch(source, /\.cursor\/|api2\.cursor\.sh|generalPurpose|Grok Bot|\b(?:opus|sonnet|haiku|gemini)[- ]\d/i, relative);
  assert.doesNotMatch(source, /~\/\.agents\/skills\/poteto-mode\//, relative);
  if (!relative.endsWith(".md")) continue;
  for (const match of source.matchAll(/\]\(([^\s)]+)\)/g)) {
    const link = match[1].split("#")[0];
    if (!link || link === "url" || /^(?:[a-z]+:|\/|<|\{)/i.test(link)) continue;
    assert.ok(existsSync(path.resolve(path.dirname(file), link)), `${relative}: missing ${link}`);
  }
}

const hooks = JSON.parse(readFileSync(path.join(root, "hooks/hooks.json"), "utf8"));
assert.deepEqual(Object.keys(hooks.hooks).sort(), ["SessionStart", "SubagentStart", "UserPromptSubmit"]);
console.log(`Validated ${names.length} skills, resource links, plugin paths, and hook registration.`);
