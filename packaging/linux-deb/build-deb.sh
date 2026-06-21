#!/usr/bin/env sh
# Build a .deb from the release binary. Run after `./build engine release`.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
VERSION="0.1.0"
STAGE="$ROOT/target/deb/b2030b_${VERSION}_amd64"
BIN="$ROOT/target/release/b2030b"

[ -x "$BIN" ] || { echo "missing $BIN — run ./build engine release" >&2; exit 2; }

rm -rf "$STAGE"
mkdir -p "$STAGE/DEBIAN" "$STAGE/usr/bin" "$STAGE/usr/share/applications"
cp "$ROOT/packaging/linux-deb/control" "$STAGE/DEBIAN/control"
cp "$BIN" "$STAGE/usr/bin/b2030b"
cp "$ROOT/packaging/linux-deb/b2030b.desktop" "$STAGE/usr/share/applications/"
chmod 0755 "$STAGE/usr/bin/b2030b"

dpkg-deb --build --root-owner-group "$STAGE"
echo "built ${STAGE}.deb"
