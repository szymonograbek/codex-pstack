# Codex scheduling

The operational workflows process one report. The scheduler owns delivery and retries. A report has `source_channel_id`, `message_ts`, and optional `thread_ts`. Preserve Slack timestamps as strings. For a top-level report, use `message_ts` as the root thread timestamp.

Prefer a supported event delivery adapter when one exists. For a manually supplied report, validate its source coordinates and run the matching operational file directly.

For recurring polling, the setup implementation must satisfy this contract before activation:

1. Store the configured initial cutoff, scan watermark, pending reports, claims, and operation results in one canonical durable store outside temporary worktrees. Pin the repository and channel in that configuration.
2. At run start, capture a fixed provider timestamp cutoff. Fetch every page between the last completed watermark and that cutoff, including a configured overlap. Order records by provider timestamp and message ID. Exclude replies and the bot's own posts when selecting new reports.
3. Persist discovered reports before advancing the scan watermark. Process pending reports even when they precede the current scan window. A report awaiting triage stays pending until a trusted marker arrives or its configured deadline expires.
4. Claim each report and phase exclusively through a transaction or an atomic create operation. A second run must not process a claimed report. A crashed run requires reconciliation before reclaiming its work.
5. Key operations by repository, channel, root timestamp, phase, and action. Before each external write, record intent. Use destination idempotency keys when supported. Otherwise search the authoritative destination by the source permalink or operation identity before a retry. An uncertain outcome stays unresolved and must not be retried blindly.
6. Record successful destination IDs and phase completion. Repeated delivery returns the stored result. Do not repeat tracker creation, verdicts, operations threads, or PR creation.
7. Follow-up and rejection windows are deadlines in pending state. Use the scheduler's next run or a supported wait mechanism. Do not keep a shell process alive to imitate scheduled work.

Both jobs start paused. Prove complete pagination, overlap handling, concurrent claims, restart recovery, and ambiguous-write reconciliation against the configured adapters before enabling them.

This pack supplies the workflow and adapter contract. Durable polling implementation and credentials are project-specific setup work. If they are missing, run a supplied report manually and report that unattended polling is unavailable.
