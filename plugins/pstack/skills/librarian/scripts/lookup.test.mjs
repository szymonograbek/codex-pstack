import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { lookup, parseGitHubRepository } from "./lookup.mjs";

function fakeCommands(repositoryUrl = "git+https://github.com/Effect-TS/effect.git") {
  const calls = [];

  return {
    calls,
    run(command, args) {
      calls.push([command, ...args]);

      if (command === "npm") {
        return JSON.stringify({ type: "git", url: repositoryUrl });
      }

      if (args[0] === "clone") {
        const destination = args[2];
        mkdirSync(join(destination, ".git"), { recursive: true });
        writeFileSync(join(destination, "README.md"), "reference clone\n");
      }

      return "";
    },
  };
}

test("parses GitHub repository links and nested paths", () => {
  assert.deepEqual(
    parseGitHubRepository("https://github.com/Effect-TS/effect/tree/main/packages/effect"),
    { owner: "effect-ts", repository: "effect" },
  );
  assert.deepEqual(
    parseGitHubRepository("git@github.com:Effect-TS/effect.git"),
    { owner: "effect-ts", repository: "effect" },
  );
});

test("clones a GitHub URL once and updates the cached clone", () => {
  const home = mkdtempSync(join(tmpdir(), "librarian-test-"));
  const commands = fakeCommands();

  const first = lookup("https://github.com/Effect-TS/effect", { home, run: commands.run });
  const second = lookup("https://github.com/Effect-TS/effect", { home, run: commands.run });

  assert.equal(first, join(home, "github.com", "effect-ts", "effect"));
  assert.equal(second, first);
  assert.deepEqual(
    commands.calls.filter(([command]) => command === "git"),
    [
      ["git", "clone", "https://github.com/effect-ts/effect.git", commands.calls[0][3]],
      ["git", "-C", first, "pull", "--ff-only"],
    ],
  );
});

test("resolves an npm package through repository metadata", () => {
  const home = mkdtempSync(join(tmpdir(), "librarian-test-"));
  const commands = fakeCommands();

  const path = lookup("effect", { home, run: commands.run });

  assert.equal(path, join(home, "github.com", "effect-ts", "effect"));
  assert.deepEqual(commands.calls[0], ["npm", "view", "effect", "repository", "--json"]);
});

test("rejects npm repositories hosted elsewhere", () => {
  const home = mkdtempSync(join(tmpdir(), "librarian-test-"));
  const commands = fakeCommands("https://gitlab.com/example/project.git");

  assert.throws(
    () => lookup("example-package", { home, run: commands.run }),
    /not hosted on GitHub/,
  );
});

test("refuses to replace a non-git cache directory", () => {
  const home = mkdtempSync(join(tmpdir(), "librarian-test-"));
  const destination = join(home, "github.com", "effect-ts", "effect");
  mkdirSync(destination, { recursive: true });

  assert.throws(
    () => lookup("https://github.com/Effect-TS/effect", { home, run: fakeCommands().run }),
    /not a git clone/,
  );
});
