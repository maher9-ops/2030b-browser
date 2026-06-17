/**
 * Layout presets (UI/UX spec §2) and split-view geometry (§6).
 */
export type LayoutPreset = 'classic' | 'vertical' | 'minimal';

export interface LayoutConfig {
  preset: LayoutPreset;
  verticalTabs: boolean;
  autoCollapseChrome: boolean;
}

export function configFor(preset: LayoutPreset): LayoutConfig {
  switch (preset) {
    case 'classic':
      return { preset, verticalTabs: false, autoCollapseChrome: false };
    case 'vertical':
      return { preset, verticalTabs: true, autoCollapseChrome: false };
    case 'minimal':
      return { preset, verticalTabs: false, autoCollapseChrome: true };
  }
}

export type SplitDirection = 'horizontal' | 'vertical' | 'grid';

export const MAX_PANES = 4;

export interface PaneRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Compute normalized [0,1] pane rectangles for a split view.
 * Panes never overlap and always tile the full viewport.
 */
export function splitPanes(direction: SplitDirection, paneCount: number): PaneRect[] {
  const n = Math.max(1, Math.min(paneCount, MAX_PANES));
  if (direction === 'horizontal') {
    return Array.from({ length: n }, (_, i) => ({ x: i / n, y: 0, w: 1 / n, h: 1 }));
  }
  if (direction === 'vertical') {
    return Array.from({ length: n }, (_, i) => ({ x: 0, y: i / n, w: 1, h: 1 / n }));
  }
  const cols = n <= 1 ? 1 : 2;
  const rows = Math.ceil(n / cols);
  return Array.from({ length: n }, (_, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    return { x: c / cols, y: r / rows, w: 1 / cols, h: 1 / rows };
  });
}
