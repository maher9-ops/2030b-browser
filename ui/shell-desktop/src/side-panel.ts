/**
 * Side panel host (Chrome parity §sidePanel; UI/UX spec §4).
 * Hosts one active panel at a time: AI copilot, reading list, bookmarks,
 * history, or an extension-provided panel.
 */

export type BuiltinPanel = 'copilot' | 'reading-list' | 'bookmarks' | 'history';

export interface ExtensionPanel {
  kind: 'extension';
  extensionId: string;
  panelId: string;
  title: string;
}

export interface BuiltinPanelRef {
  kind: 'builtin';
  panel: BuiltinPanel;
}

export type PanelRef = BuiltinPanelRef | ExtensionPanel;

export class SidePanelHost {
  private active: PanelRef | null = null;
  private width = 360;

  open(ref: PanelRef): void {
    this.active = ref;
  }

  close(): void {
    this.active = null;
  }

  toggle(ref: PanelRef): void {
    if (this.active && this.sameRef(this.active, ref)) {
      this.close();
    } else {
      this.open(ref);
    }
  }

  private sameRef(a: PanelRef, b: PanelRef): boolean {
    if (a.kind === 'builtin' && b.kind === 'builtin') return a.panel === b.panel;
    if (a.kind === 'extension' && b.kind === 'extension') {
      return a.extensionId === b.extensionId && a.panelId === b.panelId;
    }
    return false;
  }

  /** Clamp the panel width to a sane range (px). */
  setWidth(px: number): void {
    this.width = Math.max(280, Math.min(px, 640));
  }

  get current(): PanelRef | null {
    return this.active;
  }

  get isOpen(): boolean {
    return this.active !== null;
  }

  get panelWidth(): number {
    return this.width;
  }
}
