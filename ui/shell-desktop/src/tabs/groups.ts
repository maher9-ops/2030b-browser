/**
 * Tab and tab-group model (Chrome parity §2, §3): named, color-coded,
 * collapsible, saveable groups, with drag-to-reorder. Pure model logic so it is
 * unit-testable independent of the renderer.
 */

export type TabGroupColor =
  | 'grey'
  | 'blue'
  | 'red'
  | 'yellow'
  | 'green'
  | 'pink'
  | 'purple'
  | 'cyan';

export interface Tab {
  id: string;
  title: string;
  url: string;
  /** Whether audio is currently playing. */
  audible: boolean;
  /** Whether the user muted this tab. */
  muted: boolean;
  pinned: boolean;
}

export interface TabGroup {
  id: string;
  name: string;
  color: TabGroupColor;
  collapsed: boolean;
  tabIds: string[];
}

/** A window's tab strip: ordered tabs plus optional groups. */
export class TabStrip {
  private tabs = new Map<string, Tab>();
  private order: string[] = [];
  private groups = new Map<string, TabGroup>();

  addTab(tab: Tab): void {
    this.tabs.set(tab.id, tab);
    this.order.push(tab.id);
  }

  closeTab(id: string): void {
    this.tabs.delete(id);
    this.order = this.order.filter((t) => t !== id);
    for (const g of this.groups.values()) {
      g.tabIds = g.tabIds.filter((t) => t !== id);
    }
  }

  /** Reorder a tab to a new index (drag-to-reorder). */
  moveTab(id: string, toIndex: number): void {
    const from = this.order.indexOf(id);
    if (from === -1) return;
    this.order.splice(from, 1);
    const clamped = Math.max(0, Math.min(toIndex, this.order.length));
    this.order.splice(clamped, 0, id);
  }

  createGroup(group: Omit<TabGroup, 'tabIds'>, tabIds: string[]): void {
    this.groups.set(group.id, { ...group, tabIds: [...tabIds] });
  }

  toggleCollapse(groupId: string): void {
    const g = this.groups.get(groupId);
    if (g) g.collapsed = !g.collapsed;
  }

  setMuted(tabId: string, muted: boolean): void {
    const t = this.tabs.get(tabId);
    if (t) t.muted = muted;
  }

  get tabOrder(): readonly string[] {
    return this.order;
  }

  getGroup(id: string): TabGroup | undefined {
    return this.groups.get(id);
  }

  get tabCount(): number {
    return this.tabs.size;
  }
}
