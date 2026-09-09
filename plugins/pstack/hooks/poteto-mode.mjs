#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const invocation = /^\s*\$(?:pstack:)?poteto-mode(?:\s|$)/u;
const linkedInvocation = /^\s*\[\$(?:pstack:)?poteto-mode\]\(([^\n]+)\)(?:\s|$)/u;
const disable = /^\s*disable \$(?:pstack:)?poteto-mode[.!]?\s*$/iu;
const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function activates(prompt, root) {
  if (invocation.test(prompt)) return true;
  const linkedPath = linkedInvocation.exec(prompt)?.[1];
  return linkedPath === path.join(root, "skills/poteto-mode/SKILL.md");
}

export async function handleHook(input, { dataDirectory, root = pluginRoot } = {}) {
  if (!input || typeof input.session_id !== "string" || !input.session_id ||
      typeof input.cwd !== "string" || !path.isAbsolute(input.cwd) ||
      typeof dataDirectory !== "string" || !path.isAbsolute(dataDirectory)) return null;

  const event = input.hook_event_name;
  if (!["UserPromptSubmit", "SessionStart", "SubagentStart"].includes(event)) return null;
  if (event === "SessionStart" && !["resume", "compact"].includes(input.source)) return null;
  const key = createHash("sha256").update(JSON.stringify([input.session_id, path.resolve(input.cwd)])).digest("hex");
  const directory = path.join(dataDirectory, "poteto-mode");
  const statePath = path.join(directory, `${key}.json`);
  const prompt = typeof input.prompt === "string" ? input.prompt : "";

  if (event === "UserPromptSubmit" && disable.test(prompt)) {
    await rm(statePath, { force: true });
    return context(event, "Poteto Mode is disabled for this session. Stop applying the mode unless the user enables it again.");
  }

  const activating = event === "UserPromptSubmit" && activates(prompt, root);
  if (activating) {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const temporary = `${statePath}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify({ version: 1, active: true }), { mode: 0o600, flag: "wx" });
      await rename(temporary, statePath);
    } finally {
      await rm(temporary, { force: true });
    }
  } else {
    let state;
    try {
      state = JSON.parse(await readFile(statePath, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT" || error instanceof SyntaxError) return null;
      throw error;
    }
    if (state?.version !== 1 || state.active !== true) return null;
  }

  const runtime = path.join(root, "references/codex-runtime.md");
  if (event === "SubagentStart") {
    return context(event, `The parent session uses PStack. Read ${runtime}. Follow the assigned role and its prompt file; preserve the parent's task scope.`);
  }
  const skill = path.join(root, "skills/poteto-mode/SKILL.md");
  return context(event, `${activating ? "Poteto Mode activation receipt: session persistence is enabled." : "Poteto Mode remains active for this session."} Read ${skill} and ${runtime}. Apply the user's current request and authority limits.`);
}

function context(event, additionalContext) {
  return { hookSpecificOutput: { hookEventName: event, additionalContext } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    let source = "";
    for await (const chunk of process.stdin) source += chunk;
    const input = JSON.parse(source);
    const output = await handleHook(input, { dataDirectory: process.env.PLUGIN_DATA });
    if (output) process.stdout.write(`${JSON.stringify(output)}\n`);
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      process.stderr.write(`PStack session hook failed: ${error.message}\n`);
      process.exitCode = 1;
    }
  }
}
