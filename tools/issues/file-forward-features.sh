#!/usr/bin/env sh
# Browser 2030B — file the Top-10 forward-feature backlog as GitHub issues.
#
# The canonical backlog lives in docs/04-2030-forward-features.md (Part II).
# This script splits the B2030B-Fxx entries into per-issue body files, then
# creates one GitHub issue per entry with the `gh` CLI. Idempotent-ish: it
# skips titles that already exist.
#
# Requirements: `gh` authenticated with `issues` scope on this repo.
# Usage:
#   ./tools/issues/file-forward-features.sh           # create issues
#   ./tools/issues/file-forward-features.sh --dry-run # split only; print titles

set -eu

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DOC="$ROOT/docs/04-2030-forward-features.md"
OUT="$ROOT/tools/issues/stubs"
DRY=0
[ "${1:-}" = "--dry-run" ] && DRY=1

[ -f "$DOC" ] || { echo "error: $DOC not found" >&2; exit 1; }
mkdir -p "$OUT"
rm -f "$OUT"/B2030B-F*.md 2>/dev/null || true

# Split the doc into one file per "### B2030B-Fxx — <title>" block.
# A block ends at the next "### " heading or a "---" rule.
awk -v out="$OUT" '
  function flush() {
    if (id != "") {
      f = out "/" id ".md"
      printf "%s", buf > f
      close(f)
    }
  }
  /^### B2030B-F[0-9]+ / {
    flush()
    line = $0; sub(/^### /, "", line)
    split(line, a, " ")
    id = a[1]
    buf = "# " line "\n\n"
    next
  }
  /^### / { flush(); id=""; buf=""; next }
  /^---$/ { flush(); id=""; buf=""; next }
  id != "" { buf = buf $0 "\n" }
  END { flush() }
' "$DOC"

count=0
for f in "$OUT"/B2030B-F*.md; do
  [ -e "$f" ] || { echo "no backlog entries parsed" >&2; exit 1; }
  count=$((count + 1))
  title="$(head -1 "$f" | sed 's/^# //')"
  if [ "$DRY" -eq 1 ]; then
    echo "would file: $title"
    continue
  fi
  command -v gh >/dev/null 2>&1 || { echo "error: gh CLI not found" >&2; exit 1; }
  if gh issue list --search "in:title \"$title\"" --state all --json title \
       --jq '.[].title' 2>/dev/null | grep -qxF "$title"; then
    echo "skip (exists): $title"
    continue
  fi
  gh issue create --title "$title" --body-file "$f" --label "forward-feature" \
    && echo "created: $title"
done

echo "Parsed $count backlog entries into $OUT/."
[ "$DRY" -eq 1 ] && echo "(dry-run: no issues created)."
