# Access gating

Only sites with WAF access see the Security page. A site gets access through the routing override flag, or through the `feature-allow-waf` entitlement once the GA gate is on. Without access, the menu entry is hidden, direct navigation redirects, and the API answers 404.

## Sub-features

- `gate.menu`: the Security menu entry appears only with access.
- `gate.redirect`: direct navigation without access redirects to General.
- `gate.api`: the dashboard API answers 404 without access and 403 for a member without permission.
- `gate.flags-load`: the route renders nothing until flags and entitlements load, so it does not flash the page or redirect early.

## How to get to it (user POV)

- Site menu entry with `data-automation-id="SecuritySettingsPage-menu-item"`.
- Direct URL `/dashboard/sites/<shortName>/security` (`/dashboard/apps/<shortName>/security` for cloud apps).

## Driving it with Playwright

Preconditions: two scenarios. The baseline scenario has access. A variant has no `ENABLE_WAF_ROUTING` and no `ALLOW_WAF` entitlement: build it in a scratch spec with `ScenarioSpecBuilder`, mirroring `buildWafScenarioSpec`.

- With access: the menu item `getByTestId('SecuritySettingsPage-menu-item')` is visible, and the page reaches the ready state.
- Without access: the menu item is absent. `page.goto('/dashboard/sites/<shortName>/security')` ends at `/dashboard/sites/<shortName>/general`. `page.request.get('/api/sites/<shortName>/waf_rules')` returns 404.
- Member without permission (variant user with a role lacking manage on custom domains, on a site with access): the page redirects, and `GET …/waf_rules` returns 403.

## Gotchas

- Entitlements cannot be granted on a local HUD outside the scenario builder. Use the routing override for manual runs.
- `POST …/waf_rules/validate` returns 404 before checking authorization. See [Validation](./validation-and-high-risk.md).
- The beta Data API (`/beta/sites/:site_id/waf/*` on `api.wfdev.io`) answers 404 to any OAuth client other than the Webflow MCP client. Driving it locally needs that OAuth app record in the local database.
- A comment in `waf-scenario.ts` says Bot access is gated on `feature-allow-waf` alone. That is stale: access goes through `useWafAccess`, so the routing override is enough.
