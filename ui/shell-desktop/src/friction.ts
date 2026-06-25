/**
 * Meaningful friction (UI/UX manifesto §5). Frictionless UIs make users
 * forgetful and disengaged; 2030B inserts *intentional, proportional* hurdles
 * at high-consequence moments. Pure decision logic — the renderer shows modals.
 */

export type FrictionKind =
  | 'close-unsaved'
  | 'too-many-tabs'
  | 'install-extension'
  | 'broad-permission'
  | 'bulk-close';

export interface FrictionPrompt {
  kind: FrictionKind;
  title: string;
  body: string;
  /** Label for the "I really mean it" action. */
  confirmLabel: string;
  /** 0..1 — how much emphasis the UI should apply (meter fill, dwell time). */
  weight: number;
  /** Whether the confirm button should be intentionally delayed (ms). */
  dwellMs: number;
}

export interface FrictionSignals {
  closingUnsaved?: boolean;
  openTabCount?: number;
  installingExtension?: { name: string; readsAllData: boolean } | undefined;
  requestingPermission?: { name: string; broad: boolean } | undefined;
  bulkClosingCount?: number;
}

const TAB_SOFT_LIMIT = 20;

/**
 * Return the *single* most important friction prompt for the current action,
 * or null if the action should proceed without ceremony. Returning one keeps
 * friction meaningful rather than nagging.
 */
export function evaluateFriction(s: FrictionSignals): FrictionPrompt | null {
  if (s.closingUnsaved) {
    return {
      kind: 'close-unsaved',
      title: 'You have unsaved changes',
      body: 'This tab has work that has not been saved. Close it anyway?',
      confirmLabel: 'Close without saving',
      weight: 0.8,
      dwellMs: 0,
    };
  }

  if (s.installingExtension) {
    const broad = s.installingExtension.readsAllData;
    return {
      kind: 'install-extension',
      title: `Install “${s.installingExtension.name}”?`,
      body: broad
        ? 'This extension can read and change all your data on every site. Install it only if you trust the developer.'
        : 'This extension requests limited access. Review what it can do before installing.',
      confirmLabel: 'Install',
      weight: broad ? 0.95 : 0.5,
      dwellMs: broad ? 1500 : 0,
    };
  }

  if (s.requestingPermission?.broad) {
    return {
      kind: 'broad-permission',
      title: `Allow ${s.requestingPermission.name}?`,
      body: 'This is a powerful capability. 2030B denies by default — grant it only for this session unless you are sure.',
      confirmLabel: 'Allow for this session',
      weight: 0.7,
      dwellMs: 600,
    };
  }

  if ((s.bulkClosingCount ?? 0) >= 5) {
    return {
      kind: 'bulk-close',
      title: `Close ${s.bulkClosingCount} tabs?`,
      body: 'That is a lot at once. You can reopen them from history, but a Space might be a better home.',
      confirmLabel: `Close ${s.bulkClosingCount} tabs`,
      weight: 0.6,
      dwellMs: 400,
    };
  }

  if ((s.openTabCount ?? 0) >= TAB_SOFT_LIMIT) {
    return {
      kind: 'too-many-tabs',
      title: `${s.openTabCount} tabs open`,
      body: 'Your attention is fragmenting. Want to group these into a Space, or freeze the idle ones?',
      confirmLabel: 'Group into a Space',
      weight: 0.4,
      dwellMs: 0,
    };
  }

  return null;
}
