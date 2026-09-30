---
name: setup-pstack
description: Configure PStack models and register its custom Codex agents from a local checkout. Use for $setup-pstack, "configure pstack models", or setting up PStack agents.
---

# Setup pstack

Read [Codex runtime](../../references/codex-runtime.md). This plugin supports OpenAI models only.

Write the `pstack model configuration` section in `~/.codex/AGENTS.md`, which sets pstack's model per role.

## Steps

### 1. Detect available models

Enumerate the OpenAI model slugs and supported reasoning efforts you can pass to a subagent in this session. That is the dependable source. If Codex exposes a supported model list, use it to verify availability. Never write an unverified or non-OpenAI slug. The aliases `inherit-parent` and `auto` are valid only when the parent matches the model and effort required by the role. If no OpenAI model is available, report the blocker.

### 2. Load current state

The default role-to-model mapping is the section shape shown in step 5 below. If `~/.codex/AGENTS.md` already has a `pstack model configuration` section, read it and treat its values as the current choices. Otherwise start from those defaults. Existing role lines pin their recorded pairs, including older defaults. Delete a role line to restore its current default; a rerun preserves explicit choices and validates them against Codex runtime. Report and remove retired role lines from this section.

### 3. Map and confirm

Show each role's model/effort pair. Apply model choices already specified by the user; ask only for an unresolved choice. Code and routine rule-based review roles use Sol/medium; planning, knowledge-heavy analysis, and complex judgment use Astra/low. The `judgment and prose` role is for work requiring deeper knowledge and reasoning; straightforward prose uses Sol/medium. Panel lists contain one entry per independent agent, including repeated pairs. `arena runners` is the code panel, `arena design runners` is the planning panel, and `arena cross-judge pool` supplies one judge. Swarm routes planning and complex judgment through the corresponding roles rather than the code-worker default.

When maintaining this repository's model defaults, update the README's original/current/purpose comparison in the same change. Preserve the imported original-model column.

### 4. Validate

Validate each model/effort pair against the runtime and the role policy in Codex runtime. If the required pair is unavailable, report the blocker. Do not silently change the model or reasoning effort.

### 5. Write the section

Write or replace only the `pstack model configuration` section in `~/.codex/AGENTS.md`, preserving the rest of the file. Record both model and reasoning effort for every role. `hardest tasks` means difficult implementation; its planning and judgment use the separate Astra roles. Shape:

```
## pstack model configuration

# pstack model configuration. One line per role. Delete a line to fall back to the skill default.
# Values are model/effort pairs, passed as separate tool arguments. Inheritance aliases require a matching parent model and effort. Repeated panel entries are independent agents.
planning and architecture: gpt-6-astra/low
feature, refactoring: gpt-6.1-sol/medium
bug-fix: gpt-6.1-sol/medium
perf-issue: gpt-6.1-sol/medium
hillclimb: gpt-6.1-sol/medium
judgment and prose: gpt-6-astra/low
comment sicko: gpt-6.1-sol/medium
hardest tasks: gpt-6.1-sol/medium
how explorer: gpt-6.1-sol/medium
how explainer: gpt-6-astra/low
why investigators: gpt-6.1-sol/medium
why synthesizer: gpt-6-astra/low
reflect tooling: gpt-6-astra/low
reflect judgment, divergent, synthesizer: gpt-6-astra/low
arena runners: gpt-6.1-sol/medium, gpt-6.1-sol/medium, gpt-6.1-sol/medium, gpt-6.1-sol/medium
arena design runners: gpt-6-astra/low, gpt-6.1-sol/medium, gpt-6.1-sol/medium, gpt-6.1-sol/medium
arena cross-judge pool: gpt-6-astra/low
swarm workers: gpt-6.1-sol/medium
architect runners: gpt-6-astra/low, gpt-6.1-sol/medium, gpt-6.1-sol/medium, gpt-6.1-sol/medium
interrogate reviewers: gpt-6-astra/low, gpt-6.1-sol/medium, gpt-6.1-sol/medium, gpt-6.1-sol/medium
```

### 6. Register custom agents

Use a persistent checkout of the PStack repository, not a versioned plugin cache or temporary marketplace snapshot. Accept a checkout path from the user or locate an existing checkout whose Git remote matches the installed PStack repository. If none exists, ask where to keep it. Resolve `<plugin-root>` to that checkout's `plugins/pstack` directory.

Locate the active Codex executable and run the bundled installer with its absolute path. Use `command -v codex` when available; otherwise locate the executable in the installed Codex application.

```sh
node <setup-skill-dir>/scripts/install-agents.mjs <plugin-root> <codex-binary>
```

It registers `poteto-agent` and `comment-sicko` in `${CODEX_HOME:-$HOME/.codex}/config.toml` with canonical `config_file` paths into the checkout. Existing registrations pointing elsewhere, regular agent files, foreign links, and occupied backup paths are preserved and reported as conflicts; ask before replacing them. Matching links from older PStack versions move to `${CODEX_HOME:-$HOME/.codex}/backups/pstack-agent-symlinks/` to prevent duplicate discovery. Keep the checkout in place and pull updates there to update the definitions.

Poteto's model and effort are selected per phase at dispatch; its definition leaves both unset. Comment Sicko fixes Sol/medium. Custom-agent file settings take precedence over dispatch settings, so report conflicting role choices instead of claiming the global role section overrides them.

### 7. Confirm

Report the model section and both registered config paths. Start a new Codex session and launch each role once. Registration and role discovery are not proof that dispatch succeeds. Re-running this skill updates the model section and verifies the registrations without rewriting unchanged config.

### 8. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with $create-verification-skill." On yes, invoke `$create-verification-skill` (resolves wherever pstack is installed: workspace, user, or plugin). On no, move on without pushing.
