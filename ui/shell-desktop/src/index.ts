/**
 * Browser 2030B desktop shell — public surface.
 *
 * Aggregates the pure, renderer-independent models that make up the chrome of
 * the browser window: tab strip, spaces, layouts, permissions, about: pages,
 * and the side panel. The Tauri/Vite renderer binds these to the DOM; keeping
 * them pure makes the whole shell unit-testable.
 */

export * from './tabs/groups.js';
export * from './spaces/index.js';
export * from './layouts.js';
export * from './permissions.js';
export * from './about-pages.js';
export * from './side-panel.js';

import { TabStrip } from './tabs/groups.js';
import { SpaceManager } from './spaces/index.js';
import { SidePanelHost } from './side-panel.js';
import { PermissionStore } from './permissions.js';
import { AboutRegistry } from './about-pages.js';
import { configFor, type LayoutPreset, type LayoutConfig } from './layouts.js';

/** The complete in-memory state of one browser window. */
export class Shell {
  readonly tabs = new TabStrip();
  readonly spaces = new SpaceManager();
  readonly sidePanel = new SidePanelHost();
  readonly permissions = new PermissionStore();
  readonly about = new AboutRegistry();

  private layout: LayoutConfig = configFor('classic');

  setLayout(preset: LayoutPreset): void {
    this.layout = configFor(preset);
  }

  get layoutConfig(): LayoutConfig {
    return this.layout;
  }
}
