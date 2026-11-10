#!/usr/bin/env bash
# Read-only health check for verify-waf. Exit 0 means the local instance is worth driving.
set -uo pipefail

R="${WAF_REPO:-$(git rev-parse --show-toplevel 2>/dev/null)}"
if [[ -z "$R" || ! -f "$R/playwright.config.ts" ]]; then
  echo "FAIL repo: run from the Webflow repo or set WAF_REPO" >&2
  exit 1
fi
cd "$R" || exit 1

fail=0
check() { if eval "$2" >/dev/null 2>&1; then echo "ok   $1"; else echo "FAIL $1"; fail=1; fi; }

echo "repo $R"
echo "build $(git branch --show-current) $(git rev-parse --short HEAD)"

status_json="$(npm run --silent hud getTaskStatus -- --json 2>/dev/null)"
if [[ -z "$status_json" ]]; then
  echo "FAIL hud: not reachable (start it with the hud-controller skill, or ask the user)"
  exit 1
fi
echo "ok   hud reachable"

server_verdict="$(printf '%s' "$status_json" | node -e '
  let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
    try {
      const json = JSON.parse(s.slice(s.indexOf("[{")));
      const server = json.find((t) => t.taskName === "server") ?? json.find((t) => /^server/i.test(t.taskName));
      if (!server) return console.log("FAIL server task missing");
      const bad = ["errored", "buildError", "down"].includes(server.health);
      const ok = server.state === "running" && !bad;
      console.log(`${ok ? "ok  " : "FAIL"} server task ${server.taskName}: state=${server.state} health=${server.health}`);
    } catch (e) { console.log("FAIL could not parse HUD status"); }
  });')"
echo "$server_verdict"
[[ "$server_verdict" == FAIL* ]] && fail=1

check "https://wfdev.io:8443/ responds" "curl -sk -o /dev/null -w '%{http_code}' --max-time 15 https://wfdev.io:8443/ | grep -Eq '^(200|301|302|303|401|403)$'"
check "playwright installed" "npx --no-install playwright --version"
check "security specs present" "test -f entrypoints/playwright-tests/dashboard/security/waf-scenario.ts"

exit $fail
