---
name: webflow-graph-work
description: Orchestrate complex Webflow engineering work as an evidence-backed execution graph with bounded parallel agents, exclusive write ownership, deterministic verification, scoped reviewers, repair limits, human approval gates, and Mermaid progress derived from an append-only ledger. Use when a Webflow task requests parallel work, multiple agents, workflow graphs, cross-checking, self-correction, a complex PR review, a multi-file implementation, or coordinated research and delivery.
---

# Webflow graph work

Coordinate one accountable execution graph. Keep requirements, routing, integration, and the final verdict in the main agent. Delegate only independent, bounded work.

## Initialize the run

1. Read repository instructions and run `.agentflow/lookup-rule.mjs` for known target paths.
2. Verify the requested result has not already landed. Search current files, `origin/dev`, and existing PRs by ticket and keywords before writing.
3. Resolve the directory containing this `SKILL.md` as `<skill-dir>`.
4. Run:

```bash
node <skill-dir>/scripts/init-run.mjs <task-slug> <workspace-root>
```

5. Save the returned run directory. Treat its `events.jsonl` as the execution-state source of truth. Keep ordinary user-visible planning concise and consistent with the ledger.
6. Read [state-schema.md](references/state-schema.md) before adding events.

Runtime artifacts belong under `<workspace-root>/tmp/agent-runs/`. The initializer refuses to use this location in a Git repository unless Git ignores it.

## Build the graph

Use this default topology and omit nodes that do not earn their cost:

```text
intake -> recon -> plan -> writer -> deterministic-gates -> verifier -> scoped-review
       -> adjudicator -> accept | repair -> writer | human-approval
```

The `verifier` node is an independent proof against the real artifact, run by an agent that did not write the change. Give it the claim, the diff, and the acceptance criteria, never the writer's reasoning. Use a `verify-*` skill (for example `verify-waf`) when one covers the surface. Its `unverifiable` verdict blocks acceptance the same way `fail` does, unless the user accepts the gap.

For work that repeats until a stop condition holds, use the `agent-loop` skill. It writes to this same ledger format, so loops can be nodes in a larger graph.

Create typed work items before delegation. Read [worker-contract.md](references/worker-contract.md) and require every worker to return the requested shape.

Enforce these limits unless the user explicitly changes them:

- At most 3 parallel recon workers.
- At most 3 parallel reviewers.
- One active writer for any file or worktree.
- At most 2 repair attempts.
- No recursive worker delegation.

Prefer the lowest-cost capable Webflow agent:

- `scout`: exact searches, inventory, extraction, deterministic checks.
- `explorer`: subsystem tracing and synthesis across files.
- `builder`: settled implementation with explicit file ownership.
- `deep-worker`: unresolved architecture, security, or difficult debugging.
- `verifier`: independent proof that the change works, with a pass, fail, or unverifiable verdict.

These names resolve per harness:

| Role | OpenCode (`subagent` tool) | Claude Code (`Agent` tool) | Codex |
| --- | --- | --- | --- |
| scout | `scout` (Haiku) | `scout` (Haiku) | `scout` |
| explorer | `explorer` (GPT-6.1 Terra) | `Explore` with `model: "sonnet"` | `explorer` |
| builder | `builder` (Sonnet) | `builder` (Sonnet) | `builder` |
| deep-worker | `deep-worker` (Fable) | `deep-worker` (Fable) | `deep-worker` |
| verifier | `verifier` (Opus) | `verifier` (Opus) | a read-only `explorer` with the verifier brief |
| separate worktree | `tools.opencode.worktree_create` in Code Mode | `isolation: "worktree"` | a worktree under `~/Projects` |

Tell workers they are not alone in the repository, identify their ownership, forbid unrelated edits, and require them to preserve other agents' changes.

## Separate authority

Keep these responsibilities distinct:

- The coordinator owns requirements, graph state, routing, integration, and final reporting.
- Recon workers remain read-only.
- A writer owns an explicit, nonoverlapping file set in one worktree.
- Deterministic gates produce evidence and never rewrite code.
- Reviewers remain read-only and return findings, not approval.
- The adjudicator decides `accept`, `repair`, `escalate`, or `blocked` from evidence.
- The user controls external writes and irreversible actions unless they already authorized them.

For code changes, preserve the main checkout. Use a dedicated worktree under `/Users/jeremycollins/Projects` when the active checkout is unrelated or dirty. Never run concurrent writers in one worktree. Parallel writers require separate worktrees, disjoint file ownership, and a coordinator-owned integration step.

## Verify with external signals

Do not accept introspection as verification. Require evidence appropriate to the change:

- Focused Jest, Mocha, Playwright, or Cypress results.
- The relevant TypeScript shard or package build.
- Static invariants, schema validation, or exact source comparison.
- Storybook screenshots or browser behavior for UI changes.
- Current PR threads, CI state, or external system state when applicable.

Invoke only applicable scoped reviewers:

- `security-reviewer` for trust boundaries and sensitive data flows.
- `spring-component-reviewer` for Spring UI.
- `cross-domain-boundary-checker` for domain and import boundaries.
- `pia-pattern-checker` for repeat-incident risk.
- `ix3-plugin-validator` for IX3 changes.

Read [reviewer-verdict.md](references/reviewer-verdict.md) before review fan-out. A reviewer failure blocks acceptance until the adjudicator records that it was repaired, stale, or inapplicable with evidence.

## Record state and render progress

Append each material transition with:

```bash
node <skill-dir>/scripts/append-event.mjs <run-dir> '<event-json>'
```

Validate and render after graph-shape changes and before the final response:

```bash
node <skill-dir>/scripts/validate-ledger.mjs <run-dir>
node <skill-dir>/scripts/render-mermaid.mjs <run-dir> <optional-output-file>
```

Show the rendered Mermaid graph when parallel branches, blockers, repairs, or approvals materially change. Do not mark aspirational nodes complete. A node is complete only when its ledger evidence supports `passed`.

Store artifact references and concise evidence, not full transcripts, secrets, personal data, or hidden reasoning.

## Stop conditions

Stop and ask the user when:

- A required action exceeds the granted scope.
- Two writers need overlapping ownership.
- A high-risk reviewer finding lacks a verified repair.
- The repair cap is exhausted.
- External state or user judgment is required.

Before pushing, opening or updating a PR, posting comments, modifying Jira or Linear, changing documentation outside the workspace, or taking destructive action, confirm that the user already authorized that exact class of action.

## Finish

The final handoff must state:

- Outcome and remaining blockers.
- Changed files or reviewed scope.
- Verification evidence and unresolved external failures.
- Reviewer findings and their dispositions.
- Run-directory path for the ledger and generated graph.
- Any action still waiting for user approval.
