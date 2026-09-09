# PStack for Codex

Personal Codex marketplace with the PStack skills from `~/.agents/skills`, their playbooks, agent prompts, and command-line tools. The package also includes Benny.

## Use

Install from GitHub:

```sh
codex plugin marketplace add szymonograbek/codex-pstack --ref main
codex plugin add pstack@personal
```

Start a new Codex thread. Review and trust the PStack hooks in Codex's hook controls, then send `$pstack:poteto-mode` to enable the mode for that session. An activation receipt confirms persistence. `disable $pstack:poteto-mode` disables it. Without trusted hooks, the skill applies only to the current turn.

- `$pstack:setup-pstack` configures OpenAI model choices by role.
- `$pstack:architect`, `$pstack:arena`, `$pstack:swarm`, and `$pstack:interrogate` provide design and review workflows.
- `$pstack:setup-benny` opens the dormant Slack triage and bug-reproduction setup.

Local skill invocation policies are preserved. In particular, most skills remain explicitly invoked, as they were in the source directory. Run `$pstack:setup-pstack` to symlink the custom `poteto-agent` and `comment-sicko` definitions from a persistent repository checkout into `${CODEX_HOME:-$HOME/.codex}/agents/`, then start a new session. Setup preserves conflicting files. Keep that checkout available and pull it when updating the agents. Agent prompts remain under `plugins/pstack/skills/poteto-mode/references/agents/`.

## What changed

The 50 local skills are the primary source. All their supporting files are included except installed dependencies and OS metadata. Benny retains the original report-processing workflows with Codex setup and a shared trigger contract.

The port replaces hardcoded flat-install paths, adds plugin UI metadata, and centralizes Codex model and delegation guidance. Models are OpenAI-only: Astra/medium for planning, knowledge-heavy analysis, and complex judgment; Sol/medium for every code modification and routine rule-based review, including Comment Sicko; Terra/medium for read-only evidence collection; and Luna/high only for optional narrow factual lookups. Adversarial review panels use independent Astra agents; code candidate panels use Sol. Setup verifies availability in the target runtime.

Session hooks use `UserPromptSubmit`, `SessionStart`, and `SubagentStart`. State is scoped by session and project, written atomically under `PLUGIN_DATA`, and retained for resume. The disable command removes that session's state. Hooks do not modify repository files or grant external-write authority.

Benny is an optional source pack. It needs a repository, channels, credentials, adapters, and an execution schedule before use. No jobs or messages are created by plugin installation. Its polling contract requires project-specific durable state and reconciliation before unattended activation.

PStack bundles `control-ui`, `control-cli`, `deslop`, and `librarian`, including Librarian's lookup helper and tests. Existing local installations are retained; PStack workflows use the bundled copies. Codex's built-in skill authoring tools, app-specific verification skills, and Benny's configured service adapters remain environment dependencies.

## Validate and update

```sh
npm test
npm run check
cd plugins/pstack/skills/poteto-mode/scripts
bun install --frozen-lockfile
GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=commit.gpgsign GIT_CONFIG_VALUE_0=false bun test orch watch-pr
bun run typecheck
```

The Git setting disables signing only for temporary test repositories. It does not change user configuration.

After editing the plugin, run the Codex plugin-creator cachebuster helper, reinstall `pstack@personal`, and start a new thread. Recheck hook trust when hook definitions change. Edit source files here, not Codex's installed cache.

## Sources

- [Original PStack](https://github.com/cursor/plugins/tree/df3fb154fb982fb83f649de8646d4af6a0cb16b3/pstack), MIT, Lauren Tan.
- [Codex hooks](https://learn.chatgpt.com/docs/hooks) and [plugins](https://learn.chatgpt.com/docs/plugins). Plugin hooks require trust, use the standard event schema, and receive `PLUGIN_ROOT` and `PLUGIN_DATA`.

`sources.json` records imported files and their original hashes. The upstream license is included inside the plugin. Guide screenshots, upstream development plans, scanner reports, duplicate docs, and vendored dependencies are excluded.
