#!/usr/bin/env sh
# Reproducible-build verifier (build brief §13, docs/09-deployment.md).
#
# Builds the Rust workspace twice from a clean tree with normalized environment
# (fixed SOURCE_DATE_EPOCH, sorted paths, no embedded timestamps) and compares
# artifact hashes. A divergence means the build is not bit-for-bit reproducible
# and the release is blocked.
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"

# Normalize the build environment for determinism.
export SOURCE_DATE_EPOCH=1700000000
export TZ=UTC
export LC_ALL=C
# Strip absolute paths from debuginfo so two checkouts in different dirs match.
export RUSTFLAGS="--remap-path-prefix=$ROOT=/b2030b -C debuginfo=0"

hash_artifacts() {
  out_dir=$1
  # Hash every built rlib/bin deterministically (sorted).
  find "$out_dir" -type f \( -name '*.rlib' -o -perm -u+x \) 2>/dev/null \
    | LC_ALL=C sort \
    | while IFS= read -r f; do
        sha256sum "$f" | awk -v f="$f" '{print $1"  "f}'
      done | sha256sum | awk '{print $1}'
}

echo "=== build #1 ==="
cargo build --workspace --release
H1=$(hash_artifacts target/release)

echo "=== clean + build #2 ==="
cargo clean --release
cargo build --workspace --release
H2=$(hash_artifacts target/release)

echo "build #1 digest: $H1"
echo "build #2 digest: $H2"
if [ "$H1" = "$H2" ]; then
  echo "reproducible-build: OK"
else
  echo "reproducible-build: FAILED (artifacts differ)"
  exit 1
fi
