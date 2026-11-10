---
name: pr-babysit-sweep
description: Weekday PR sweep (10:30am and 3:30pm). Checks every open PR I authored for failing checks, conflicts, and unresolved threads, and prepares the exact loop command to fix each
---

Sweep Jeremy's open PRs in webflow/webflow and prepare fixes. Report-only for now.

FOR EACH open PR authored by me (`gh pr list --author @me --state open --repo webflow/webflow`):
- Required checks: `gh pr checks <n> --required`. For failures, use the Buildkite MCP (`get_failed_executions`, `read_logs`) to find the failing test or step and the first real error line.
- Classify each failure: `real` (cite file and line), `flaky` (passes on retry history, known quarantine, or infra error), or `infra` (agent lost, timeout before tests ran).
- Merge state: conflicts with dev, or more than 200 commits behind dev.
- Review threads: unresolved threads (`gh api graphql` on `reviewThreads`), with the reviewer and a one-line gist.
- Worktree: map the PR branch to a local worktree with `git -C ~/Projects/webflow worktree list`; note if none exists.

PREPARE, for each PR with a `real` failure or conflict, a ready-to-run command for the matching worktree:

```
agent-loop init fix-pr-<n> --goal "<one-line goal>" --stop 'gh pr checks <n> --required' --verify '<the failing test command>' --max-iter 6 --max-minutes 90
```

OUTPUT:
- Write `~/agent-queue/pr-sweep-<YYYY-MM-DD>-<HHMM>.md` with a table (PR, state, failure class, evidence, next action) and the prepared commands.
- Completion notification leads with: "PRs: <N> open, <F> failing (<R> real, <K> flaky), <T> with unresolved threads".

Read-only. Do not push, retry builds, resolve threads, comment, or change PR state.
Promotion path (do not apply until Jeremy says so): after two clean weeks, this task may run the `babysit-pr` skill for `real` CI failures inside the PR's own worktree, push without force, and never touch review threads.
