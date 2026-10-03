import { paginateBook } from './books.js';

export const READER_PREFERENCES_KEY = 'aster-reader-preferences-v1';
export const readerKey = id => `aster-book-reader-v1:${id}`;
export const DEFAULT_READER_PREFERENCES = { fontSize: 20, font: 'serif', lineHeight: 1.8, width: 680, theme: 'paper' };
export const HIGHLIGHT_COLORS = ['amber', 'mint', 'blue', 'rose'];

const choice = (value, options, fallback) => options.includes(value) ? value : fallback;
const number = (value, min, max, fallback) => typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

export function normalizeReaderPreferences(value) {
  const v = value && typeof value === 'object' ? value : {};
  return {
    fontSize: Math.round(number(v.fontSize, 14, 36, 20)),
    font: choice(v.font, ['serif', 'sans', 'mono'], 'serif'),
    lineHeight: number(v.lineHeight, 1.3, 2.4, 1.8),
    width: number(v.width, 440, 900, 680),
    theme: choice(v.theme, ['paper', 'sepia', 'night'], 'paper'),
  };
}

export function createReaderDocument(raw) {
  let index = 0;
  const chapters = [];
  const pages = paginateBook(raw).map((paragraphs, page) => paragraphs.map(text => {
    const paragraph = { id: index++, text };
    if (text.length <= 150 && /^(?:(?:chapter|letter|stave|act|book|part)\s+(?:[IVXLC\d]+\b|one\b|two\b|three\b|four\b|five\b)|[IVXLC]+\.\s+[A-Z])/i.test(text)) {
      chapters.push({ page, paragraph: paragraph.id, title: text });
    }
    return paragraph;
  }));
  if (!pages.length) throw new Error('The book has no readable text. Open its original source instead.');
  return { pages, chapters, paragraphs: pages.flat() };
}

export function normalizeReaderState(value, document) {
  const v = value && typeof value === 'object' ? value : {};
  const last = document.pages.length - 1;
  const validPage = p => Number.isInteger(p) && p >= 0 && p <= last;
  const ids = new Set();
  const annotations = (Array.isArray(v.annotations) ? v.annotations : []).filter(a => a && typeof a.id === 'string' && a.id.length <= 100 && validPage(a.page)).slice(0, 1000).flatMap(a => {
    if (ids.has(a.id)) return [];
    ids.add(a.id);
    const segments = (Array.isArray(a.segments) ? a.segments : []).slice(0, 100).filter(segment => {
      const p = document.paragraphs[segment?.paragraph];
      return p && Number.isInteger(segment.paragraph) && document.pages[a.page].some(item => item.id === p.id) && Number.isInteger(segment.start) && Number.isInteger(segment.end) && segment.start >= 0 && segment.end > segment.start && segment.end <= p.text.length && typeof segment.quote === 'string' && p.text.slice(segment.start, segment.end) === segment.quote;
    }).map(({ paragraph, start, end, quote }) => ({ paragraph, start, end, quote }));
    // A changed edition must never attach an old note to the wrong passage.
    if (!segments.length) return [];
    return [{ id: a.id, page: a.page, segments, color: choice(a.color, HIGHLIGHT_COLORS, 'amber'), note: typeof a.note === 'string' ? a.note.slice(0, 5000) : '' }];
  });
  return {
    page: Math.floor(number(v.page, 0, last, 0)),
    bookmarks: [...new Set((Array.isArray(v.bookmarks) ? v.bookmarks : []).filter(validPage))].sort((a, b) => a - b),
    annotations,
  };
}

export function markedPassage(text, paragraph, annotations) {
  const ranges = annotations.flatMap(a => a.segments.filter(s => s.paragraph === paragraph && text.slice(s.start, s.end) === s.quote).map(s => ({ ...s, annotation: a })));
  const edges = [...new Set([0, text.length, ...ranges.flatMap(r => [r.start, r.end])])].sort((a, b) => a - b);
  return edges.slice(0, -1).map((start, i) => ({ text: text.slice(start, edges[i + 1]), annotation: ranges.findLast(r => r.start <= start && r.end >= edges[i + 1])?.annotation }));
}
