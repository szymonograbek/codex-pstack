---
name: deslop
description: Remove AI-generated code slop and clean up code style
---

# Remove AI code slop

Read the applicable `AGENTS.md` files first. Resolve the actual review base from an existing PR, explicit user input, or branch ancestry. Do not assume `main`. Check the complete base-to-head diff and remove code slop introduced by that diff.

## Focus Areas

- Extra comments that are unnecessary or inconsistent with local style
- Defensive checks or try/catch blocks that are abnormal for trusted code paths
- Casts to `any` used only to bypass type issues
- Deeply nested code that should be simplified with early returns
- Other patterns inconsistent with the file and surrounding codebase

## Guardrails

- Keep behavior unchanged unless fixing a clear bug.
- Prefer minimal, focused edits over broad rewrites.
- Do not change generated or vendored files unless their source is in scope.
- Do not commit, push, or update a PR unless the user asked for that delivery action.
- Keep the final summary concise (1-3 sentences).
