#!/usr/bin/env sh
# Aggregate linter for the whole monorepo (build brief §11). Each language uses
# its native linter; this script is the single entry point the CI `lint`
# workflow and `./build lint` call.
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"

fail=0
run() {
  printf '\n=== %s ===\n' "$1"
  shift
  if "$@"; then :; else
    echo "  ^ lint step failed"
    fail=1
  fi
}

# Rust: format check + clippy with warnings as errors.
if command -v cargo >/dev/null 2>&1; then
  run "rustfmt --check" cargo fmt --all -- --check
  run "clippy -D warnings" cargo clippy --workspace --all-targets -- -D warnings
else
  echo "cargo not found; skipping Rust lint"
fi

# TypeScript: eslint over the JS/TS workspaces.
if command -v yarn >/dev/null 2>&1; then
  run "eslint" yarn lint
else
  echo "yarn not found; skipping TypeScript lint"
fi

# Kotlin: ktlint (only if installed on this runner).
if command -v ktlint >/dev/null 2>&1; then
  run "ktlint" ktlint "mobile/android/**/*.kt"
fi

# Swift: swift-format (only on macOS runners).
if command -v swift-format >/dev/null 2>&1; then
  run "swift-format" swift-format lint --recursive mobile/ios/Sources
fi

if [ "$fail" -ne 0 ]; then
  echo "\nlint: FAILED"
  exit 1
fi
echo "\nlint: OK"
