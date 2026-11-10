---
name: lif-morning-queue
description: Weekday outer-loop triage (8:15am). Turns Linear LIF issues, my open PRs, review requests, and WAF alerts into a ranked queue with agent-ready briefs
---

Build today's work queue for Jeremy. This is the outer loop: decide what the factory works on next. It is read-only.

SOURCES (use what is connected; list any source that was unavailable in the output instead of guessing):
- Linear: issues in the team whose key is LIF that are assigned to me and not done; plus LIF issues created in the last 3 days that are unassigned or in triage.
- GitHub (`gh`, repo webflow/webflow): my open PRs (`gh pr list --author @me --state open --json number,title,isDraft,reviewDecision,mergeable,statusCheckRollup,updatedAt`) and PRs requesting my review (`gh search prs --review-requested=@me --state=open --repo webflow/webflow`).
- Buildkite MCP: failed builds on my branches in the last 24h.
- Datadog MCP, if connected: WAF and Stigg entitlement monitors in Alert or Warn state.
- Slack MCP, if connected: messages that mention me in the last 24h that ask for something.

CLASSIFY each item with the triage roles: category (`bug` or `enhancement`) and state (`ready-for-agent`, `ready-for-human`, `needs-info`). An item is `ready-for-agent` only if you can write a stop command (a shell command that exits 0 when done) and a verify command for it. Map states to the LIF team's existing "agent readiness" labels and recommend one per Linear issue (do not apply it): `ready-for-agent` = `good for agent`, `ready-for-human` = `not ready for agent`, `needs-info` = `needs context`. Applying `good for agent` is Jeremy's checkpoint; the Flower overnight automation only picks up issues that carry it. Note blast radius (files or domains touched) and whether it touches a WAF state transition (Mongo to KV projection, site transfer, workspace downgrade, hostname sync, bot token grants).

OUTPUT:
- Write `~/agent-queue/<YYYY-MM-DD>.md` (create the directory if needed) with these sections:
  1. Top 3 for Jeremy today, with one line each on why.
  2. Ready for agent: per item, a brief with goal, likely files, stop command, verify command, and a ready-to-run `agent-loop init` command for the matching worktree (map branches to worktrees with `git -C ~/Projects/webflow worktree list`).
  3. PRs needing action: failing required checks, unresolved threads, conflicts, approved but not merged.
  4. Needs info: the exact question to ask and whom.
  5. Filtered as noise, one line each.
  6. Sources unavailable.
- Completion notification leads with: "Queue: <N> items, <K> ready for agent, top: <title of #1>".

Read-only. Do not change Linear, Jira, GitHub, Slack, Datadog, or any code. Do not post or comment anywhere.
