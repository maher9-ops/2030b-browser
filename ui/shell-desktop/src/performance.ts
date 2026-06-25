/**
 * Performance-as-design (UI/UX manifesto §7): tab freezing + a resource model
 * the resource monitor renders. Pure logic so it is unit-testable and can run
 * identically whether driven by a real Rust sampler or a synthetic clock.
 */

/** Default idle threshold before a tab is eligible to freeze (10 minutes). */
export const FREEZE_AFTER_MS = 10 * 60 * 1000;

export interface TabActivity {
  id: string;
  /** Epoch millis of last user interaction with this tab. */
  lastActiveAt: number;
  /** Pinned tabs and audible tabs are never auto-frozen. */
  pinned: boolean;
  audible: boolean;
  /** Estimated resident memory in MB (from the Rust sampler). */
  memMB: number;
  /** Estimated CPU share 0..1. */
  cpu: number;
  frozen: boolean;
}

/**
 * Decide which tabs should be frozen *now*. A tab freezes when it has been idle
 * longer than `idleMs`, is not pinned, not playing audio, not the active tab,
 * and is not already frozen.
 */
export function tabsToFreeze(
  tabs: readonly TabActivity[],
  activeId: string | null,
  now: number,
  idleMs: number = FREEZE_AFTER_MS,
): string[] {
  return tabs
    .filter(
      (t) =>
        !t.frozen &&
        t.id !== activeId &&
        !t.pinned &&
        !t.audible &&
        now - t.lastActiveAt >= idleMs,
    )
    .map((t) => t.id);
}

export interface ResourceSnapshot {
  totalMemMB: number;
  /** Aggregate CPU share 0..1. */
  totalCpu: number;
  /** Tabs ordered heaviest-first (memory) for the "hibernate" affordance. */
  heaviest: TabActivity[];
  /** MB reclaimable by freezing all eligible idle tabs. */
  reclaimableMB: number;
}

export function snapshot(
  tabs: readonly TabActivity[],
  activeId: string | null,
  now: number,
  idleMs: number = FREEZE_AFTER_MS,
): ResourceSnapshot {
  const totalMemMB = tabs.reduce((s, t) => s + (t.frozen ? t.memMB * 0.1 : t.memMB), 0);
  const totalCpu = tabs.reduce((s, t) => s + (t.frozen ? 0 : t.cpu), 0);
  const freezeIds = new Set(tabsToFreeze(tabs, activeId, now, idleMs));
  const reclaimableMB = tabs
    .filter((t) => freezeIds.has(t.id))
    .reduce((s, t) => s + t.memMB * 0.9, 0);
  const heaviest = [...tabs].sort((a, b) => b.memMB - a.memMB).slice(0, 5);
  return { totalMemMB, totalCpu: Math.min(1, totalCpu), heaviest, reclaimableMB };
}
