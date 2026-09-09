---
name: make-bot-ui
description: Build a local UI that starts bounded Codex tasks, with optional access over an existing Tailscale network.
---

# Make a bot UI

Build a page whose buttons submit structured requests to a local server. The server starts Codex through its documented CLI or app-server interface. Read [Codex runtime](../../references/codex-runtime.md).

## Define the task contract

Pin the repository, allowed action names, input fields, OpenAI model, and permission scope on the server. Accept only values from that contract. Treat submitted text as task data. Do not let requests choose shell commands, working directories, credentials, model providers, or permission flags.

Start with a read-only action and one active run. Add mutations only when the user's requested UI needs them. Show queued, running, failed, and completed states using real process or app-server results.

## Connect Codex

Inspect the installed `codex exec --help` and use its supported arguments. Spawn the process with an argument array, not a shell command. Pass the task through stdin with `-`; pin `--cd`, `--model`, and `--sandbox` on the server. Parse `--json` output and preserve the exit code. Handle cancellation and disconnects without starting duplicate tasks.

For resumable or interactive sessions, use the documented Codex app-server protocol. Verify the current protocol before implementing requests. Do not invent webhook URLs or scheduler APIs.

## Serve and verify

Bind to loopback by default. Keep Codex credentials and any UI authentication secrets on the server. Protect state-changing routes against unauthorized requests and cross-site submissions.

If the user wants tailnet access, inspect the existing Tailscale setup and use its supported service-sharing workflow. Do not expose the server publicly or install a second node as an incidental step.

Test a harmless task through the real page. Confirm the selected repository and OpenAI model, inspect task output, test rejected input and cancellation, and verify that browser responses contain no credentials. Report the tested URL and how to stop the server.
