---
name: verify-waf-maintain
description: Weekly verification-map upkeep (Mon 9:30am). Runs pstack maintain-verification-skill against the verify-waf skill so the WAF feature map does not drift
---

Keep the `verify-waf` feature map honest.

PREREQUISITES (check first; stop and report if unmet):
- HUD must be reachable: from `~/Projects/webflow`, `npm run hud getTaskStatus -- --json` must succeed and the server task must be running and healthy. If not, report "HUD down, verify-waf maintenance skipped" and stop. Do not start HUD.
- The skill must exist at `~/.agents/skills/verify-waf/SKILL.md`.

TASK:
- Follow the `pstack:maintain-verification-skill` skill against `~/.agents/skills/verify-waf/` (it resolves to `~/Projects/dotfiles/macos/agents/.agents/skills/verify-waf/`).
- Edit scope is only that skill directory. Never edit product code in `~/Projects/webflow`.
- Do not open a PR. Leave proven corrections uncommitted in `~/Projects/dotfiles` and summarize the diff.
- A behavior the map describes that the app no longer does is either map drift (fix the map) or a product regression (report it with evidence; do not paper over it).

OUTPUT:
- Write run notes to `~/agent-queue/verify-waf-<YYYY-MM-DD>.md`: features covered, unreachable features with their prerequisite, drift fixed, product regressions found, outcome.
- Completion notification leads with: "verify-waf: <clean | changed | blocked>, <N>/<M> features driven live" and names any product regression.

Do not change flags, Statsig, Linear, Jira, or any production system.
