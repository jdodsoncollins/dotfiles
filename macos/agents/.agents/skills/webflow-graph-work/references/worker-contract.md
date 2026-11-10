# Worker contract

Give every delegated agent a contract with this shape:

```json
{
  "id": "trace-server-contract",
  "objective": "Trace the server contract and identify every affected caller",
  "responsibility": "Read-only ownership of server contract discovery",
  "paths": ["entrypoints/server", "packages/domains/example"],
  "allowedTools": ["rg", "file reads", "git history"],
  "requiredOutput": {
    "conclusion": "Concise answer",
    "evidence": ["Absolute file and line references"],
    "openQuestions": ["Unresolved facts"],
    "artifactRefs": ["Saved artifact paths"]
  },
  "exclusions": [
    "No file edits",
    "No Git mutations",
    "No external writes",
    "Do not inspect unrelated domains"
  ],
  "siblingOverlap": "UI tracing belongs to another worker",
  "definitionOfDone": "All direct and typed-registry consumers are classified"
}
```

For writers, replace read-only responsibility with exact file ownership. Include this instruction:

> You are not alone in the repository. Modify only the files you own. Do not revert or rewrite other agents' changes. Adjust your work to compatible changes already present.

Require conclusions and evidence instead of raw transcripts. Workers may identify follow-up work but must not expand their scope or spawn other agents.
