# Reviewer verdict

Each scoped reviewer must return this shape:

```json
{
  "reviewer": "security-reviewer",
  "verdict": "needs_changes",
  "scope": ["entrypoints/server/example.ts"],
  "findings": [
    {
      "severity": "high",
      "title": "Authorization is evaluated after mutation",
      "evidence": {
        "file": "/absolute/path/entrypoints/server/example.ts",
        "line": 42,
        "detail": "The write occurs before the authorization result is checked"
      },
      "requiredRepair": "Move authorization before the first mutation"
    }
  ],
  "checksPerformed": ["Trust-boundary trace", "Authorization ordering"],
  "notApplicable": ["No credential storage changes"],
  "artifactRefs": []
}
```

Allowed verdicts are `pass` and `needs_changes`. Allowed severities are `critical`, `high`, `medium`, and `low`.

A reviewer must:

- Stay within its assigned domain.
- Cite exact evidence.
- Avoid implementing repairs.
- Avoid approving the overall task.
- Omit speculative findings that cannot be connected to the reviewed change.

The adjudicator records one disposition for every finding: `repaired`, `stale`, `inapplicable`, `accepted-risk`, or `unresolved`. Only the user may accept high-impact residual risk when that decision changes the requested safety boundary.
