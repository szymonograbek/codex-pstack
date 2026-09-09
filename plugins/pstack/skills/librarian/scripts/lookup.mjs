#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);
const REPOSITORY_PART = /^[a-z0-9_.-]+$/i;
const NPM_PACKAGE = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i;

function repositoryCoordinates(owner, rawRepository) {
  const repository = rawRepository.replace(/\.git$/i, "");

  if (!REPOSITORY_PART.test(owner) || !REPOSITORY_PART.test(repository)) {
    return undefined;
  }

  return {
    owner: owner.toLowerCase(),
    repository: repository.toLowerCase(),
  };
}

export function parseGitHubRepository(value) {
  const input = value.trim();
  const scpMatch = /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i.exec(input);

  if (scpMatch) {
    return repositoryCoordinates(scpMatch[1], scpMatch[2]);
  }

  const shorthandMatch = /^(?:github:)?([^/@:]+)\/([^/]+)$/i.exec(input);

  if (shorthandMatch) {
    return repositoryCoordinates(shorthandMatch[1], shorthandMatch[2]);
  }

  let url;

  try {
    url = new URL(input);
  } catch {
    return undefined;
  }

  if (!GITHUB_HOSTS.has(url.hostname.toLowerCase())) {
    return undefined;
  }

  const [owner, repository] = url.pathname.split("/").filter(Boolean);

  if (!owner || !repository) {
    return undefined;
  }

  return repositoryCoordinates(owner, repository);
}

function defaultRun(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const stderr = error && typeof error === "object" && "stderr" in error
      ? String(error.stderr).trim()
      : "";
    const detail = stderr ? `: ${stderr}` : "";

    throw new Error(`${command} failed${detail}`);
  }
}

function npmRepository(packageName, run) {
  if (!NPM_PACKAGE.test(packageName)) {
    throw new Error(`Expected a GitHub URL or npm package name, received: ${packageName}`);
  }

  const output = run("npm", ["view", packageName, "repository", "--json"]);
  let metadata;

  try {
    metadata = JSON.parse(output);
  } catch {
    throw new Error(`npm returned invalid repository metadata for ${packageName}`);
  }

  if (typeof metadata === "string") {
    return metadata;
  }

  if (metadata && typeof metadata === "object" && "url" in metadata && typeof metadata.url === "string") {
    return metadata.url;
  }

  throw new Error(`${packageName} has no repository URL in npm metadata`);
}

function assertClone(path) {
  if (!existsSync(join(path, ".git"))) {
    throw new Error(`Librarian path exists but is not a git clone: ${path}`);
  }
}

function updateClone(path, run) {
  assertClone(path);
  run("git", ["-C", path, "pull", "--ff-only"]);
  return path;
}

export function lookup(input, options = {}) {
  const run = options.run ?? defaultRun;
  const root = resolve(options.home ?? process.env.LIBRARIAN_HOME ?? join(homedir(), ".librarian"));
  const directRepository = parseGitHubRepository(input);
  const repositoryUrl = directRepository ? input : npmRepository(input, run);
  const coordinates = directRepository ?? parseGitHubRepository(repositoryUrl);

  if (!coordinates) {
    throw new Error(`Repository is not hosted on GitHub: ${repositoryUrl}`);
  }

  const destination = join(root, "github.com", coordinates.owner, coordinates.repository);

  if (existsSync(destination)) {
    return updateClone(destination, run);
  }

  mkdirSync(dirname(destination), { recursive: true });

  const temporaryDestination = join(
    dirname(destination),
    `.${basename(destination)}.clone-${process.pid}-${randomUUID()}`,
  );
  const cloneUrl = `https://github.com/${coordinates.owner}/${coordinates.repository}.git`;

  try {
    run("git", ["clone", cloneUrl, temporaryDestination]);
    assertClone(temporaryDestination);

    if (existsSync(destination)) {
      return updateClone(destination, run);
    }

    try {
      renameSync(temporaryDestination, destination);
    } catch (error) {
      if (!existsSync(destination)) {
        throw error;
      }

      updateClone(destination, run);
    }

    return destination;
  } finally {
    rmSync(temporaryDestination, { recursive: true, force: true });
  }
}

function printUsage() {
  console.error("Usage: lookup.mjs <github-url-or-npm-package>");
}

function main() {
  const [input, extra] = process.argv.slice(2);

  if (!input || extra || input === "--help" || input === "-h") {
    printUsage();
    process.exitCode = input === "--help" || input === "-h" ? 0 : 2;
    return;
  }

  try {
    console.log(lookup(input));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`librarian: ${message}`);
    process.exitCode = 1;
  }
}

const entryPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : undefined;

if (entryPath === import.meta.url) {
  main();
}
