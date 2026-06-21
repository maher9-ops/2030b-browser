#!/usr/bin/env sh
# Compare a wptreport.json against the committed baseline. Fails CI if the pass
# rate regresses below the baseline minus the allowed tolerance.
set -eu

REPORT="${1:?usage: compare-baseline.sh <wptreport.json>}"
DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BASELINE="$DIR/baseline.json"
TOLERANCE="${WPT_TOLERANCE:-0}" # allowed percentage-point regression

# Extract pass rate with python3 (always available on runners).
read_rate() {
  python3 - "$1" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
results = data.get("results", [])
sub = passed = 0
for r in results:
    subs = r.get("subtests", [])
    if subs:
        for s in subs:
            sub += 1
            if s.get("status") == "PASS":
                passed += 1
    else:
        sub += 1
        if r.get("status") in ("OK", "PASS"):
            passed += 1
rate = (passed / sub * 100) if sub else 0.0
print(f"{rate:.2f}")
PY
}

CURRENT=$(read_rate "$REPORT")
if [ -f "$BASELINE" ]; then
  BASE=$(read_rate "$BASELINE")
else
  echo "no baseline yet; recording $CURRENT% as the new baseline"
  cp "$REPORT" "$BASELINE"
  exit 0
fi

echo "WPT pass rate: current=$CURRENT% baseline=$BASE% tolerance=$TOLERANCE pp"
python3 - "$CURRENT" "$BASE" "$TOLERANCE" <<'PY'
import sys
cur, base, tol = map(float, sys.argv[1:4])
if cur + tol < base:
    print("WPT regression detected — failing")
    sys.exit(1)
print("WPT pass rate OK")
PY
