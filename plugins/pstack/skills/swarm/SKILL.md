---
name: swarm
description: "Fan out N parallel workers, drain them, and return one report. Use for $swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration."
---

# Swarm

Read [Codex runtime](../../references/codex-runtime.md) before delegating.

Fan out N parallel subagents. They may cover separate slices, race the same brief, or mix both. The parent waits, aggregates, and returns one report.

## Start

Open a todolist with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Aggregate
4. Report

## Phase A: Frame

1. State the done predicate and the artifact or report the swarm must return.
2. Choose the shape. Partition into slices, race N workers on identical briefs, or mix both. For a race or mixed shape, declare `first pass`, `rank all`, or `best-of` before spawning.
3. Set N from the user or derive it from the shape. N is total workers, not the cloud concurrency limit.
4. Pick a model/effort pair by task. Code changes, routine rule-based review, and verification execution use `swarm workers`, default `gpt-5.6-sol/medium`. Individual planning, knowledge-heavy comparison, and complex verdicts use `gpt-6-astra/low`; four-agent design/review panels use one Astra/low and three Sol/medium. Read-only evidence collection uses `gpt-5.6-terra/medium`. Keep the requested agent count. Validate any configured override against Codex runtime. State each arm's pair before spawning.
5. Give each worker its own writable output when it writes.

## Phase B: Fan out

Spawn all N workers in one message with the configured model. Give every writing worker its own worktree or writable output directory.

When a worker must start from a non-default pushed branch, name that branch in its brief.

Every brief stands alone. Include the goal, scope, exact slice or race arm, how to verify, and what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence.

If a worker drops out, proceed with N-1 and note it.

## Phase C: Aggregate

Use `gpt-6-astra/low` for judgment when comparing or accepting terminal results. For coverage, every required slice needs a result. For a race, apply the selection rule declared up front. Use first pass, rank all, or best-of. Do not paste raw worker dumps.

Keep a compact result table, one-line evidenced issues, and explicit gaps or dropouts.

## Phase D: Report

Return one consolidated in-chat report with the table, issue one-liners, gaps or dropouts, and the race rule when used.
