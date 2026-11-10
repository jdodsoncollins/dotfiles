# Personal OpenCode instructions

## Delegation and cost

The orchestrator plans, routes, and reviews. Mechanical work goes down to pinned workers, and fan-out never defaults to the top tier.

| Agent | Model | Use for |
| --- | --- | --- |
| `scout` | Haiku 5.5 | Searches, sweeps, bounded lookups. Spawn several in parallel. |
| `explorer` | GPT-6.1 Terra | Read-only tracing that needs judgment across files. |
| `builder` | Sonnet 5.5 | Specified edits plus Tier-1 checks. Owns only the files it is given. |
| `deep-worker` | Fable 5.2 | Provably hard sub-problems only. Justify each spawn. |
| `verifier` | Opus 5.5 | Independent proof against the real artifact before anything is called done. |

- Built-in `general` and `explore` inherit the session model. Prefer the pinned agents above.
- Give workers exact specs and file pointers, and ask for conclusions, not transcripts.

## Verification first

- Nothing is done until it is proven against the real artifact: a test run, the relevant `tsc` shard, a driven UI or API, an actual stored value. Self-reports and "it compiles" are not proof.
- For any non-trivial change, send the claim, the diff, and the acceptance criteria to `verifier` before declaring done or opening a PR. Do not pass it the writer's reasoning.
- If a `verify-*` skill exists for the surface (for example `verify-waf`), drive the feature through it.
- Ask "how would we make this change fully verifiable?" before writing code for a change that is hard to verify.

## Loops and graphs

- "Keep going until X", AFK, overnight, or recurring work: load the `agent-loop` skill. Loops need a stop command that exits 0 on success, a budget, and state in files.
- Parallel or multi-agent work, a complex review, or coordinated research and delivery: load the `webflow-graph-work` skill. One writer per worktree; the coordinator owns integration.
- Run state lives in `<repo>/tmp/agent-runs/<run-id>/` (Git-ignored in the Webflow repo). Read it before resuming work.

## pstack

pstack skills (poteto-mode, swarm, interrogate, create-verification-skill, and others) are installed from `~/Projects/vendor/cursor-plugins/pstack`. Before following any pstack skill, read `~/.config/opencode/pstack/opencode-harness.md` once per session and apply its mappings and Webflow overrides.

## Irreversible actions

- Agents never merge, never mark PRs ready, and never push to `dev` or `main`. Permissions enforce this; do not look for workarounds.
- PRs are drafts, assigned to `@me`.
- Never post comments, replies, Slack messages, or ticket changes as the user unless explicitly told to.
