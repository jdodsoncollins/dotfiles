# Validation and the high-risk gate

The rule editor checks a rule against the site while the user types and refuses invalid input before anything is saved. A rule that would block broadly, such as a catch-all IP block, needs an explicit typed confirmation before it applies.

## Sub-features

- `validate.json`: malformed JSON shows an inline error and blocks saving.
- `validate.ip`: an invalid IP or CIDR shows a field error and blocks saving.
- `validate.live`: with the test gate on, the editor reports "Checking this rule against your site …" and then a result.
- `high-risk.confirm`: a catch-all rule opens a review dialog that needs a checkbox and a typed phrase.

## How to get to it (user POV)

- Security page, "Add rule", any rule type. The editor's accessible name is "IP blocking JSON configuration" for IP rules.

## Driving it with Playwright

Preconditions: baseline scenario. Existing coverage: `waf-rules.spec.ts` (malformed JSON, invalid IP, high-risk challenge).

- Malformed JSON: `setWafRuleJson(page, '{')`. Expect text starting "Invalid JSON:" and the "Add rule" button with `aria-disabled="true"`. Close, reload: still "Add your first WAF rule".
- Invalid IP: set an `ipRules` entry with `999.1.1.1`. Expect "Must be a valid IPv4/IPv6 address or CIDR range". Nothing persists after reload.
- Live validation (test gate on for the scenario user): set valid JSON. Expect role=status "Checking this rule against your site …", then no error. Network proof: POST `…/waf_rules/validate` returns 200.
- High-risk: set a rule blocking `0.0.0.0/0`, click "Add rule". Expect the dialog "Review high-risk WAF change". "Apply high-risk change" stays `aria-disabled` until the checkbox (for example /Catch-all IP block/) is checked and the textbox receives the exact phrase (for example `APPLY TO 1 DOMAIN`). Then the rule saves and persists after reload.

## Gotchas

- Server-side proof for the high-risk gate: the first `POST …/waf_rules` for a catch-all rule returns 409, and only the confirmed retry returns 200 (seen in the 2026-11-10 run). A UI-only check that the button is disabled does not prove the gate.
- In the 2026-11-10 run, saving called `POST …/waf_rules/test` and then `POST …/waf_rules`, and no journey called `POST …/waf_rules/validate`. Live validation (`validate.live`) is unconfirmed until a scratch spec observes the status text and the `/validate` request.
- The confirmation phrase depends on the number of domains. With the mock there is one domain, so `APPLY TO 1 DOMAIN`.
- `POST …/waf_rules/validate` checks WAF availability before authorization. A user without permission on a site without WAF gets 404, not 403. `R/entrypoints/server/test/routes/api/waf_test.ts` pins this order. Treat a 404 there as expected behavior, not proof of anything about permissions.
- Validation is rate limited at 60 per minute per user and site. Fast typing loops in a scratch spec can hit it.
