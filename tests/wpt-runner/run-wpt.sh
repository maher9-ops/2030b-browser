#!/usr/bin/env sh
# Web Platform Tests runner (build brief §12, docs/08-test-plan.md).
#
# Drives the upstream WPT suite against a built Browser 2030B binary and writes
# a wptreport.json the CI gate compares against the baseline. The WPT checkout
# is vendored under tests/wpt-runner/wpt (fetched by ./bootstrap --wpt) and is
# NOT committed here.
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
WPT_DIR="$ROOT/tests/wpt-runner/wpt"
BROWSER_BIN="${B2030B_BIN:-$ROOT/target/release/b2030b}"
REPORT="$ROOT/tests/wpt-runner/wptreport.json"

if [ ! -d "$WPT_DIR" ]; then
  echo "WPT checkout missing at $WPT_DIR — run ./bootstrap --wpt first" >&2
  exit 2
fi
if [ ! -x "$BROWSER_BIN" ]; then
  echo "browser binary not found at $BROWSER_BIN — run ./build engine release" >&2
  exit 2
fi

# Subset of focus areas (extend in CI). Each maps to a WPT test directory.
FOCUS="${WPT_FOCUS:-html css fetch service-workers webcrypto}"

echo "Running WPT focus areas: $FOCUS"
"$WPT_DIR/wpt" run \
  --binary "$BROWSER_BIN" \
  --log-wptreport "$REPORT" \
  --no-pause \
  b2030b $FOCUS

echo "wptreport written to $REPORT"
"$ROOT/tests/wpt-runner/compare-baseline.sh" "$REPORT"
