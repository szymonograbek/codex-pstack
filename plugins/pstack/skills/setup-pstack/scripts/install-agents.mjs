#!/usr/bin/env node

import { lstat, mkdir, readlink, stat, symlink } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const agentNames = ["poteto-agent.toml", "comment-sicko.toml"];

function isMissing(error) {
  return error !== null
    && typeof error === "object"
    && "code" in error
    && error.code === "ENOENT";
}

async function requireSource(source) {
  try {
    await stat(source);
  } catch (error) {
    if (isMissing(error)) {
      throw new Error(`Agent source does not exist: ${source}`, { cause: error });
    }
    throw error;
  }
}

async function inspectDestination(source, destination) {
  let destinationStat;
  try {
    destinationStat = await lstat(destination);
  } catch (error) {
    if (isMissing(error)) return false;
    throw error;
  }

  if (!destinationStat.isSymbolicLink()) {
    throw new Error(`Refusing to replace existing file: ${destination}`);
  }

  const currentTarget = await readlink(destination);
  const resolvedTarget = path.resolve(path.dirname(destination), currentTarget);
  if (resolvedTarget !== source) {
    throw new Error(`Refusing to replace existing symlink: ${destination}`);
  }

  return true;
}

export async function installAgents(pluginRoot, agentsDirectory) {
  const resolvedPluginRoot = path.resolve(pluginRoot);
  const resolvedAgentsDirectory = path.resolve(agentsDirectory);
  const agents = agentNames.map(name => ({
    source: path.join(resolvedPluginRoot, "agents", name),
    destination: path.join(resolvedAgentsDirectory, name),
  }));

  await Promise.all(agents.map(({ source }) => requireSource(source)));
  const installed = await Promise.all(
    agents.map(({ source, destination }) => inspectDestination(source, destination)),
  );

  await mkdir(resolvedAgentsDirectory, { recursive: true });
  await Promise.all(agents.map(({ source, destination }, index) => {
    if (installed[index]) return undefined;
    return symlink(source, destination);
  }));
}

async function runCli() {
  const arguments_ = process.argv.slice(2);
  if (arguments_.length !== 1 || !path.isAbsolute(arguments_[0])) {
    throw new Error("Usage: node install-agents.mjs <absolute-plugin-root>");
  }

  const codexHome = process.env.CODEX_HOME || path.join(homedir(), ".codex");
  await installAgents(arguments_[0], path.join(codexHome, "agents"));
}

const invokedPath = process.argv[1];
if (invokedPath && path.resolve(invokedPath) === fileURLToPath(import.meta.url)) {
  runCli().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
