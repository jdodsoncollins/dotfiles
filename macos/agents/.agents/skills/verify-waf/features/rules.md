# Rules

A site manager adds WAF rules from the Security page. Each rule type (IP blocking, geo-blocking, ASN blocking, User-Agent filtering) is a JSON configuration applied to the site's custom domains. Rules show in an evaluation-ordered table, can be edited or deleted, and persist across reloads.

## Sub-features

- `rules.add-ip`: add an IP blocking rule from the "Add rule" menu.
- `rules.edit-ip`: change an existing IP rule and save.
- `rules.delete-ip`: delete a rule and return to the empty state.
- `rules.other-types`: geo, ASN, and User-Agent rules through the same modal.
- `rules.persist`: rules survive a reload and appear in the API read.

## How to get to it (user POV)

- Dashboard, site, Security in the left menu (`SecuritySettingsPage-menu-item`), or directly `/dashboard/sites/<shortName>/security`.
- Empty state: "Add your first WAF rule". Otherwise the "Rules" heading with the rules table.

## Driving it with Playwright

Preconditions: baseline scenario, page at the ready state. Existing coverage: `waf-rules.spec.ts`.

- Add: click button "Add rule", choose menu item "IP blocking" (menu `Rule types`). The modal title is "Add IP blocking". Click "Use example" or call `setWafRuleJson(page, '{"ipRules":[...]}')`. Click "Add rule". Expect the toast "IP blocking added" and the accordion "1. IP blocking".
- Edit: click "Edit IP blocking". The modal title is "Edit IP blocking". Change the JSON and click "Save changes". Expect "IP blocking updated".
- Delete: click "Delete IP blocking". The dialog is "Delete IP blocking?". Click "Delete rule". Expect "IP blocking rule deleted", then "Add your first WAF rule".
- Persist: reload. The table "IP rules in evaluation order" still lists the row. Second view: `page.request.get('/api/sites/<shortName>/waf_rules')` returns `byDomain["<shortName>.mock.webflow.io"].ipRules` and a new `siteStateHash`.
- Other types: the same flow with menu items "Geo-blocking", "ASN blocking", "User-Agent filtering". The User-Agent table is "User-Agent patterns in evaluation order".

## Gotchas

- `ff-lif-69-waf-test-gate` changes the modal. With the gate off there is a "Test change" button; with it on, validation is live and apply carries a preview token.
- With `ff-lif-378-customer-waf-kv-projection` on, the mock counts KV as configured, so saves take the KV-only path (`wafKvOnly`). Say which path a run exercised.
- More than 10 mutations in 60 seconds on one site is rate limited. A failure after many saves may be the bucket, not a bug.
- Comments in some server files still say metadata is authoritative. That is stale when a KV owner is set.
