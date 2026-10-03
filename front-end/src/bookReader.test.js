import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { BOOKS, normalizeReading } from './books.js';
import { createReaderDocument, markedPassage, normalizeReaderPreferences, normalizeReaderState } from './bookReader.js';

const edition = body => `*** START OF THE PROJECT GUTENBERG EBOOK TEST ***\n${body}\n*** END OF THE PROJECT GUTENBERG EBOOK TEST ***`;
const document = createReaderDocument(edition('CHAPTER I\n\nA little curiosity opens a larger world.'));
const annotation = { id: 'first', page: 0, color: 'mint', note: 'An idea worth keeping', segments: [{ paragraph: 1, start: 2, end: 18, quote: 'little curiosity' }] };

test('all books advertised for in-site reading have complete parseable local editions', () => {
  for (const book of BOOKS) {
    assert.ok(book.local, `${book.title} must be readable in the website`);
    const text = readFileSync(new URL(`../public${book.local}`, import.meta.url), 'utf8');
    const result = createReaderDocument(text);
    assert.ok(result.pages.length > 1, book.title);
    assert.ok(result.paragraphs.at(-1).text.length > 0, book.title);
    assert.equal(result.paragraphs.length, new Set(result.paragraphs.map(p => p.id)).size);
    if (book.sha256) assert.equal(createHash('sha256').update(text).digest('hex'), book.sha256, `${book.title}: complete downloaded edition has not changed`);
  }
});

test('unavailable titles disappear without deleting previously saved reading notes', () => {
  assert.equal(BOOKS.some(book => book.id === 'herz-boxers'), false);
  assert.equal(normalizeReading({ 'herz-boxers': { notes: 'My existing course note', saved: true } })['herz-boxers'].notes, 'My existing course note');
});

test('rejects missing end markers and empty books', () => {
  assert.throws(() => createReaderDocument('A sample chapter only'));
  assert.throws(() => createReaderDocument(edition('')));
});

test('first-person sentences are not mistaken for Roman-numbered chapter headings', () => {
  const book = createReaderDocument(edition('I trembled. One subject!\n\nChapter 2\n\nII. The adventure'));
  assert.deepEqual(book.chapters.map(c => c.title), ['Chapter 2', 'II. The adventure']);
});

test('reader preferences cannot load invalid fonts, themes, or unreadable dimensions', () => {
  assert.deepEqual(normalizeReaderPreferences({ font: 'bad', theme: 'bad', fontSize: 500, lineHeight: -1, width: Infinity }), { font: 'serif', theme: 'paper', fontSize: 36, lineHeight: 1.3, width: 680 });
  assert.equal(normalizeReaderPreferences(null).fontSize, 20);
});

test('notes and anchors survive a save/load round trip and identify chapters', () => {
  const saved = JSON.parse(JSON.stringify({ page: 0, bookmarks: [0, 0, -1, 10], annotations: [annotation] }));
  const result = normalizeReaderState(saved, document);
  assert.deepEqual(result.bookmarks, [0]);
  assert.deepEqual(result.annotations, [annotation]);
  assert.equal(document.chapters[0].title, 'CHAPTER I');
});

test('a changed edition or invalid paragraph does not attach a note to unrelated text', () => {
  const altered = createReaderDocument(edition('CHAPTER I\n\nEntirely different words are here.'));
  assert.equal(normalizeReaderState({ annotations: [annotation] }, altered).annotations.length, 0);
  assert.equal(normalizeReaderState({ annotations: [{ ...annotation, segments: [{ ...annotation.segments[0], paragraph: -1 }] }] }, document).annotations.length, 0);
});

test('overlapping highlights preserve every character and retain both saved notes', () => {
  const second = { ...annotation, id: 'second', color: 'blue', segments: [{ paragraph: 1, start: 9, end: 24, quote: 'curiosity opens' }] };
  const marks = markedPassage(document.paragraphs[1].text, 1, [annotation, second]);
  assert.equal(marks.map(m => m.text).join(''), document.paragraphs[1].text);
  assert.ok(marks.some(m => m.annotation?.id === 'first'));
  assert.ok(marks.some(m => m.annotation?.id === 'second'));
});
