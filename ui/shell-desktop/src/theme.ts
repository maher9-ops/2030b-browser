/**
 * Theming (UI/UX manifesto §9: dark mode as a first-class citizen).
 *
 * Themes are driven entirely by CSS custom properties on the <html> element via
 * a `data-theme` attribute. This module owns the pure state machine for which
 * theme is active, including time-of-day auto-switching and per-site overrides.
 */

export type ThemeMode = 'light' | 'dark' | 'system';

/** Resolve the *effective* theme given the mode and environment. */
export function resolveTheme(
  mode: ThemeMode,
  opts: { systemPrefersDark: boolean; hour?: number; autoByTime?: boolean },
): 'light' | 'dark' {
  if (mode === 'light') return 'light';
  if (mode === 'dark') return 'dark';
  // system
  if (opts.autoByTime && typeof opts.hour === 'number') {
    return opts.hour >= 19 || opts.hour < 7 ? 'dark' : 'light';
  }
  return opts.systemPrefersDark ? 'dark' : 'light';
}

export interface ThemeState {
  mode: ThemeMode;
  autoByTime: boolean;
  /** origin -> forced theme (per-site dark mode for sites that lack it). */
  perSite: Record<string, 'light' | 'dark'>;
}

export const DEFAULT_THEME: ThemeState = { mode: 'system', autoByTime: false, perSite: {} };

/** Compute the effective theme for the page at `origin`. */
export function effectiveTheme(
  state: ThemeState,
  origin: string | null,
  env: { systemPrefersDark: boolean; hour?: number },
): 'light' | 'dark' {
  if (origin && state.perSite[origin]) return state.perSite[origin];
  return resolveTheme(state.mode, { ...env, autoByTime: state.autoByTime });
}

export function cycleMode(mode: ThemeMode): ThemeMode {
  return mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system';
}
