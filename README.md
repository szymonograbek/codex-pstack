# PStack for Codex

Personal Codex marketplace with the PStack skills from `~/.agents/skills`, their playbooks, agent prompts, and command-line tools. The package also includes Benny.

## Use

Install from GitHub:

```sh
codex plugin marketplace add szymonograbek/codex-pstack --ref main
codex plugin add pstack@personal
```

Start a new Codex thread. Review and trust the PStack hooks in Codex's hook controls, then include `$pstack:poteto-mode` anywhere in prompt prose to enable the mode for that session. Linked skill mentions work too; inline and fenced code examples do not activate it. An activation receipt confirms persistence. `disable $pstack:poteto-mode` disables it. Without trusted hooks, the skill applies only to the current turn.

- `$pstack:setup-pstack` configures OpenAI model choices by role.
- `$pstack:architect`, `$pstack:arena`, `$pstack:swarm`, and `$pstack:interrogate` provide design and review workflows.
- `$pstack:setup-benny` opens the dormant Slack triage and bug-reproduction setup.

Local skill invocation policies are preserved. In particular, most skills remain explicitly invoked, as they were in the source directory. Run `$pstack:setup-pstack` to symlink the custom `poteto-agent` and `comment-sicko` definitions from a persistent repository checkout into `${CODEX_HOME:-$HOME/.codex}/agents/`, then start a new session. Setup preserves conflicting files. Keep that checkout available and pull it when updating the agents. Agent prompts remain under `plugins/pstack/skills/poteto-mode/references/agents/`.

## What changed

The 50 local skills are the primary source. All their supporting files are included except installed dependencies and OS metadata. Benny retains the original report-processing workflows with Codex setup and a shared trigger contract.

The port replaces hardcoded flat-install paths, adds plugin UI metadata, and centralizes Codex model and delegation guidance. Models are OpenAI-only: Astra/low for planning, knowledge-heavy analysis, and complex judgment; Sol/medium for every code modification and routine rule-based review, including Comment Sicko; Terra/medium for read-only evidence collection; and Luna/high only for optional narrow factual lookups. Four-agent design and adversarial review panels use one Astra/low and three Sol/medium agents; code candidate panels use four Sol/medium agents. Setup verifies availability in the target runtime.

Session hooks use `UserPromptSubmit` and `SessionStart`. State is scoped by session and project, written atomically under `PLUGIN_DATA`, and retained for resume. The disable command removes that session's state. Custom agents load their own instructions; hooks do not inject context into subagents, modify repository files, or grant external-write authority.

Benny is an optional source pack. It needs a repository, channels, credentials, adapters, and an execution schedule before use. No jobs or messages are created by plugin installation. Its polling contract requires project-specific durable state and reconciliation before unattended activation.

PStack bundles `control-ui`, `control-cli`, `deslop`, and `librarian`, including Librarian's lookup helper and tests. Existing local installations are retained; PStack workflows use the bundled copies. Codex's built-in skill authoring tools, app-specific verification skills, and Benny's configured service adapters remain environment dependencies.

## Model reference

Original means the defaults in [the imported PStack revision](https://github.com/cursor/plugins/tree/df3fb154fb982fb83f649de8646d4af6a0cb16b3/pstack), not current upstream. Keep this table synchronized with model changes; preserve the original column. Current pairs show model / reasoning effort. Higher Astra effort requires explicit user approval. Agent counts are unchanged.

| Purpose | Original model / effort | Our default model / effort |
|---|---|---|
| Feature implementation, refactoring | Grok 4.6 Fast / xhigh | Sol / medium |
| Bug fixes | Fable 5.1 / max | Sol / medium |
| Performance fixes | Fable 5.1 / max | Sol / medium |
| Hillclimbing | Fable 5.1 / max | Sol / medium |
| Hardest implementation tasks | Fable 5.1 / max | Sol / medium |
| Individual planning and complex judgment | Fable 5.1 / max judgment default; no separate planning role | Astra / low |
| Substantive prose | Fable 5.1 / max | Astra / low |
| Routine rule-based review and straightforward prose | No separate role | Sol / medium |
| How: code exploration | Grok 4.6 Fast / xhigh | Terra / medium |
| How: explanation | Fable 5.1 / max | Astra / low |
| Why: investigation | Grok 4.6 Fast / xhigh | Terra / medium |
| Why: synthesis | Fable 5.1 / max | Astra / low |
| Reflect: tooling review | Sol / max | Astra / low |
| Reflect: judgment, divergent review, synthesis | Fable 5.1 / max | Astra / low per role |
| Arena: code candidates | Original four-model panel below | 4 × Sol / medium |
| Arena: design candidates | Original four-model panel below | 1 × Astra / low + 3 × Sol / medium |
| Arena: cross-judge | One from original pool; prefer a different family from the parent | 1 × Astra / low |
| Swarm: default execution workers | Grok 4.6 Fast / xhigh | Sol / medium; count follows task |
| Architect: design candidates | Original four-model panel below | 1 × Astra / low + 3 × Sol / medium |
| Interrogate: adversarial reviewers | Original four-model panel below | 1 × Astra / low + 3 × Sol / medium |
| Multi-phase live verification | 10 × Grok 4.6 Fast / xhigh | 10 × Sol / medium |
| Complex verification, audit, eval judge | Independent reviewer; different model family | Astra / low |
| Comment Sicko | Unspecified | Sol / medium |
| Poteto custom agent | Unspecified | Model and effort selected per phase |
| Benny: triage, reproduction, media review | User-selected placeholders | Astra / low |
| Benny: code changes | User-selected placeholder | Sol / medium |
| Optional narrow factual lookup | No separate role | Luna / high |

The original four-model panel contained `claude-fable-5-1-thinking-max`, `gpt-5.6-sol-max`, `grok-4.6-fast-xhigh`, and `claude-opus-5-thinking-xhigh`. Our model names expand to `gpt-6-astra`, `gpt-5.6-sol`, `gpt-5.6-terra`, and `gpt-5.6-luna`. Panel members run independently; model/effort pairs are passed as separate dispatch arguments. Additional judges and synthesis phases retain their existing counts.

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
- Reviewed through [PStack 0.15.1](https://github.com/cursor/plugins/commit/f8abeddd1862dc73704e3d719dd73df0d51b8c71). Its evidence-or-label rule was already present in our imported local skill; no additional behavior change was needed.
- [Codex hooks](https://learn.chatgpt.com/docs/hooks) and [plugins](https://learn.chatgpt.com/docs/plugins). Plugin hooks require trust, use the standard event schema, and receive `PLUGIN_ROOT` and `PLUGIN_DATA`.

`sources.json` records imported files and their original hashes. The upstream license is included inside the plugin. Guide screenshots, upstream development plans, scanner reports, duplicate docs, and vendored dependencies are excluded.
