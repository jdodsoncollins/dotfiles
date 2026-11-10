#!/usr/bin/env bash
# Run WAF journeys with traces into a fresh evidence directory.
# Usage: drive.sh <security|scratch> [extra playwright args...]
set -uo pipefail

R="${WAF_REPO:-$(git rev-parse --show-toplevel 2>/dev/null)}"
if [[ -z "$R" || ! -f "$R/playwright.config.ts" ]]; then
  echo "run from the Webflow repo or set WAF_REPO" >&2
  exit 1
fi
cd "$R" || exit 1

target="${1:-security}"
shift || true
case "$target" in
  security) spec="entrypoints/playwright-tests/dashboard/security" ;;
  scratch)  spec="entrypoints/playwright-tests/dashboard/security/_verify-scratch.spec.ts" ;;
  *) echo "target must be security or scratch" >&2; exit 1 ;;
esac
if [[ ! -e "$spec" ]]; then
  echo "missing $spec" >&2
  exit 1
fi

run_id="$(date -u +%Y%m%dT%H%M%SZ)-$(git rev-parse --short HEAD)"
out="$R/tmp/verify-waf/$run_id"
mkdir -p "$out"
echo "evidence $out"

PLAYWRIGHT_JSON_OUTPUT_NAME="$out/playwright-report.json" \
  npx playwright test "$spec" \
  --project dashboard \
  --trace on \
  --workers 2 \
  --output "$out/artifacts" \
  --reporter "line,json" \
  "$@" 2>&1 | tee "$out/line.log"
status="${PIPESTATUS[0]}"

echo "exit $status" | tee -a "$out/line.log"
echo "evidence $out"
exit "$status"
