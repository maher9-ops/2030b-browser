import { describe, it, expect } from 'vitest';
import { extractArticle, type ReaderNode } from './index.js';

function node(tag: string, text = '', children: ReaderNode[] = []): ReaderNode {
  return { tag, text, children };
}

describe('extractArticle', () => {
  it('keeps block text and strips chrome', () => {
    const root = node('main', '', [
      node('nav', 'Home About Contact'),
      node('p', 'First paragraph with several words here.'),
      node('script', 'window.x = 1'),
      node('p', 'Second paragraph.'),
    ]);
    const a = extractArticle('My Title', root);
    expect(a.title).toBe('My Title');
    expect(a.paragraphs).toEqual(['First paragraph with several words here.', 'Second paragraph.']);
    expect(a.wordCount).toBe(8);
    expect(a.readingTimeMin).toBe(1);
  });

  it('estimates reading time at ~200 wpm', () => {
    const big = Array.from({ length: 50 }, () => 'word').join(' ');
    const root = node('article', '', [node('p', `${big} ${big} ${big} ${big} ${big} ${big} ${big} ${big}`)]);
    const a = extractArticle('Long', root);
    expect(a.wordCount).toBe(400);
    expect(a.readingTimeMin).toBe(2);
  });
});
