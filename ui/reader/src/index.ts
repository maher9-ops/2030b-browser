/**
 * Reader Mode (Firefox parity §Reader): extract the primary article content
 * from a DOM and estimate reading time. DOM-free core for testability — the
 * renderer passes a simplified node tree.
 */

export interface ReaderNode {
  tag: string;
  text: string;
  children: ReaderNode[];
}

export interface ReaderArticle {
  title: string;
  paragraphs: string[];
  wordCount: number;
  /** Estimated reading time in minutes (200 wpm). */
  readingTimeMin: number;
}

const BLOCK_TAGS = new Set(['p', 'article', 'section', 'main', 'div', 'li', 'blockquote']);
const STRIP_TAGS = new Set(['script', 'style', 'nav', 'header', 'footer', 'aside', 'form']);

function collectText(node: ReaderNode, out: string[]): void {
  if (STRIP_TAGS.has(node.tag)) return;
  const t = node.text.trim();
  if (t && BLOCK_TAGS.has(node.tag)) out.push(t);
  for (const child of node.children) collectText(child, out);
}

export function extractArticle(title: string, root: ReaderNode): ReaderArticle {
  const paragraphs: string[] = [];
  collectText(root, paragraphs);
  const wordCount = paragraphs.reduce((n, p) => n + p.split(/\s+/).filter(Boolean).length, 0);
  return {
    title: title.trim(),
    paragraphs,
    wordCount,
    readingTimeMin: Math.max(1, Math.round(wordCount / 200)),
  };
}
