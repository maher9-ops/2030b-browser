#!/usr/bin/env sh
# Build, sign, and notarize a macOS .pkg from the release .app bundle.
# Requires Xcode command-line tools + a Developer ID; runs on macOS runners only.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
VERSION="0.1.0"
APP="$ROOT/target/release/bundle/macos/Browser 2030B.app"
OUT="$ROOT/target/release/Browser-2030B-${VERSION}.pkg"
IDENTIFIER="ai.b2030b.shell"

[ -d "$APP" ] || { echo "missing .app at $APP — run ./build release on macOS" >&2; exit 2; }

# Optional code signing (skipped if SIGN_ID is unset).
if [ -n "${SIGN_ID:-}" ]; then
  codesign --deep --force --options runtime --sign "$SIGN_ID" "$APP"
fi

pkgbuild \
  --component "$APP" \
  --install-location "/Applications" \
  --identifier "$IDENTIFIER" \
  --version "$VERSION" \
  "$OUT"

# Notarization (skipped if credentials unset).
if [ -n "${NOTARY_PROFILE:-}" ]; then
  xcrun notarytool submit "$OUT" --keychain-profile "$NOTARY_PROFILE" --wait
  xcrun stapler staple "$OUT"
fi

echo "built $OUT"
