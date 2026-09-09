# Benny

Two optional Codex workflows triage Slack reports and reproduce confirmed bugs. The second can prepare a bounded draft fix after before-and-after proof.

Start with [FOR_AGENTS.md](FOR_AGENTS.md), or invoke `$pstack:setup-benny` and name a repository. Setup copies the pack to `.codex/automations/benny/`, keeps user configuration separately, and checks connectors, models, app control, and scheduling.

The pack ships dormant. It does not install a Slack trigger, schedule jobs, or grant write permissions. See [scheduling](references/scheduling.md) for the polling contract when a native event trigger is unavailable.
