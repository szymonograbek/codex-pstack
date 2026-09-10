---
name: setup-benny
description: Configure Benny's Slack triage and bug-reproduction workflows for Codex. Read directly from the Benny pack.
---

# Set up Benny

The pack is dormant. Installing PStack does not create scheduled jobs or authorize Slack posts, tracker writes, commits, or pull requests. Configure those actions when the user asks to activate Benny.

## Prepare the project

1. Resolve the target repository from the request. Copy the entire pack containing `FOR_AGENTS.md` to `<repository>/.codex/automations/benny/`. Preserve destination-only files and merge changed files without discarding local edits. Keep configuration and secrets outside the copied pack.
2. Check that a fresh Codex session in the target repository discovers PStack's `how`, `why`, `tdd`, `unslop`, and the principles referenced by the operational files. Install PStack in the execution environment through its configured marketplace when needed. A local app installation does not imply availability on another machine or scheduler.
3. Read the copied configuration, routing, feature-map, and control-adapter examples. Create secret-free user copies under `.codex/benny/`. Keep mutable run state in one configured absolute directory outside scheduler worktrees.
4. Check that a fresh execution checkout contains the pack and referenced configuration. Commit only when asked. Scheduled work cannot depend on uncommitted files missing from its checkout.

## Configure the adapters

Resolve the source channel ID, optional operations channel ID, triage identity, repository and default branch, tracker adapter and target fields, control skill, feature map, budgets, and OpenAI models. Keep credentials in the execution environment's credential store.

Validate these capabilities through the actual Codex connectors:

- Slack channel and complete thread reads, attachment access, thread replies, and optional operations status edits.
- Tracker search, read, create, update, source-link lookup, and a compensation action for a failed handoff.
- Repository and history access, plus draft PR creation only when the user wants fixes.
- App control for startup, navigation, actions, read-only state inspection, screenshots, video, and cleanup.

Read `../reproduce-and-fix-issues/references/control-adapter.md`. A missing required capability keeps that workflow paused. Give subagents no external-write authority. If the environment cannot isolate credentials and write tools, keep the work in the coordinator.

Each `models` entry contains `model` and `reasoning_effort`. Use Astra/low for triage, reproduction judgment, and media review; use Sol/medium for every code change. Verify both fields against the target runtime and pass them as separate dispatch arguments.

## Select the trigger

Codex scheduled runs are not automatically Slack event subscriptions. Use a supported event source when available; normalize it to the trigger object in the prompt templates. Otherwise use a supported recurring task with the bounded polling contract in `../../references/scheduling.md`.

For polling, setup must supply durable state, exclusive per-report claims, complete pagination, and authoritative reconciliation of ambiguous writes. If the selected scheduler or adapter cannot meet that contract, leave polling paused and use a manually supplied report. Do not silently skip reports or substitute a made-up webhook endpoint.

## Prepare the two jobs

Use the actual Codex scheduling tools or the Codex Automations UI available in this environment. Inspect existing jobs by identity before creating anything. Update matching jobs when requested; preserve unrelated jobs.

Build each prompt from the copied template and finished configuration. Include the stable repository-relative operational path, repository, explicit channel scope, permissions, budgets, and model. Keep both jobs paused until the configured workflow has been tested. Do not edit undocumented scheduler storage.

- `benny-triage` reads `.codex/automations/benny/skills/triage-issue-reports/SKILL.md`.
- `benny-reproduce` reads `.codex/automations/benny/skills/reproduce-and-fix-issues/SKILL.md`.

If scheduling tools are unavailable, produce the two complete prompts and schedule settings for the user to install in the Automations UI. Report that no job was created.

## Verify before activation

First run with a supplied report and no external writes. Then, with the user's authorization, use a test channel and test tracker destination.

Check one thread-only triage verdict, trusted marker acceptance, immutable source coordinates, no source-channel root posts, and no child writes. Test duplicate delivery, concurrent runs, a timeout after a successful remote write, a deleted parent, and a missing adapter. Each must avoid duplicate or misplaced effects.

Verify the app-control adapter and baseline/after evidence before allowing the optional fix phase. Keep draft PR creation disabled until explicitly authorized. Enable normal traffic only after these checks pass and the user has requested activation.
