import {storage} from '../../storage.js';
import { useT } from "../../i18n.jsx";
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Bookmark, Search, ArrowUpRight, ArrowRight, LibraryBig, Check, ChevronLeft, ChevronRight, Download, Type, Globe2 } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { BOOKS, BOOKS_KEY, ACCESS_LABELS, normalizeReading } from '../../books.js';
import { COURSES, SUBJECT_ORDER, readStored } from '../../study.js';
import { PageHeading, Modal, Button, External } from '../UI.jsx';
import { ReviewBoundary } from '../neon/ReviewBoundary.jsx';
import s from './Workspace.module.css';
import b from './Books.module.css';
import BookReader from './BookReader.jsx';
const COLORS = {
  maths: ['#254d62', '#c5e9dd'],
  science: ['#332f6e', '#c5b4fc'],
  english: ['#5f363f', '#f4c399'],
  german: ['#403049', '#e8b6d7'],
  social: ['#285553', '#bfe2c3'],
  music: ['#4d315b', '#e7b9ee'],
  computing: ['#2a3d5e', '#a9d4f0'],
  spanish: ['#693f2c', '#f4d194'],
  drama: ['#514238', '#f3d6ae']
};
const BookCover = memo(function BookCover({
  book,
  small = false
}) {
  const tr = useT();
  const colors = COLORS[book.subject] || COLORS.english;
  return <div className={`${b.cover} ${small ? b.smallCover : ''}`} style={{
    '--cover-bg': colors[0],
    '--cover-ink': colors[1]
  }} aria-hidden="true"><span className={b.coverEdition}>{tr(book.school ? 'COURSE READING' : book.access === 'public-domain' ? 'THE CLASSICS' : 'OPEN KNOWLEDGE')}</span><div className={b.coverGeometry}><span /><span /><span /></div><strong>{tr(book.title)}</strong>{tr(book.subtitle && <span className={b.coverSubtitle}>{tr(book.subtitle)}</span>)}<span className={b.coverAuthor}>{tr(book.author)}</span><i /></div>;
});
export default function Books() {
  const tr = useT();
  const {
    notify
  } = useApp();
  const [reading, setReading] = useState(() => normalizeReading(readStored(BOOKS_KEY, {}))),
    [search, setSearch] = useState(''),
    [subject, setSubject] = useState('all'),
    [stage, setStage] = useState('all'),
    [access, setAccess] = useState('all'),
    [shelf, setShelf] = useState('all'),
    [book, setBook] = useState(null),
    [reader, setReader] = useState(null);
  const [language,setLanguage]=useState('all'),[genre,setGenre]=useState('all'),[visibleCount,setVisibleCount]=useState(24);
  useEffect(()=>setVisibleCount(24),[subject,stage,access,shelf,search,language,genre]);
  useEffect(() => {
    try {
      storage.setItem(BOOKS_KEY, JSON.stringify(reading));
    } catch {
      notify('Your reading list could not be saved in this browser.');
    }
  }, [reading, notify]);
  const update = useCallback((id, changes) => setReading(v => ({
    ...v,
    [id]: {
      ...v[id],
      ...changes
    }
  })), []);
  const filtered = useMemo(() => BOOKS.filter(item => (language==='all'||item.language===language)&&(genre==='all'||item.topics.includes(genre))&&(subject === 'all' || item.subject === subject) && (stage === 'all' || item.stages.includes(stage)) && (access === 'all' || access === 'full' && item.access !== 'publisher' || access === 'inside' && item.local || access === item.access) && (shelf === 'all' || shelf === 'saved' && reading[item.id]?.saved || shelf === 'reading' && reading[item.id]?.status === 'reading' || shelf === 'school' && item.school) && `${item.title} ${item.subtitle || ''} ${item.author} ${item.topics.join(' ')} ${COURSES[item.subject]?.name}`.toLowerCase().includes(search.toLowerCase())), [subject, stage, access, shelf, reading, search,language,genre]);
  const saved = Object.values(reading).filter(v => v.saved).length,
    started = Object.values(reading).filter(v => v.status === 'reading').length;
  function openReader(item) {
    setReader(item);
    if (!reading[item.id]?.status || reading[item.id].status === 'not-started') update(item.id, {
      status: 'reading'
    });
  }
  return <><PageHeading eyebrow={tr("MORE THAN A READING LIST")} title={tr("The book library.")} description={tr("Course-linked reading and optional books for your next stage of learning.")} /><div className={`${s.pageHero} ${b.libraryHero}`}><div><span className={s.kicker}>{tr("MAKE ROOM FOR A GOOD BOOK")}</span><h2>{tr("Ideas that take you further.")}</h2><p>{tr(BOOKS.length)}{tr(" carefully sourced titles. Open textbooks, classic literature, and verified ISR course connections, with clear access information.")}</p><div className={b.heroStats}><span><strong>{BOOKS.filter(v=>v.access!=="publisher").length}</strong>{tr("free full texts")}</span><span><strong>{BOOKS.filter(v=>v.local).length}</strong>{tr("read inside Aster")}</span><span><strong>{BOOKS.filter(v=>v.school).length}</strong>{tr("ISR course links")}</span></div></div><div className={b.heroBooks} aria-hidden="true"><BookCover book={BOOKS.find(v => v.id === 'frankenstein')} small /><BookCover book={BOOKS.find(v => v.id === 'prealgebra-2e')} small /></div></div><div className={s.notice}><BookOpen size={23} /><span><strong>{tr("Course connection is not a purchase instruction.")}</strong>{tr(" ISR’s German outline confirms the two linked reading units. Exact required editions and future IGCSE/IB booklists need your teacher’s confirmation. Other titles are optional preparation, not official syllabus endorsements.")}</span></div><div className={s.toolbar}><div className="segmented-tabs">{tr([['all', 'All books'], ['saved', `Saved (${saved})`], ['reading', `Reading (${started})`], ['school', 'ISR course-linked']].map(([key, label]) => <button key={key} aria-pressed={shelf === key} className={shelf === key ? 'active' : ''} onClick={() => setShelf(key)}>{tr(label)}</button>))}</div><span className={s.fine}>{tr(filtered.length)} {tr(filtered.length === 1 ? 'title' : 'titles')}</span></div><div className={s.filters}><input aria-label={tr("Search books")} value={search} onChange={e => setSearch(e.target.value)} placeholder={tr("Search books, authors, or topics…")} /><select aria-label={tr("Book subject")} value={subject} onChange={e => setSubject(e.target.value)}><option value="all">{tr("All subjects")}</option>{tr(SUBJECT_ORDER.filter(id => BOOKS.some(item => item.subject === id)).map(id => <option key={id} value={id}>{tr(COURSES[id].name)}</option>))}</select><select aria-label={tr("Study stage")} value={stage} onChange={e => setStage(e.target.value)}><option value="all">{tr("All stages")}</option>{tr(['Grade 8', 'IGCSE', 'IB'].map(v => <option key={v} value={v}>{tr(v)}</option>))}</select><select aria-label={tr("Book access")} value={access} onChange={e => setAccess(e.target.value)}><option value="all">{tr("All access types")}</option><option value="full">{tr("Free full text")}</option><option value="inside">{tr("Read inside Aster")}</option><option value="publisher">{tr("Publisher / library")}</option></select></div><div className={b.extraFilters}><label>{tr("Book language")}<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="all">{tr("All languages")}</option>{[...new Set(BOOKS.map(v=>v.language))].sort().map(v=><option key={v} value={v}>{tr(v)}</option>)}</select></label><label>{tr("Genre or topic")}<select value={genre} onChange={e=>setGenre(e.target.value)}><option value="all">{tr("All genres and topics")}</option>{[...new Set(BOOKS.flatMap(v=>v.topics))].sort().map(v=><option key={v} value={v}>{tr(v)}</option>)}</select></label><span>{tr("Showing")} {Math.min(visibleCount,filtered.length)} / {filtered.length}</span></div><div className={b.bookGrid}>{tr(filtered.slice(0,visibleCount).map(item => <article className={b.bookCard} key={item.id}><button className={b.coverButton} onClick={() => setBook(item)} aria-label={tr(`Details for ${item.title}`)}><BookCover book={item} /></button><button className={`${b.saveBook} ${reading[item.id]?.saved ? b.isSaved : ''}`} aria-label={tr(`${reading[item.id]?.saved ? 'Unsave' : 'Save'} ${item.title}`)} aria-pressed={reading[item.id]?.saved || false} onClick={() => update(item.id, {
          saved: !reading[item.id]?.saved
        })}><Bookmark size={18} fill={reading[item.id]?.saved ? 'currentColor' : 'none'} /></button><div className={b.bookInfo}><div className={b.bookMeta}><span>{tr(COURSES[item.subject].name)}</span><span>{tr(item.stages.join(' / '))}</span></div><h3><button onClick={() => setBook(item)}>{tr(item.title)}</button></h3><p>{tr(item.author)}</p><span className={`${b.accessTag} ${item.school ? b.schoolTag : ''}`}>{tr(item.school ? 'ISR course-linked' : item.local ? 'Read inside Aster' : ACCESS_LABELS[item.access])}</span>{tr(reading[item.id]?.status === 'reading' && <div className={b.readingProgress}><div className={s.progress}><span style={{
                width: (reading[item.id]?.progress || 0) + '%'
              }} /></div><span>{tr(reading[item.id]?.progress || 0)}{tr("% position")}</span></div>)}{tr(reading[item.id]?.status === 'finished' && <span className={b.finished}><Check size={13} />{tr("Marked finished")}</span>)}<button className={b.bookAction} onClick={() => item.local ? openReader(item) : setBook(item)}>{tr(item.local ? 'Open reader' : 'Explore book')}<ArrowRight size={15} /></button></div></article>))}</div>{filtered.length>visibleCount&&<div className={b.loadMore}><Button variant="secondary" onClick={()=>setVisibleCount(v=>v+24)}>{tr("Load more books")}<ChevronRight size={15}/></Button></div>}{tr(!filtered.length && <div className={s.empty}><Search size={32} /><h3>{tr("No books in this view.")}</h3><p>{tr("Try another subject, stage, or search term.")}</p><Button variant="secondary" onClick={() => {
        setSearch('');
        setSubject('all');
        setStage('all');
        setAccess('all');
        setShelf('all');setLanguage('all');setGenre('all');
      }}>{tr("Reset filters")}</Button></div>)}<p className={s.fine}>{tr("Links and course connections checked 20 September 2026. Full texts are provided only through public-domain editions or authorized open access. Publisher-only titles link to legitimate information, previews, or purchase options. Book artwork is original typographic design for Aster.")}</p>{tr(book && <BookDetails book={book} state={reading[book.id] || {}} update={changes => update(book.id, changes)} onClose={() => setBook(null)} onRead={() => openReader(book)} />)} {tr(reader && <ReviewBoundary onClose={() => setReader(null)}><BookReader key={reader.id} book={reader} state={reading[reader.id] || {}} onUpdate={changes => update(reader.id, changes)} onClose={() => setReader(null)} /></ReviewBoundary>)}</>;
}
function BookDetails({
  book,
  state,
  update,
  onRead,
  onClose
}) {
  const tr = useT();
  return <Modal title={tr(book.title)} size="large" onClose={onClose}><div className={b.detailLayout}><BookCover book={book} /><div className={b.detailContent}><span className={s.kicker}>{tr(COURSES[book.subject].name)}{tr(" · ")}{tr(book.stages.join(' / '))}</span><h2>{tr(book.title)}</h2>{tr(book.subtitle && <h3>{tr(book.subtitle)}</h3>)}<p className={b.detailAuthor}>{tr(book.author)}</p><p>{tr(book.description)}</p><div className={b.topicPills}>{tr(book.topics.map(topic => <span className={s.pill} key={topic}>{tr(topic)}</span>))}</div><div className={b.accessNote}><strong>{tr(ACCESS_LABELS[book.access])}</strong><p>{tr(book.rights)}</p></div><div className={s.actions}>{tr(book.local && <Button onClick={onRead}><BookOpen size={16} />{tr("Read full book here")}</Button>)}<a className={s.buttonLink} href={book.url} target="_blank" rel="noopener noreferrer">{tr(book.access === 'publisher' ? 'Publisher information' : 'Read on original site')}<ArrowUpRight size={16} /></a>{tr(book.preview && <a className={s.linkText} href={book.preview} target="_blank" rel="noopener noreferrer">{tr("Authorized preview")}</a>)}</div><p className={s.sourceLine}>{tr(book.connection)}{tr(" · ")}<a href={book.source} target="_blank" rel="noopener noreferrer">{tr(book.school ? 'Verify in Schoolbox' : 'Source & edition')}</a>{tr(" · ")}{tr(book.language)}</p><div className={b.readingControls}><label>{tr("Reading status")}<select value={state.status || 'not-started'} onChange={e => update({
              status: e.target.value,
              ...(e.target.value === 'finished' ? {
                progress: 100
              } : {})
            })}><option value="not-started">{tr("Not started")}</option><option value="reading">{tr("Currently reading")}</option><option value="finished">{tr("Finished")}</option></select></label><label>{tr("Reading position · ")}{tr(state.progress || 0)}{tr("%")}<input aria-label={tr("Reading position")} type="range" min="0" max="100" step="1" value={state.progress || 0} onChange={e => update({
              progress: Number(e.target.value)
            })} /></label><label>{tr("My reading notes")}<textarea value={state.notes || ''} onChange={e => update({
              notes: e.target.value
            })} maxLength={2000} placeholder={tr("Ideas, questions, and passages to revisit…")} /></label><button className="text-link" onClick={() => update({
            saved: !state.saved
          })}><Bookmark size={15} />{tr(state.saved ? 'Saved to your shelf' : 'Save to my shelf')}</button></div></div></div></Modal>;
}
