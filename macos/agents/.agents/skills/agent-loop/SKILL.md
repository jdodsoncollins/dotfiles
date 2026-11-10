---
name: agent-loop
description: Design and run an agent loop (trigger, act, verify, persist, stop or escalate) for work that repeats until a machine-checkable condition holds. Use when the user says "keep going until", "loop until", "run this AFK", "overnight", "while I'm away", "until CI is green", "until every caller is migrated", or wants a recurring or scheduled agent job. Covers in-session loops, the headless `agent-loop` runner (OpenCode or Claude Code), parallel loops in worktrees, and scheduling via Claude Desktop or Flower.
---

# Agent loop

A loop is a system that prompts the agent instead of the human: **trigger, act one unit, verify independently, persist state, then stop or escalate.** You design the loop; the loop runs the agent.

## 1. Design the loop before running anything

Answer each item in writing. A loop missing any of these is not ready to run unattended.

| Primitive | Question | Good answers in the Webflow repo |
| --- | --- | --- |
| Trigger | What starts each run? | Manual, a schedule, a Linear or GitHub event, the previous iteration |
| Unit | What is one iteration's smallest verifiable step? | One caller migrated, one failing test fixed, one review thread resolved |
| Stop | What shell command exits 0 exactly when the goal is met? | `npx nx anytest -- <path> --skip-nx-cache`; `! rg -q "oldApi\(" packages/`; `gh pr checks <n> --required` |
| Verify | What independent check runs after every iteration? | The relevant `tsc` shard, lint on changed files, a `verify-*` skill journey |
| Budget | When does it give up? | Iterations, wall-clock minutes, dollars per iteration |
| State | What survives between iterations? | `LOOP.md`, `progress.md`, `events.jsonl`, the Git diff. Never the context window. |
| Escalate | When does it stop and ask? | Spec wrong, human decision needed, same approach failed twice |
| Gates | What may it never do? | Merge, mark ready, post, change tickets or flags, force push, push to `dev` |

Rules of thumb:

- The stop command must be falsifiable and cheap. If you cannot write one, the task is not loop-shaped yet. Use `wayfinder` or `to-tickets` to break it down first.
- The verifier must be independent of the writer. The runner executes `--verify` itself; for judgment calls, the iteration sends the claim to the `verifier` agent.
- Fresh context each iteration beats one long session. State lives in files, so compaction and context rot do not matter.
- Start report-only. Grant write access (draft PRs) only after a few clean runs.

## 2. Pick the execution mode

**In this session** (short loops, you are watching): follow the iteration protocol below yourself. Re-run the stop command at the top of every iteration and stop at the budget.

**Headless, local** (`agent-loop` runner): one loop per worktree, fresh agent session per iteration, unattended-safe permissions.

```sh
# from the worktree the loop should change
agent-loop init migrate-store-callers \
  --goal "Migrate every caller of syncStore.get to asyncStore.get with identical behavior" \
  --stop '! rg -q "syncStore\.get\(" packages entrypoints' \
  --verify 'npx nx affected -t test --base=origin/dev --parallel=3' \
  --max-iter 12 --max-minutes 180
agent-loop run <run-dir> --dry-run     # check the spec, prompt, and current stop status
agent-loop run <run-dir>               # foreground; or run it in a herdr/tmux pane
agent-loop status <run-dir>            # ledger tail and Mermaid graph
agent-loop list                        # every loop in this worktree
```

- `--harness opencode` (default) runs `opencode run --agent afk --auto`. The `afk` agent denies merges, PR state changes, posting, MCP writes, deploys, destructive Git, and edits outside the worktree. Pass `--model openrouter/anthropic/claude-sonnet-5.5#medium` for routine loops.
- `--harness claude` runs `claude -p --permission-mode auto` with a disallowed-tools list and the same AFK rules appended to the system prompt. `--max-usd` caps each iteration.
- `--pr draft` lets the loop open one draft PR. The default is no PR.
- Exit codes: 0 stop met, 2 budget, 3 escalated (read `ESCALATE.md`), 4 stalled, 1 error. A macOS notification fires on exit.
- To resume after an escalation, answer it in `progress.md` or `LOOP.md`, delete `ESCALATE.md`, and run again. Iteration numbering continues.

Local AFK is permission-fenced, not sandboxed: shell commands still run as you. For untrusted or long unattended work, prefer the cloud.

**Cloud** (machine off): a Flower conversation or automation runs in Flower's sandbox and opens draft PRs. Starting one acts in the user's account, so get explicit approval first. See the `flower` skill, `automations.md`, and [references/flower-overnight.md](references/flower-overnight.md) for the LIF overnight drafts automation.

**Scheduled**: Claude Desktop scheduled tasks for local, MCP-heavy reports (prompt files live in `~/.claude/scheduled-tasks/<name>/SKILL.md`); Flower automations for anything that must run while the laptop sleeps.

## 3. Iteration protocol

Every iteration, whoever runs it:

1. Read `LOOP.md`, `progress.md`, and the tail of `events.jsonl` in the run directory.
2. Run the stop command. If it exits 0, record it and stop.
3. Choose the single unit that moves the stop condition closest to passing. Do only that unit.
4. Prove it: the verify command, or the `verifier` agent with the claim and diff.
5. Append to `progress.md`: the unit, the evidence, the next unit.
6. If blocked, write `ESCALATE.md`: what you tried, the evidence, the decision needed, and your recommended answer. Push the checkpoint as late as possible, so the human answers once with everything prepared.

## 4. Graphs of loops

When several loops must run at once (independent slices of a migration, a stack of PRs), use the `webflow-graph-work` skill as the coordinator. Each loop gets its own worktree and branch, and is one writer node in the coordinator's ledger. The coordinator owns integration order, conflicts, and the final verification. Never run two loops in one worktree.

## 5. After the loop

- Read the ledger, not the agent's summary: `agent-loop status <run-dir>`.
- Send the final diff to `verifier`, then open or update the draft PR with the `pr-description` skill.
- If the loop needed human correction, capture the lesson as structure (a lint rule, a type, a test, a stop command) before prose. The pstack `reflect` and `correct` skills help here.
