# Codex runtime

Resolve resources from the installed skill's `SKILL.md` directory. Resolve another bundled skill as `../<skill>/SKILL.md`. When writing a plan or a subagent brief, expand resource paths to absolute paths in the current installation. Never assume a plugin cache location or use the former flat PStack installation path.

Resolve named PStack skills from this plugin before looking for standalone installations. This includes `control-ui`, `control-cli`, `deslop`, and `librarian`. Use the bundled Librarian skill for dependency source lookups. Codex's built-in `skill-creator` and project-specific skills or service adapters remain environment-provided.

Use the available Codex subagent tools. Give each child its goal, scope, constraints, resource paths, and completion criteria. Setup links the bundled `poteto-agent` and `comment-sicko` definitions into Codex's personal agents directory. For calls requiring either role, select that named custom agent and pass the prompt path required by the calling skill. If the runtime does not expose the role, report that setup and a new session are required; do not claim a generic agent is the registered role. Other roles still use generic agents. Isolate concurrent writers in separate worktrees or exclusive paths. Batch work within the available agent limit; a requested panel size does not increase runtime capacity.

## Models and reasoning

Use only OpenAI models exposed by the current runtime. Select by the work being done:

| Purpose | Model | Reasoning effort |
|---|---|---|
| Planning, architecture, knowledge-heavy analysis and synthesis, complex diagnosis, and judgment-intensive review | `gpt-6-astra` | `low` |
| Routine rule-based review, including Comment Sicko, and straightforward prose | `gpt-5.6-sol` | `medium` |
| Every code modification, including implementation, refactoring, bug fixes, performance changes, tests, and integration | `gpt-5.6-sol` | `medium` |
| Read-only exploration and evidence collection, without a verdict | `gpt-5.6-terra` | `medium` |
| Optional narrow factual lookups, when explicitly selected | `gpt-5.6-luna` | `high` |

Astra defaults to low effort. Higher effort requires explicit user approval. Keep existing agent counts; mix models rather than reducing fan-out. Sol/medium is also valid for the three Sol slots in design and review panels.

Astra is for work that benefits from deeper knowledge and reasoning, not every task called a review or judgment. A mixed task separates that analysis and planning from code changes on Sol. This also applies to difficult code, mechanical edits, code generated during design, and edits that integrate review findings. Design runners return plans and pseudocode; Sol applies the resulting code. Four-agent design and adversarial review panels use one Astra/low and three Sol/medium agents. Sol handles routine rule checks and verification; use Astra when interpreting evidence requires complex reasoning.

Role settings in `~/.codex/AGENTS.md` use `model/effort` pairs. Split the pair into the tool's separate `model` and `reasoning_effort` arguments; never pass the joined pair as a model slug. Set both explicitly on every dispatch. A legacy model-only setting uses the effort in the table. Validate the pair against the runtime before dispatch. Report a blocker if the required model or effort is unavailable; do not silently substitute a different family or effort.

When the parent is not using the model and effort required for a phase, delegate that phase to a matching agent with a complete brief and use its result. The `auto` and `inherit-parent` aliases are valid only when the parent matches the phase's required OpenAI model and effort. More specific user choices override this table.

When the spawn tool requires a fresh context to override a model, use a fresh child and include the complete brief. Resume a child through the runtime's follow-up tool. Use its wait mechanism to collect results.

The user's task and repository instructions define authority. A workflow does not authorize commits, pushes, PRs, messages, deployments, new goals, or scheduled tasks by itself. Use the runtime's goal or recurring-task mechanism only when the user has requested that lifecycle.

Poteto Mode persists only after its trusted hook emits an activation receipt. Without that receipt, apply the requested skill for the current turn and report that session persistence is unavailable. A subagent brief must still provide the intended role and prompt path; a hook is not a substitute for that brief.
