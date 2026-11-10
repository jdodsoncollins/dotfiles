# Bot bypass

A site manager decides whether verified and authorized bots skip the site's WAF rules. One switch controls both settings for every domain. When domains disagree, the page reports a mixed state.

## Sub-features

- `bypass.toggle-off`: turn bypass off for all domains.
- `bypass.toggle-on`: turn it back on.
- `bypass.mixed`: show "Current settings are mixed" when domains differ.
- `bypass.token-effect`: with bypass off, bot tokens show "Not in effect".

## How to get to it (user POV)

- Security page, "Bots" heading, switch "Bot bypass".

## Driving it with Playwright

Preconditions: baseline scenario. A fresh site derives bypass as on. Existing coverage: `waf-bots.spec.ts`.

- Off: `page.getByRole('switch', {name: 'Bot bypass'})`, click it, and wait for the PATCH to `…/waf_rules/settings`. Assert the request body is `{"settings":{"bypassVerifiedBots":false,"bypassAuthorizedBots":false}}`. Expect the toast "Bot bypass setting updated", `aria-checked="false"`, and the note beginning "Verified bot bypass is off".
- Persist: reload. The switch is still `aria-checked="false"`. Second view: `GET …/waf_rules` shows `bypassVerifiedBots: false` for each domain.
- Token effect: with a bot token present (see [Bot tokens](./bot-tokens.md)), the token row shows the badge "Not in effect".
- On: click again. Expect `aria-checked="true"` and the note gone.

## Gotchas

- While the PATCH is in flight the switch shows `data-automation-id="pending-switch-spinner"`. Assert after the response, not after the click.
- `bypassAuthorizedBots` is optional in storage and treated as `true` when absent. A missing field is not a failure.
- `getByText('Bot access')` is ambiguous (help text, heading, and a mock history entry). Use `getByRole('heading', {name: 'Bot access'})`.
