---
name: interrogate
description: "Use for interrogate, adversarial review, challenge this, stress test this code, or find blind spots. Independent mixed-model reviewers challenge changes and return a judged verdict."
---

# Interrogate

Read [Codex runtime](../../references/codex-runtime.md) before delegating.

Spawn one independent reviewer per configured entry to adversarially review code changes. Each reviewer gets the same prompt and rubric and works without seeing the other reviews.

The deliverable is a synthesized verdict. Do NOT auto-apply changes.

## Step 1, Determine Scope

Identify what to review from context:

- If the user points at specific files or a diff, use that
- If on a feature branch, run `git diff main...HEAD` (or the appropriate base branch) for the full changeset
- If the user's message references recent work, gather the relevant files

Package the diff (or file contents) plus any surrounding context files the reviewers need to understand the code.

## Step 2, State the Intent

Before spawning reviewers, state the intent explicitly. Derive this from:

- The user's message
- Commit messages
- PR description if one exists
- The code itself

Write one clear paragraph. If you're unsure about the intent, ask the user before proceeding.

## Step 3, Spawn Reviewers

Launch all reviewers in a single message using the subagent tools. Use the `interrogate reviewers` list from the `pstack model configuration` section of `~/.codex/AGENTS.md` when present, one reviewer per entry, extending or shrinking the Reviewer A/B/C/D labels below to the configured entry count. Otherwise use the table defaults.

| Subagent | Default model |
|----------|---------------|
| Reviewer A | `gpt-6-astra/low` |
| Reviewer B | `gpt-5.6-sol/medium` |
| Reviewer C | `gpt-5.6-sol/medium` |
| Reviewer D | `gpt-5.6-sol/medium` |

For each reviewer:
- `model`: the configured `interrogate reviewers` entry, or the table default with no configured line
- read-only brief: no edits

Set the configured model and reasoning effort separately. If a required configured pair is unavailable, report the blocker. Keep each reviewer's assigned model and effort.

Read `references/reviewer-prompt.md` and fill in the template with:
1. The stated intent
2. The diff or file contents
3. The review rubric from `references/rubric.md`
4. The code-quality lens from `references/code-quality-review.md`

The same filled template goes to all reviewers, so every reviewer applies the code-quality lens.

## Step 4, Synthesize

Use `gpt-6-astra/low` to synthesize results and perform lead judgment:

1. **Parse all findings** from the reviewers
2. **Identify consensus**. Findings raised by 2+ reviewers independently are highest signal.
3. **Identify single-reviewer findings**. Still worth reading, but weight accordingly.
4. **Deduplicate**. Different reviewers may describe the same issue differently. Merge these and note which reviewers raised it.
5. **Note disagreements**. If one reviewer flags something and another explicitly says the opposite, that's useful context for the verdict.

## Step 5, Lead Judgment

You are the lead reviewer, a pragmatic senior engineer, not a neutral aggregator.

Read `references/lead-judgment.md` for the full framework.

Categorize every finding using these buckets:

- **Act on**. Real issues affecting correctness, security, or maintainability given the actual goals. These would block a real PR.
- **Consider**. Legitimate points, but you're not sure they outweigh the cost of addressing them right now. Worth the user's attention.
- **Noted**. Technically valid but not actionable. Context-dependent, premature optimization, or low-impact given the current stage.
- **Dismissed**. Wrong, nitpicky, or missing context. Brief explanation why.

For each finding, include:
- Which reviewer(s) raised it
- The category (act on / consider / noted / dismissed)
- A one-line rationale for the categorization

## Output Format

Present the verdict in this structure:

### Intent
> [The stated intent paragraph from Step 2]

### Reviewers
- Reviewer [label]: [model name], [N findings] (one bullet per reviewer)

### Act On
[Findings that should be addressed. For each: description, which reviewers raised it, why it matters.]

### Consider
[Findings worth thinking about. For each: description, which reviewers raised it, tradeoff involved.]

### Noted
[Valid but low-priority. Brief list.]

### Dismissed
[Rejected findings with brief rationale.]

### Agreement Map
[Where did reviewers agree, where did they diverge, and what does the pattern of agreement/disagreement tell us?]
