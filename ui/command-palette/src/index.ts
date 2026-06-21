/**
 * @b2030b/command-palette — the Ctrl/Cmd+K command palette, omnibox
 * classification, and fuzzy ranking shared across the UI shell.
 */

export { fuzzyMatch, rank } from './fuzzy.js';
export type { FuzzyMatch, Rankable } from './fuzzy.js';
export { classify, safeCalc } from './omnibox.js';
export type { OmniboxIntent } from './omnibox.js';

import { rank, type Rankable } from './fuzzy.js';

/** A palette command the user can invoke. */
export interface Command extends Rankable {
  id: string;
  label: string;
  /** Optional keyboard shortcut display string, e.g. "Ctrl+T". */
  shortcut?: string;
}

/** The command palette model: holds commands and answers fuzzy queries. */
export class CommandPalette {
  private commands: Command[] = [];

  register(command: Command): void {
    this.commands.push(command);
  }

  /** Return commands matching `query`, best first. */
  search(query: string): Command[] {
    return rank(query, this.commands);
  }

  get size(): number {
    return this.commands.length;
  }
}
