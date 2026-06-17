/**
 * Fuzzy subsequence matcher used by the command palette, tab search, and
 * omnibox (UI/UX spec §4, Chrome parity §4). Pure, DOM-free, and testable.
 */

export interface FuzzyMatch {
  /** Indices in the target that were matched, in order. */
  indices: number[];
  /** Higher is better. 0 means no match. */
  score: number;
}

/**
 * Score how well `query` fuzzy-matches `target`. Returns `null` if `query` is
 * not a subsequence of `target` (case-insensitive). Consecutive matches and
 * matches at word boundaries score higher, mirroring editor-style matchers.
 */
export function fuzzyMatch(query: string, target: string): FuzzyMatch | null {
  if (query.length === 0) return { indices: [], score: 1 };

  const q = query.toLowerCase();
  const t = target.toLowerCase();

  let qi = 0;
  let score = 0;
  let prevMatchIndex = -2;
  const indices: number[] = [];

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      indices.push(ti);
      // Bonus for consecutive matches.
      if (ti === prevMatchIndex + 1) score += 5;
      else score += 1;
      // Bonus for matching at a word boundary.
      const prevChar = ti > 0 ? target[ti - 1] : undefined;
      if (ti === 0 || prevChar === ' ' || prevChar === '-' || prevChar === '/') {
        score += 3;
      }
      prevMatchIndex = ti;
      qi++;
    }
  }

  if (qi < q.length) return null; // query not fully consumed -> no match

  // Prefer shorter targets when scores tie.
  score += Math.max(0, 10 - target.length / 4);
  return { indices, score };
}

/** A rankable item with a label to match against. */
export interface Rankable {
  label: string;
}

/**
 * Filter and rank `items` by `query`, best first. Items that do not match are
 * dropped. Stable for equal scores (preserves input order).
 */
export function rank<T extends Rankable>(query: string, items: T[]): T[] {
  const scored = items
    .map((item, i) => ({ item, i, m: fuzzyMatch(query, item.label) }))
    .filter((x): x is { item: T; i: number; m: FuzzyMatch } => x.m !== null);

  scored.sort((a, b) => (b.m.score - a.m.score) || (a.i - b.i));
  return scored.map((x) => x.item);
}
