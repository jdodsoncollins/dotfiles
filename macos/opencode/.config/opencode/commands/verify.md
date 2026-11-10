---
description: Independently verify a change against the real artifact (verifier subagent, Opus 5.5)
agent: verifier
subagent: true
---

Independently verify this claim: $ARGUMENTS

If no claim is given, verify the current branch: diff it against `origin/dev`, infer the intended behavior from the commits and any linked ticket, and prove or refute it.

Use a `verify-*` skill when one covers the surface. Return the verdict JSON from your instructions.
