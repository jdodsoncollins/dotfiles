---
name: agent-harness-hygiene
description: Weekly harness hygiene (Fri 4pm). Classifies worktrees, finds stale loop runs and unanswered escalations, and checks for pstack updates
---

Run a weekly hygiene pass over Jeremy's agent harness. Report-only.

WORKTREES (`git -C ~/Projects/webflow worktree list --porcelain`), for each one:
- Branch, last commit date, dirty or clean (`git -C <path> status --porcelain`), and PR state (`gh pr view <branch> --repo webflow/webflow --json number,state,mergedAt`).
- Classify: `merged-clean` (safe to remove), `closed-clean`, `stale` (no commit in 21 days, PR open), `dirty` (never remove), `no-pr`.
- For `merged-clean` and `closed-clean`, print the exact `git -C ~/Projects/webflow worktree remove <path>` command. Do not run it.

LOOPS:
- In every worktree, list `tmp/agent-runs/*/ESCALATE.md` files (unanswered escalations), with the first line of each.
- List run directories older than 30 days.

PSTACK:
- `git -C ~/Projects/vendor/cursor-plugins fetch --depth 1 origin main` then report how many commits `HEAD` is behind `origin/main`, and the pstack version in `pstack/plugin.json` on each side.
- Report the installed Claude plugin version from `claude plugin list`. If an update exists, print the commands (`git -C ~/Projects/vendor/cursor-plugins pull && pstack-skills-sync` for OpenCode; the Claude plugin auto-updates). Do not run them.

OUTPUT:
- Write `~/agent-queue/hygiene-<YYYY-MM-DD>.md`.
- Completion notification leads with: "Hygiene: <R> worktrees removable, <E> open escalations, pstack <up to date | N commits behind>".

Read-only. Do not remove worktrees, delete files, pull, or update plugins.
