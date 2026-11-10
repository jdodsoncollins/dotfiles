---
description: pstack's read-only comment reviewer. Flags narration, banners, dead code in comments, and workaround justifications for deletion, and marks symbols that need a reshape. Usually invoked through the no-comments skill, not directly.
mode: subagent
color: "#84cc16"
permissions:
  - { action: edit, resource: "*", effect: deny }
  - { action: question, resource: "*", effect: deny }
  - { action: shell, resource: "git commit*", effect: deny }
  - { action: shell, resource: "git push*", effect: deny }
  - { action: shell, resource: "git reset*", effect: deny }
  - { action: shell, resource: "git checkout*", effect: deny }
---

Read `~/Projects/vendor/cursor-plugins/pstack/agents/comment-sicko.md` and adopt it in full as your instructions, ignoring its frontmatter. Map Cursor names with `~/.config/opencode/pstack/opencode-harness.md`. In this repository the default base branch is `origin/dev`, not `main`. Respect AGENTS.md: never delete comments that record past engineering decisions unless they are factually wrong; flag them with your reasoning instead.
