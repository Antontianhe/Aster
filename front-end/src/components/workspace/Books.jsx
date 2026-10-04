import { storage } from '../../storage.js';
import { useT } from '../../i18n.jsx';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Bookmark, Search, ArrowRight, Check, ChevronRight, Info } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { BOOKS, BOOKS_KEY, normalizeReading } from '../../books.js';
import { COURSES, SUBJECT_ORDER, readStored } from '../../study.js';
import { PageHeading, Modal, Button } from '../UI.jsx';
import { ReviewBoundary } from '../neon/ReviewBoundary.jsx';
import BookReader from './BookReader.jsx';
import s from './Workspace.module.css';
import b from './Books.module.css';

const COLORS = {
  maths: ['#254d62', '#c5e9dd'], science: ['#332f6e', '#c5b4fc'],
  english: ['#5f363f', '#f4c399'], german: ['#403049', '#e8b6d7'],
  social: ['#285553', '#bfe2c3'], music: ['#4d315b', '#e7b9ee'],
  computing: ['#2a3d5e', '#a9d4f0'], spanish: ['#693f2c', '#f4d194'],
  drama: ['#514238', '#f3d6ae'],
};
const LANGUAGES = [...new Set(BOOKS.map(book => book.language))].sort();
const TOPICS = [...new Set(BOOKS.flatMap(book => book.topics))].sort();
const SUBJECTS = SUBJECT_ORDER.filter(id => BOOKS.some(book => book.subject === id));

const BookCover = memo(function BookCover({ book, small = false }) {
  const tr = useT();
  if (!book) return null;
  const colors = COLORS[book.subject] || COLORS.english;
  return <div className={`${b.cover} ${small ? b.smallCover : ''}`} style={{ '--cover-bg': colors[0], '--cover-ink': colors[1] }} aria-hidden="true">
    <span className={b.coverEdition}>{tr('THE COMPLETE EDITION')}</span>
    <div className={b.coverGeometry}><span /><span /><span /></div>
    <strong>{book.title}</strong>
    {book.subtitle && <span className={b.coverSubtitle}>{book.subtitle}</span>}
    <span className={b.coverAuthor}>{book.author}</span><i />
  </div>;
});

export default function Books() {
  const tr = useT();
  const { notify } = useApp();
  const [reading, setReading] = useState(() => normalizeReading(readStored(BOOKS_KEY, {})));
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('all');
  const [stage, setStage] = useState('all');
  const [shelf, setShelf] = useState('all');
  const [language, setLanguage] = useState('all');
  const [genre, setGenre] = useState('all');
  const [sort, setSort] = useState('featured');
  const [visibleCount, setVisibleCount] = useState(24);
  const [book, setBook] = useState(null);
  const [reader, setReader] = useState(null);
  useEffect(() => setVisibleCount(24), [subject, stage, shelf, search, language, genre, sort]);
  useEffect(() => {
    try { storage.setItem(BOOKS_KEY, JSON.stringify(reading)); }
    catch { notify('Your reading list could not be saved in this browser.'); }
  }, [reading, notify]);
  const update = useCallback((id, changes) => setReading(value => ({ ...value, [id]: { ...value[id], ...changes } })), []);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const result = BOOKS.filter(item =>
      (language === 'all' || item.language === language) &&
      (genre === 'all' || item.topics.includes(genre)) &&
      (subject === 'all' || item.subject === subject) &&
      (stage === 'all' || item.stages.includes(stage)) &&
      (shelf === 'all' || shelf === 'saved' && reading[item.id]?.saved || shelf === 'reading' && reading[item.id]?.status === 'reading' || shelf === 'finished' && reading[item.id]?.status === 'finished') &&
      `${item.title} ${item.subtitle || ''} ${item.author} ${item.topics.join(' ')} ${COURSES[item.subject]?.name || ''}`.toLocaleLowerCase().includes(query)
    );
    if (sort === 'title') result.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'author') result.sort((a, b) => a.author.localeCompare(b.author) || a.title.localeCompare(b.title));
    if (sort === 'short') result.sort((a, b) => (a.words || Infinity) - (b.words || Infinity));
    return result;
  }, [subject, stage, shelf, reading, search, language, genre, sort]);
  const saved = BOOKS.filter(item => reading[item.id]?.saved).length;
  const started = BOOKS.filter(item => reading[item.id]?.status === 'reading').length;
  function openReader(item) {
    setBook(null);
    setReader(item);
    if (!reading[item.id]?.status || reading[item.id].status === 'not-started') update(item.id, { status: 'reading' });
  }
  function resetFilters() {
    setSearch(''); setSubject('all'); setStage('all'); setShelf('all'); setLanguage('all'); setGenre('all'); setSort('featured');
  }

  return <>
    <PageHeading eyebrow={tr('YOUR READING ROOM')} title={tr('The book library.')} description={tr('Complete books to read, highlight, and make your own.')} />
    <div className={`${s.pageHero} ${b.libraryHero}`}>
      <div><span className={s.kicker}>{tr('MAKE ROOM FOR A GOOD BOOK')}</span><h2>{tr('Your next chapter starts here.')}</h2>
        <p>{BOOKS.length} {tr('complete books. Every title opens right here, with your notes, bookmarks, and reading preferences.')}</p>
        <div className={b.heroStats}>
          <span><strong>{BOOKS.length}</strong>{tr('readable books')}</span>
          <span><strong>{LANGUAGES.length}</strong>{tr('languages')}</span>
          <span><strong>{SUBJECTS.length}</strong>{tr('subject areas')}</span>
        </div>
      </div>
      <div className={b.heroBooks} aria-hidden="true"><BookCover book={BOOKS.find(item => item.id === 'frankenstein') || BOOKS[0]} small /><BookCover book={BOOKS.find(item => item.id === 'pg-11') || BOOKS[1]} small /></div>
    </div>
    <div className={s.notice}><BookOpen size={23} /><span><strong>{tr('Every book is ready to read here.')}</strong> {tr('Open a cover to start. Your place, highlights, and notes stay saved in this browser.')}</span></div>
    <div className={s.toolbar}>
      <div className="segmented-tabs">{[['all', 'All books'], ['saved', `Saved (${saved})`], ['reading', `Reading (${started})`], ['finished', 'Finished']].map(([key, label]) => <button key={key} aria-pressed={shelf === key} className={shelf === key ? 'active' : ''} onClick={() => setShelf(key)}>{tr(label)}</button>)}</div>
      <span className={s.fine}>{filtered.length} {tr(filtered.length === 1 ? 'book' : 'books')}</span>
    </div>
    <div className={`${s.filters} ${b.libraryFilters}`}>
      <input aria-label={tr('Search books')} value={search} onChange={event => setSearch(event.target.value)} placeholder={tr('Search books, authors, or topics…')} />
      <select aria-label={tr('Book subject')} value={subject} onChange={event => setSubject(event.target.value)}><option value="all">{tr('All subjects')}</option>{SUBJECTS.map(id => <option key={id} value={id}>{tr(COURSES[id]?.name || id)}</option>)}</select>
      <select aria-label={tr('Study stage')} value={stage} onChange={event => setStage(event.target.value)}><option value="all">{tr('All stages')}</option>{['Grade 8', 'IGCSE', 'IB'].map(value => <option key={value} value={value}>{value}</option>)}</select>
      <select aria-label={tr('Sort books')} value={sort} onChange={event => setSort(event.target.value)}><option value="featured">{tr('Featured order')}</option><option value="title">{tr('Title · A–Z')}</option><option value="author">{tr('Author · A–Z')}</option><option value="short">{tr('Shortest first')}</option></select>
    </div>
    <div className={b.extraFilters}>
      <label>{tr('Book language')}<select value={language} onChange={event => setLanguage(event.target.value)}><option value="all">{tr('All languages')}</option>{LANGUAGES.map(value => <option key={value} value={value}>{tr(value)}</option>)}</select></label>
      <label>{tr('Genre or topic')}<select value={genre} onChange={event => setGenre(event.target.value)}><option value="all">{tr('All genres and topics')}</option>{TOPICS.map(value => <option key={value} value={value}>{tr(value)}</option>)}</select></label>
      <span>{tr('Showing')} {Math.min(visibleCount, filtered.length)} / {filtered.length}</span>
    </div>
    <div className={b.bookGrid}>{filtered.slice(0, visibleCount).map(item => <article className={b.bookCard} key={item.id}>
      <button className={b.coverButton} onClick={() => openReader(item)} aria-label={`${tr('Read')} ${item.title}`}><BookCover book={item} /></button>
      <button className={`${b.saveBook} ${reading[item.id]?.saved ? b.isSaved : ''}`} aria-label={`${tr(reading[item.id]?.saved ? 'Unsave' : 'Save')} ${item.title}`} aria-pressed={reading[item.id]?.saved || false} onClick={() => update(item.id, { saved: !reading[item.id]?.saved })}><Bookmark size={18} fill={reading[item.id]?.saved ? 'currentColor' : 'none'} /></button>
      <div className={b.bookInfo}>
        <div className={b.bookMeta}><span>{tr(item.topics[0] || COURSES[item.subject]?.name || item.subject)}</span><span>{tr(item.language)}</span></div>
        <h3><button onClick={() => openReader(item)}>{item.title}</button></h3><p>{item.author}</p>
        <span className={b.accessTag}>{tr('Complete book · read here')}</span>
        {reading[item.id]?.status === 'reading' && <div className={b.readingProgress}><div className={s.progress}><span style={{ width: `${reading[item.id]?.progress || 0}%` }} /></div><span>{reading[item.id]?.progress || 0}{tr('% position')}</span></div>}
        {reading[item.id]?.status === 'finished' && <span className={b.finished}><Check size={13} />{tr('Marked finished')}</span>}
        <button className={b.bookAction} onClick={() => openReader(item)}>{tr(reading[item.id]?.status === 'reading' ? 'Continue reading' : 'Open reader')}<ArrowRight size={15} /></button>
        <button className={b.aboutBook} aria-label={`${tr('About')} ${item.title}`} onClick={() => setBook(item)}><Info size={13} />{tr('About this book')}</button>
      </div>
    </article>)}</div>
    {filtered.length > visibleCount && <div className={b.loadMore}><Button variant="secondary" onClick={() => setVisibleCount(value => value + 24)}>{tr('Load more books')}<ChevronRight size={15} /></Button></div>}
    {!filtered.length && <div className={s.empty}><Search size={32} /><h3>{tr('No books in this view.')}</h3><p>{tr('Try another subject, language, or search term.')}</p><Button variant="secondary" onClick={resetFilters}>{tr('Reset filters')}</Button></div>}
    <p className={s.fine}>{tr('Complete public-domain text editions with original credits preserved. These books are optional reading; study-stage labels are suggestions, not confirmed ISR set texts. Historical works reflect the language and ideas of their time.')}</p>
    {book && <BookDetails book={book} state={reading[book.id] || {}} update={changes => update(book.id, changes)} onClose={() => setBook(null)} onRead={() => openReader(book)} />}
    {reader && <ReviewBoundary onClose={() => setReader(null)}><BookReader key={reader.id} book={reader} state={reading[reader.id] || {}} onUpdate={changes => update(reader.id, changes)} onClose={() => setReader(null)} /></ReviewBoundary>}
  </>;
}

function BookDetails({ book, state, update, onRead, onClose }) {
  const tr = useT();
  return <Modal title={book.title} size="large" onClose={onClose}>
    <div className={b.detailLayout}><BookCover book={book} /><div className={b.detailContent}>
      <span className={s.kicker}>{tr(COURSES[book.subject]?.name || book.subject)} · {tr(book.language)}</span><h2>{book.title}</h2>
      {book.subtitle && <h3>{book.subtitle}</h3>}<p className={b.detailAuthor}>{book.author}</p><p>{tr(book.description)}</p>
      <div className={b.topicPills}>{book.topics.map(topic => <span className={s.pill} key={topic}>{tr(topic)}</span>)}</div>
      <div className={b.accessNote}><strong>{tr('The complete book, inside Learnify.')}</strong><p>{book.words ? `${book.words.toLocaleString()} ${tr('words')} · ` : ''}{tr('Adjust the text, highlight passages, and save your notes as you read.')}</p></div>
      <Button onClick={onRead}><BookOpen size={16} />{tr('Read full book here')}</Button>
      <p className={s.sourceLine}><a href={book.source} target="_blank" rel="noopener noreferrer">{tr('Source & edition credits')}</a> · {book.stages.join(' / ')}</p>
      <div className={b.readingControls}>
        <label>{tr('Reading status')}<select value={state.status || 'not-started'} onChange={event => update({ status: event.target.value, ...(event.target.value === 'finished' ? { progress: 100 } : {}) })}><option value="not-started">{tr('Not started')}</option><option value="reading">{tr('Currently reading')}</option><option value="finished">{tr('Finished')}</option></select></label>
        <label>{tr('My reading notes')}<textarea value={state.notes || ''} onChange={event => update({ notes: event.target.value })} maxLength={2000} placeholder={tr('Ideas, questions, and passages to revisit…')} /></label>
        <button className="text-link" onClick={() => update({ saved: !state.saved })}><Bookmark size={15} />{tr(state.saved ? 'Saved to your shelf' : 'Save to my shelf')}</button>
      </div>
    </div></div>
  </Modal>;
}
