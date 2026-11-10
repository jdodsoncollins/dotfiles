# Bot tokens

A site manager creates named bot tokens so specific automated clients can bypass the WAF rules. The token is shown once, can be disabled or revoked, and a site allows at most five.

## Sub-features

- `tokens.create`: create a token and copy it once.
- `tokens.limit`: show "N of 5 bots" and stop at five.
- `tokens.disable`: switch a token off and on.
- `tokens.revoke`: revoke a token and remove it everywhere.
- `tokens.projection`: tokens reach every host's WAF config.

## How to get to it (user POV)

- Security page, "Bot access" heading. Empty state "Allow specific bots". Button "Add bot".

## Driving it with Playwright

Preconditions: baseline scenario (it grants `LIF_274_WAF_BOT_TOKENS`). Existing coverage: `waf-bots.spec.ts`.

- Create: click "Add bot". The dialog is "Add a bot". Fill "Bot name" (1 to 80 characters), optionally check "Allow all request methods", and click "Add bot". Expect the dialog "Copy your bot token" with the field "Bot token". Click "Hide token forever". Expect "1 of 5 bots" and the name in the table "Bot tokens".
- Projection: the create response's `projection` has `hostnamesApplied` containing the mock host and no `hostnamesFailed`. Second view: `GET …/bot_tokens` lists the token with `lastFour` and no hash.
- Disable: switch "Enable <name>" off, reload, and it stays off.
- Revoke: click "Revoke <name>". The dialog is "Revoke bot token". Confirm. Expect "0 of 5 bots" and the row gone after reload.

## Gotchas

- The full token appears only in the copy dialog. A journey that needs it must read it there.
- Default methods are GET and HEAD unless "Allow all request methods" is checked.
- Locally, edge enforcement (a request with `x-wf-waf-authorization` bypassing rules) cannot be proven; it needs `waf-worker` and a real host. Report it as not verified.
- Two PRs that change how grants are derived (LIF-614 #125687, LIF-611 #125688) were drafts on 2026-11-10. Recheck this file after they land.
