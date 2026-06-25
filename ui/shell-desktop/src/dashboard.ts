/**
 * Bento-grid new-tab dashboard model (UI/UX manifesto §8).
 *
 * The dashboard is a list of cards with a size and order the user can
 * customise. This module owns the pure card model + layout invariants so the
 * renderer is a thin paint of `layoutCards()`.
 */

export type CardSize = 'sm' | 'wide' | 'tall' | 'hero';

export type CardKind =
  | 'search'
  | 'quicklinks'
  | 'copilot'
  | 'recent'
  | 'notes'
  | 'tasks'
  | 'privacy'
  | 'performance'
  | 'spaces';

export interface BentoCard {
  id: string;
  kind: CardKind;
  title: string;
  size: CardSize;
  /** Lower sorts first. */
  order: number;
  /** User can hide a card without deleting its config. */
  visible: boolean;
}

/** The shipped default dashboard — a useful starting point, fully editable. */
export function defaultCards(): BentoCard[] {
  return [
    { id: 'c-search', kind: 'search', title: 'Ask or go', size: 'hero', order: 0, visible: true },
    { id: 'c-copilot', kind: 'copilot', title: 'Copilot', size: 'tall', order: 1, visible: true },
    { id: 'c-quick', kind: 'quicklinks', title: 'Pinned', size: 'wide', order: 2, visible: true },
    { id: 'c-recent', kind: 'recent', title: 'Recent', size: 'sm', order: 3, visible: true },
    { id: 'c-spaces', kind: 'spaces', title: 'Spaces', size: 'sm', order: 4, visible: true },
    { id: 'c-privacy', kind: 'privacy', title: 'Privacy', size: 'sm', order: 5, visible: true },
    { id: 'c-perf', kind: 'performance', title: 'Performance', size: 'sm', order: 6, visible: true },
    { id: 'c-notes', kind: 'notes', title: 'Notes', size: 'wide', order: 7, visible: true },
    { id: 'c-tasks', kind: 'tasks', title: 'Tasks', size: 'sm', order: 8, visible: true },
  ];
}

/** CSS span classes for each size (matches main.css grid). */
export function spanClass(size: CardSize): string {
  switch (size) {
    case 'hero':
      return 'col-2 row-2 hero';
    case 'wide':
      return 'col-2';
    case 'tall':
      return 'row-2';
    case 'sm':
    default:
      return '';
  }
}

/** Visible cards in display order. */
export function layoutCards(cards: readonly BentoCard[]): BentoCard[] {
  return cards.filter((c) => c.visible).sort((a, b) => a.order - b.order);
}

/** Move a card up/down in the order (drag-and-drop reorder helper). */
export function reorder(cards: BentoCard[], id: string, delta: number): BentoCard[] {
  const sorted = [...cards].sort((a, b) => a.order - b.order);
  const i = sorted.findIndex((c) => c.id === id);
  if (i === -1) return cards;
  const j = Math.max(0, Math.min(sorted.length - 1, i + delta));
  if (i === j) return cards;
  const [moved] = sorted.splice(i, 1);
  sorted.splice(j, 0, moved!);
  return sorted.map((c, idx) => ({ ...c, order: idx }));
}

export function toggleCard(cards: BentoCard[], id: string): BentoCard[] {
  return cards.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c));
}
