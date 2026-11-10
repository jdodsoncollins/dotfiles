# Customer WAF verification map

This directory is the maintained source for verifying the user-facing behavior of the customer WAF. Read this index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- HUD full stack running; `scripts/doctor.sh` exits 0.
- Spec-driven runs: the scenario from `R/entrypoints/playwright-tests/dashboard/security/waf-scenario.ts` (enterprise workspace, admin user with `ENABLE_WAF_ROUTING`, `WAF_IN_MEMORY_MOCK`, `LIF_274_WAF_BOT_TOKENS`, a fresh site). The page is `/dashboard/sites/<shortName>/security`.
- Ready state: the heading "Security" and the text "Add your first WAF rule" are visible (`goToSecurity`).
- The in-memory mock supplies one host, `<shortName>.mock.webflow.io`, and resets on server restart.
- Never drive a site or user this run did not create, unless the user named it.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Prefer roles and accessible names (`getByRole('switch', {name: 'Bot bypass'})`) over CSS. Test IDs are `data-automation-id`.
- The rule editor is CodeMirror 5. Set its value with `setWafRuleJson`, never by typing into the hidden textarea.
- Mutations are rate limited: 10 per 60 seconds per site. Space mutation-heavy journeys or use separate scenario sites.
- Treat names, labels, and JSON in recipes as literal.

## Proof and skip reporting

- Capture the user action and the resulting state (Playwright trace with `--trace on`).
- Every mutation needs a second, read-only view: reload the page, or `GET /api/sites/<shortName>/waf_rules` through `page.request`.
- Record the feature ID and entry point with every artifact.
- The mock replaces Cloudflare metadata and KV. Report claims about the real edge, real KV, or `waf-worker` enforcement as not verified locally.
- Report an unreachable path with the attempted route and the unmet precondition. Never report a skipped entry point as verified through another one.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior, then exactly four H2 sections in this order: `Sub-features`, `How to get to it (user POV)`, `Driving it with <harness>` (Playwright for page features, Jest and Mocha for lifecycle), `Gotchas`.

## Features

- [Rules](./rules.md) covers adding, editing, and deleting IP, geo, ASN, and User-Agent rules, and persistence.
- [Validation and the high-risk gate](./validation-and-high-risk.md) covers live validation errors, test-before-apply, and the typed confirmation for catch-all rules.
- [Bot bypass](./bot-bypass.md) covers the verified and authorized bot bypass switch and its mixed state.
- [Bot tokens](./bot-tokens.md) covers creating, copying, disabling, and revoking bot access tokens.
- [Access gating](./access-gating.md) covers who sees the Security page and what the API returns without access.
- [Lifecycle cleanup](./lifecycle-cleanup.md) covers what happens to WAF state on site transfer, workspace downgrade, hostname changes, and site deletion. It is proven by jobs and tests, not the page.
