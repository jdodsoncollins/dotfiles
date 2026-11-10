---
name: verify-waf
description: Drive the customer WAF product in the Webflow monorepo the way a user does and capture proof. Covers the dashboard Security page (IP, geo, ASN, and User-Agent rules, live validation, the high-risk gate, Bot bypass, bot tokens), access gating, and the API and storage reads behind them. Use before declaring any WAF change done, when a verifier needs real evidence for a WAF claim, or for "verify the Security page", "prove the WAF rule saves", "check bot tokens work".
---

# Verify the customer WAF

Status: **draft, page journeys not yet proven live.** Generated 2026-11-10 while HUD was down. Proven so far: `scripts/doctor.sh` fails correctly with HUD down, and the `life.hostname-sync` recipe passed (32/32 on `dev` at `6e775f7cd312`). The first run with HUD up must complete step 4 of `create-verification-skill` (launch, doctor, drive one page feature with `drive.sh`, capture evidence, clean up, confirm the evidence survives) and then replace this line.

`R` below means the Webflow repo root, usually `~/Projects/webflow` or the worktree under test. Run every command from `R`.

## Launch

The WAF surface runs inside the HUD full stack. Local sites have no Cloudflare hostnames, so verification relies on the in-memory WAF mock (`ff-lif-306-waf-in-memory-mock`). The mock invents `<shortName>.mock.webflow.io`, keeps metadata and KV in process memory, and **resets when the server restarts**.

1. Check HUD first: `npm run hud getTaskStatus -- --json`. If it fails, HUD is down.
2. If HUD is down and this run is allowed to start it, use the `hud-controller` skill to start the full stack. Do not restart a HUD the user is already using; ask instead.
3. Ready means usable: `scripts/doctor.sh` exits 0. A running server task can still be building, so wait on doctor rather than on the process.

Flags are per scenario user, so no global override is needed for spec-driven runs. For manual driving of an existing local site, either set `WF_RUNTIME_OVERRIDE_FLAGS='{"ff-lif-306-waf-in-memory-mock":true,"ff-pymt-5746-enable-waf-routing":true}'` before the server starts, or use the Feature Config modal (type `* f c` on a dashboard page; needs `ff-shsvs-6249-feature-config-dashboard`).

Teardown: specs create their own scenario users, workspaces, and sites, so there is nothing to tear down beyond the scratch files under Cleanup. Do not stop HUD unless this run started it.

## Doctor

```sh
~/.agents/skills/verify-waf/scripts/doctor.sh
```

Read-only. It checks that HUD answers, that the server task is running and healthy, that `https://wfdev.io:8443/` responds, that Playwright and its Chromium are installed, and prints the current branch and HEAD so evidence names the build under test. Run it before the first drive, after any failed drive, and whenever something looks off.

## Drive

Primary harness: **Playwright with scenario data**, the same harness as `R/entrypoints/playwright-tests/dashboard/security/`. Each run builds a fresh enterprise workspace, an admin user with `ENABLE_WAF_ROUTING`, `WAF_IN_MEMORY_MOCK`, and `LIF_274_WAF_BOT_TOKENS`, and a site, so runs are isolated from each other and from your own data.

```sh
# existing journeys (rules, high-risk gate, bots)
~/.agents/skills/verify-waf/scripts/drive.sh security
# one journey by test title
~/.agents/skills/verify-waf/scripts/drive.sh security -g "bot bypass"
# a scratch journey for the change under test (see below)
~/.agents/skills/verify-waf/scripts/drive.sh scratch
```

`drive.sh` runs the `dashboard` Playwright project with `--trace on`, writes all artifacts to `R/tmp/verify-waf/<run-id>/`, and prints that directory.

Scratch journeys. When the existing specs do not cover the claim, write one spec at `R/entrypoints/playwright-tests/dashboard/security/_verify-scratch.spec.ts` (the `dashboard` project only matches `dashboard/**/*.spec.ts`). Reuse `buildWafScenarioSpec`, `goToSecurity`, and `setWafRuleJson` from `./waf-scenario`, and the setup steps `loadScenarioStep` and `createUserContextsAndLoginUsersStep` from `../../utils/setup`, as `waf-bots.spec.ts` does. Assert on what a user sees and on a second read of the stored value (reload, or a `page.request.get` of `/api/sites/<shortName>/waf_rules`). Never call internal setters or test-only endpoints to make a journey pass.

Exploratory driving (no spec): use the `chrome-devtools` MCP or the `browser` skill against `https://wfdev.io:8443/dashboard/sites/<shortName>/security` on a site whose user has the two flags above. Use the stable handles listed in each feature file.

Stable handles. Test IDs use `data-automation-id` (`getByTestId`), not `data-testid`. Prefer roles and accessible names: they are what the existing specs use.

## Evidence

- Location: `R/tmp/verify-waf/<run-id>/` (Git-ignored). `drive.sh` writes `playwright-report.json`, `line.log`, and `artifacts/` with a trace per test. Open a trace with `npx playwright show-trace <trace.zip>`.
- Proof standards:
  - Exercise the real user path: the Security page, or the dashboard API the page calls.
  - Capture the action and the resulting state, not only the final screen.
  - Every mutation needs a second, read-only view of the stored value: reload the page, or `GET /api/sites/<shortName>/waf_rules`.
  - The mock stands in for Cloudflare metadata and KV. Say so in the report. A claim about the real edge (`waf-worker`) or real KV is unverified locally; prove it on SAI or acceptance, or report it as not verified.
- Record with each artifact the feature ID from `features/` and the entry point used.

## Cleanup

- Move `_verify-scratch.spec.ts` into the run's evidence directory (`mv … R/tmp/verify-waf/<run-id>/`). It must not stay in the worktree, and it must never be committed.
- Leave `R/tmp/verify-waf/<run-id>/` in place: cleanup never deletes evidence. Confirm it still exists after cleanup.
- Never kill processes by name. Stop only what this run started.

## Helpers

| Script | Use |
| --- | --- |
| `scripts/doctor.sh` | Read-only health check. Exit 0 means the instance is worth driving. |
| `scripts/drive.sh <security|scratch> [playwright args…]` | Run journeys with traces into a fresh evidence directory. |

## Feature map

Read [features/README.md](features/README.md) before driving. Each feature file is a recipe. Keep the map current with `/maintain-verification-skill` (scheduled weekly as `verify-waf-maintain`).

## Formal coverage

The Mongo to KV projection, site transfer, workspace downgrade, hostname sync, and bot token grants form a state machine that UI journeys cannot exhaust. Model it once with `create-formal-verification-skill`, then recheck on every change to those files with `maintain-formal-verification-skill`.
