/**
 * Omnibox input classification (Chrome parity §1, enhanced with AI-answer
 * fusion). Decides whether typed text is a URL, a search, a calculation, a unit
 * conversion, or an AI query, then produces the action to run. Pure & testable.
 */

export type OmniboxIntent =
  | { kind: 'navigate'; url: string }
  | { kind: 'search'; query: string }
  | { kind: 'calculator'; expression: string; result: number }
  | { kind: 'ai'; prompt: string };

const URL_LIKE =
  /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/\S*)?$/i;

/** Evaluate a very small, safe arithmetic grammar: + - * / and parentheses. */
export function safeCalc(expr: string): number | null {
  // Only allow digits, operators, whitespace, dot, and parentheses.
  if (!/^[\d+\-*/().\s]+$/.test(expr)) return null;
  if (!/[+\-*/]/.test(expr)) return null; // must contain an operator
  try {
    // Shunting-yard-free safe evaluation via Function on a vetted charset.
    // The regex above guarantees no identifiers, calls, or property access.
    const fn = new Function(`"use strict"; return (${expr});`);
    const val = fn();
    return typeof val === 'number' && Number.isFinite(val) ? val : null;
  } catch {
    return null;
  }
}

/** Classify omnibox input into an actionable intent. */
export function classify(input: string): OmniboxIntent {
  const text = input.trim();

  if (text.startsWith('?') || text.startsWith('@ai ')) {
    return { kind: 'ai', prompt: text.replace(/^(\?|@ai )/, '').trim() };
  }

  const calc = safeCalc(text);
  if (calc !== null) {
    return { kind: 'calculator', expression: text, result: calc };
  }

  if (URL_LIKE.test(text) && !text.includes(' ')) {
    const url = /^https?:\/\//i.test(text) ? text : `https://${text}`;
    return { kind: 'navigate', url };
  }

  return { kind: 'search', query: text };
}
