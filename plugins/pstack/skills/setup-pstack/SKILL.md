---
name: setup-pstack
description: Configure which models pstack uses per role. Detects your available models and writes an always-applied rule that overrides the skill defaults. Use for $setup-pstack, "configure pstack models", or changing pstack's model choices.
---

# Setup pstack

Read [Codex runtime](../../references/codex-runtime.md). This plugin supports OpenAI models only.

Write the `pstack model configuration` section in `~/.codex/AGENTS.md`, which sets pstack's model per role.

## Steps

### 1. Detect available models

Enumerate the OpenAI model slugs and supported reasoning efforts you can pass to a subagent in this session. That is the dependable source. If Codex exposes a supported model list, use it to verify availability. Never write an unverified or non-OpenAI slug. The aliases `inherit-parent` and `auto` are valid only when the parent matches the model and effort required by the role. If no OpenAI model is available, report the blocker.

### 2. Load current state

The default role-to-model mapping is the section shape shown in step 5 below. If `~/.codex/AGENTS.md` already has a `pstack model configuration` section, read it and treat its values as the current choices. Otherwise start from those defaults.

### 3. Map and confirm

Show each role's model/effort pair. Apply model choices already specified by the user; ask only for an unresolved choice. Code and routine rule-based review roles use Sol/medium; planning, knowledge-heavy analysis, and complex judgment use Astra/medium. The `judgment and prose` role is for work requiring deeper knowledge and reasoning; straightforward prose uses Sol/medium. Panel lists contain one entry per independent agent, including repeated pairs. `arena runners` is the code panel, `arena design runners` is the planning panel, and `arena cross-judge pool` supplies one judge. Swarm routes planning and complex judgment through the corresponding roles rather than the code-worker default.

### 4. Validate

Validate each model/effort pair against the runtime and the role policy in Codex runtime. If the required pair is unavailable, report the blocker. Do not silently change the model or reasoning effort.

### 5. Write the section

Write or replace only the `pstack model configuration` section in `~/.codex/AGENTS.md`, preserving the rest of the file. Record both model and reasoning effort for every role. `hardest tasks` means difficult implementation; its planning and judgment use the separate Astra roles. Shape:

```
## pstack model configuration

# pstack model configuration. One line per role. Delete a line to fall back to the skill default.
# Values are model/effort pairs, passed as separate tool arguments. Inheritance aliases require a matching parent model and effort. Repeated panel entries are independent agents.
planning and architecture: gpt-6-astra/medium
feature, refactoring: gpt-5.6-sol/medium
bug-fix: gpt-5.6-sol/medium
perf-issue: gpt-5.6-sol/medium
hillclimb: gpt-5.6-sol/medium
judgment and prose: gpt-6-astra/medium
comment sicko: gpt-5.6-sol/medium
hardest tasks: gpt-5.6-sol/medium
how explorer: gpt-5.6-terra/medium
how explainer: gpt-6-astra/medium
why investigators: gpt-5.6-terra/medium
why synthesizer: gpt-6-astra/medium
reflect tooling: gpt-6-astra/medium
reflect judgment, divergent, synthesizer: gpt-6-astra/medium
arena runners: gpt-5.6-sol/medium, gpt-5.6-sol/medium, gpt-5.6-sol/medium, gpt-5.6-sol/medium
arena design runners: gpt-6-astra/medium, gpt-6-astra/medium, gpt-6-astra/medium, gpt-6-astra/medium
arena cross-judge pool: gpt-6-astra/medium
swarm workers: gpt-5.6-sol/medium
architect runners: gpt-6-astra/medium, gpt-6-astra/medium, gpt-6-astra/medium, gpt-6-astra/medium
interrogate reviewers: gpt-6-astra/medium, gpt-6-astra/medium, gpt-6-astra/medium, gpt-6-astra/medium
```

### 6. Confirm

Tell the user the section was written and that it applies to new sessions. Re-running this skill updates it.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with $create-verification-skill." On yes, invoke `$create-verification-skill` (resolves wherever pstack is installed: workspace, user, or plugin). On no, move on without pushing.
