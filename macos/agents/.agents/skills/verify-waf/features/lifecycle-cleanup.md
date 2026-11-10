# Lifecycle cleanup

When a site changes hands or loses WAF access, its WAF state follows the rules. A transfer revokes bot tokens the destination did not mint and clears rules if the destination lacks access. A workspace leaving Enterprise clears rules on its sites. A new hostname inherits a sibling's policy. Deleting a site or domain removes its stored policy.

## Sub-features

- `life.transfer`: site transfer revokes foreign bot tokens and clears rules when the destination has no access (job `clearWafRulesOnSiteTransfer`, after a 300 second delay).
- `life.downgrade`: a workspace leaving Enterprise clears rules per site (job fan-out after a 300 second settle, pages of 50).
- `life.hostname-sync`: a new hostname copies a same-stage sibling's policy.
- `life.domain-transfer`: the KV owner moves to the new site.
- `life.delete`: site or domain deletion removes KV keys and bot tokens.

## How to get to it (user POV)

- Not from the Security page. The user triggers these by transferring a site, changing the workspace plan, adding or removing a custom domain, or deleting a site. The effect is visible afterwards on the destination site's Security page and in the admin tool at `/admin/security?site=<shortName>`.

## Driving it with Jest and Mocha

Preconditions: none for the test path. Locally these are proven with the jobs' own tests; the UI path needs real Cloudflare hostnames and job timing.

- Transfer: `npx nx anytest -- entrypoints/server/lib/logic/waf/clearWafRulesOnSiteTransfer.test.ts --skip-nx-cache`, and the Mocha hook pin `./bin/babel-mocha entrypoints/server/test/logic/siteTransfer_test.ts --timeout 60000`.
- Downgrade: `npx nx anytest -- entrypoints/server/lib/logic/waf/clearWafRulesOnEnterpriseDowngrade.test.ts --skip-nx-cache` and `./bin/babel-mocha entrypoints/server/test/logic/workspaces/planChangeHandlers/handleWorkspacePlanUpdate_test.ts --timeout 60000`.
- Hostname sync: `npx nx anytest -- entrypoints/server/lib/logic/waf/syncWafToNewHostname.test.ts --skip-nx-cache`.
- Rollback restore: `npx nx anytest -- entrypoints/server/lib/logic/waf/restoreCustomerWafMetadataFromKv.test.ts --skip-nx-cache`.
- On SAI or acceptance, an admin can read the end state with POST `/admin/security/waf/status` (`policyStatus` `rules` or `no_rules`, `policySource` `kv` or `legacy_metadata`).

## Gotchas

- On Node 22.18 or later, Mocha may need `NODE_OPTIONS=--no-experimental-strip-types`.
- The policy lease only applies when `ff-pymt-5784-waf-mcp` is on for the site, so concurrent-write behavior differs by flag.
- These transitions are a state machine across Mongo, Cloudflare metadata, and KV. Unit tests cover chosen paths only; the formal model (see `SKILL.md`, Formal coverage) is the exhaustive check.
