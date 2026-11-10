# Execution ledger schema

## Contents

- Event shape
- Status transitions
- Node types
- Evidence rules

Each line of `events.jsonl` is one JSON object. The append helper supplies `schemaVersion`, `seq`, `at`, and `runId`.

## Event shape

```json
{
  "nodeId": "review-security",
  "nodeType": "reviewer",
  "status": "passed",
  "summary": "Security review found no unresolved trust-boundary defects",
  "parentNodeIds": ["deterministic-gates"],
  "edgeLabels": {
    "deterministic-gates": "security applicable"
  },
  "owner": "security-reviewer",
  "attempt": 1,
  "artifacts": ["tmp/agent-runs/example/security-review.json"],
  "evidence": [
    {
      "kind": "review",
      "result": "pass",
      "ref": "tmp/agent-runs/example/security-review.json"
    }
  ],
  "git": {
    "worktree": "/Users/example/Projects/webflow-feature",
    "branch": "example-feature",
    "headSha": "0123456789abcdef"
  },
  "metadata": {}
}
```

Required input fields are `nodeId`, `nodeType`, `status`, and `summary`.

## Status transitions

Use `pending`, `active`, `passed`, `failed`, `blocked`, or `skipped`.

Allowed transitions for the same node are:

- `pending` to `active`, `blocked`, or `skipped`
- `active` to `passed`, `failed`, or `blocked`
- `failed` to `active`, `blocked`, or `skipped`
- `blocked` to `active` or `skipped`
- `passed` to `passed` only for added evidence
- `skipped` to `skipped` only for added evidence

Create a new node id for a distinct repair, such as `writer-repair-1`. Set `attempt` explicitly.

Every parent must appear earlier in the ledger. A node may have no parent only when it is a root such as `intake`.

Use `edgeLabels` to record conditional routing. Keys are parent node ids and values are concise conditions such as `pass`, `repair below cap`, or `user approved`. The Mermaid renderer places these conditions on their corresponding edges.

## Node types

Prefer these stable values:

- `coordinator`
- `recon`
- `planner`
- `writer`
- `gate`
- `reviewer`
- `adjudicator`
- `approval`
- `handoff`

Use a more specific value only when it makes graph interpretation materially clearer.

## Evidence rules

Evidence entries should answer what ran, what happened, and where the proof lives. Prefer references to saved artifacts over pasted logs.

Never store:

- Chain of thought or hidden reasoning
- API keys, tokens, cookies, passwords, or private keys
- Raw personal data
- Full noisy command logs when a concise result and artifact pointer suffice

Record failures precisely. A tool or infrastructure failure is not a code failure unless the evidence demonstrates that connection.
