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

Local skill invocation policies are preserved. In particular, most skills remain explicitly invoked, as they were in the source directory. Run `$pstack:setup-pstack` to register the custom `poteto-agent` and `comment-sicko` definitions from a persistent repository checkout in `${CODEX_HOME:-$HOME/.codex}/config.toml`, then start a new session and launch each role once to verify dispatch. Setup preserves conflicting registrations and agent files, and backs up matching links from older versions. Keep that checkout available and pull it when updating the agents. Agent prompts remain under `plugins/pstack/skills/poteto-mode/references/agents/`.

## What changed

The 50 local skills are the primary source. All their supporting files are included except installed dependencies and OS metadata. Benny retains the original report-processing workflows with Codex setup and a shared trigger contract.

The port replaces hardcoded flat-install paths, adds plugin UI metadata, and centralizes Codex model and delegation guidance. Models are OpenAI-only: GPT-6 Astra/low for planning, knowledge-heavy analysis, and complex judgment; GPT-6.1 Sol/medium for every code modification, routine rule-based review, and read-only evidence collection, including Comment Sicko; and GPT-6 Luna/high only for optional narrow factual lookups. Four-agent design and adversarial review panels use one GPT-6 Astra/low and three GPT-6.1 Sol/medium agents; code candidate panels use four GPT-6.1 Sol/medium agents. Setup verifies availability in the target runtime.

Session hooks use `UserPromptSubmit` and `SessionStart`. State is scoped by session and project, written atomically under `PLUGIN_DATA`, and retained for resume. The disable command removes that session's state. Custom agents load their own instructions; hooks do not inject context into subagents, modify repository files, or grant external-write authority.

Benny is an optional source pack. It needs a repository, channels, credentials, adapters, and an execution schedule before use. No jobs or messages are created by plugin installation. Its polling contract requires project-specific durable state and reconciliation before unattended activation.

PStack bundles `control-ui`, `control-cli`, `deslop`, and `librarian`, including Librarian's lookup helper and tests. Existing local installations are retained; PStack workflows use the bundled copies. Codex's built-in skill authoring tools, app-specific verification skills, and Benny's configured service adapters remain environment dependencies.

## Model reference

Original means the defaults in [the imported PStack revision](https://github.com/cursor/plugins/tree/df3fb154fb982fb83f649de8646d4af6a0cb16b3/pstack), not current upstream. Keep this table synchronized with model changes; preserve the original column. Current pairs show model / reasoning effort. Higher Astra effort requires explicit user approval. Agent counts are unchanged.

| Purpose | Original model / effort | Our default model / effort |
|---|---|---|
| Feature implementation, refactoring | Grok 4.6 Fast / xhigh | GPT-6.1 Sol / medium |
| Bug fixes | Fable 5.1 / max | GPT-6.1 Sol / medium |
| Performance fixes | Fable 5.1 / max | GPT-6.1 Sol / medium |
| Hillclimbing | Fable 5.1 / max | GPT-6.1 Sol / medium |
| Hardest implementation tasks | Fable 5.1 / max | GPT-6.1 Sol / medium |
| Individual planning and complex judgment | Fable 5.1 / max judgment default; no separate planning role | GPT-6 Astra / low |
| Substantive prose | Fable 5.1 / max | GPT-6 Astra / low |
| Routine rule-based review and straightforward prose | No separate role | GPT-6.1 Sol / medium |
| How: code exploration | Grok 4.6 Fast / xhigh | GPT-6.1 Sol / medium |
| How: explanation | Fable 5.1 / max | GPT-6 Astra / low |
| Why: investigation | Grok 4.6 Fast / xhigh | GPT-6.1 Sol / medium |
| Why: synthesis | Fable 5.1 / max | GPT-6 Astra / low |
| Reflect: tooling review | Sol / max | GPT-6 Astra / low |
| Reflect: judgment, divergent review, synthesis | Fable 5.1 / max | GPT-6 Astra / low per role |
| Arena: code candidates | Original four-model panel below | 4 × GPT-6.1 Sol / medium |
| Arena: design candidates | Original four-model panel below | 1 × GPT-6 Astra / low + 3 × GPT-6.1 Sol / medium |
| Arena: cross-judge | One from original pool; prefer a different family from the parent | 1 × GPT-6 Astra / low |
| Swarm: default execution workers | Grok 4.6 Fast / xhigh | GPT-6.1 Sol / medium; count follows task |
| Architect: design candidates | Original four-model panel below | 1 × GPT-6 Astra / low + 3 × GPT-6.1 Sol / medium |
| Interrogate: adversarial reviewers | Original four-model panel below | 1 × GPT-6 Astra / low + 3 × GPT-6.1 Sol / medium |
| Multi-phase live verification | 10 × Grok 4.6 Fast / xhigh | 10 × GPT-6.1 Sol / medium |
| Complex verification, audit, eval judge | Independent reviewer; different model family | GPT-6 Astra / low |
| Comment Sicko | Unspecified | GPT-6.1 Sol / medium |
| Poteto custom agent | Unspecified | Model and effort selected per phase |
| Benny: triage, reproduction, media review | User-selected placeholders | GPT-6 Astra / low |
| Benny: code changes | User-selected placeholder | GPT-6.1 Sol / medium |
| Optional narrow factual lookup | No separate role | GPT-6 Luna / high |

The original four-model panel contained `claude-fable-5-1-thinking-max`, `gpt-5.6-sol-max`, `grok-4.6-fast-xhigh`, and `claude-opus-5-thinking-xhigh`. Our model names are `gpt-6-astra`, `gpt-6.1-sol`, and `gpt-6-luna`. Panel members run independently; model/effort pairs are passed as separate dispatch arguments. Additional judges and synthesis phases retain their existing counts.

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
- Reviewed through [PStack 0.15.5](https://github.com/cursor/plugins/commit/fae2c6ed95821bd85f614a73e4842e13229fa5e5). Ported verification rounds from code-ready heads, SHA and measurement receipts, append-only audit corrections, safe log initialization, and instruction cleanup. Codex runtime adaptations, fixed model/effort pairs, and agent counts remain. Upstream's blanket reasoning-budget rewrite is excluded because it conflicts with those pairs and approval for higher Astra effort.
- [Codex hooks](https://learn.chatgpt.com/docs/hooks) and [plugins](https://learn.chatgpt.com/docs/plugins). Plugin hooks require trust, use the standard event schema, and receive `PLUGIN_ROOT` and `PLUGIN_DATA`.

`sources.json` records imported files and their original hashes. The upstream license is included inside the plugin. Guide screenshots, upstream development plans, scanner reports, duplicate docs, and vendored dependencies are excluded.
