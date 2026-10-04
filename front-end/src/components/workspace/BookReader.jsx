import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, BookOpen, Check, ChevronLeft, ChevronRight, Download, Highlighter, List, Maximize2, Minimize2, Pencil, Settings2, Trash2, X } from 'lucide-react';
import { Modal } from '../UI.jsx';
import { storage } from '../../storage.js';
import { useT } from '../../i18n.jsx';
import { useApp } from '../../context.jsx';
import { createReaderDocument, HIGHLIGHT_COLORS, markedPassage, normalizeReaderPreferences, normalizeReaderState, READER_PREFERENCES_KEY, readerKey } from '../../bookReader.js';
import s from './BookReader.module.css';

const FONTS = { serif: 'Georgia, "Times New Roman", serif', sans: 'Arial, Helvetica, sans-serif', mono: '"Courier New", monospace' };
const read = key => { try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; } };

export default function BookReader({ book, state, onUpdate, onClose }) {
  const tr = useT();
  const {prefs:appPrefs}=useApp();
  const [document, setDocument] = useState(null);
  const [reading, setReading] = useState(null);
  const [prefs, setPrefs] = useState(() => normalizeReaderPreferences(read(READER_PREFERENCES_KEY)));
  const [panel, setPanel] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [turn,setTurn]=useState(null);
  const turning=useRef(false),turnTimer=useRef(),touch=useRef(null),ownsFullscreen=useRef(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState('');
  const content = useRef(null);
  const pendingParagraph = useRef(null);
  const saveRef = useRef(onUpdate);
  saveRef.current = onUpdate;

  useEffect(()=>{
    const changed=()=>setExpanded(!!window.document.fullscreenElement);
    window.document.addEventListener('fullscreenchange',changed);
    return()=>{clearTimeout(turnTimer.current);window.document.removeEventListener('fullscreenchange',changed);if(ownsFullscreen.current&&window.document.fullscreenElement)window.document.exitFullscreen?.().catch(()=>{})};
  },[]);
  async function fullScreen(){
    try{if(window.document.fullscreenElement)await window.document.exitFullscreen();else{await window.document.documentElement.requestFullscreen();ownsFullscreen.current=true}}
    catch{setMessage('Browser fullscreen is unavailable here. The reading room still fills this window.')}
  }
  useEffect(()=>{
    function shortcuts(e){
      if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||e.target.closest('input,textarea,select,[contenteditable=true]')||!window.getSelection()?.isCollapsed)return;
      if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)&&document&&!draft){e.preventDefault();navigate(e.key==='ArrowRight'?page+1:e.key==='ArrowLeft'?page-1:e.key==='Home'?0:document.pages.length-1)}
      if(e.key.toLowerCase()==='f'){e.preventDefault();fullScreen()}
    }
    window.addEventListener('keydown',shortcuts);return()=>window.removeEventListener('keydown',shortcuts);
  });

  useEffect(() => {
    const controller = new AbortController();
    fetch(book.local, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('This edition could not be loaded. Please try again.');
      return response.text();
    }).then(raw => {
      const next = createReaderDocument(raw);
      setDocument(next);
      setReading(normalizeReaderState(read(readerKey(book.id)) || { page: state.page || 0 }, next));
    }).catch(reason => { if (reason.name !== 'AbortError') setError(reason.message); });
    return () => controller.abort();
  }, [book.id, book.local]);

  useEffect(() => {
    try { storage.setItem(READER_PREFERENCES_KEY, JSON.stringify(prefs)); }
    catch { setSaveError('Your browser could not save reader settings. Keep this tab open and free some browser storage.'); }
  }, [prefs]);

  useEffect(() => {
    if (!reading) return;
    try { storage.setItem(readerKey(book.id), JSON.stringify(reading)); }
    catch { setSaveError('Your browser could not save your notes and reading position. Keep this tab open and free some browser storage.'); }
  }, [reading, book.id]);

  const page = reading?.page || 0;
  useEffect(() => {
    if (!document) return;
    saveRef.current({ page, progress: Math.round((page + 1) / document.pages.length * 100) });
    if (pendingParagraph.current !== null) {
      content.current?.querySelector(`[data-paragraph="${pendingParagraph.current}"]`)?.scrollIntoView({ block: 'center' });
      pendingParagraph.current = null;
    } else content.current?.scrollTo({ top: 0 });
  }, [page, document]);

  const annotations = reading?.annotations || [];
  const pageAnnotations = useMemo(() => annotations.filter(a => a.page === page), [annotations, page]);
  const bookmarked = reading?.bookmarks.includes(page) || false;
  const currentChapter = document?.chapters.filter(chapter => chapter.paragraph <= document.pages[page][0].id).at(-1)?.title;

  function updatePrefs(changes) { setPrefs(v => normalizeReaderPreferences({ ...v, ...changes })); }
  function navigate(next, paragraph = null) {
    if (!document||turning.current) return;
    const target = Math.max(0, Math.min(document.pages.length - 1, next));
    if(target!==page&&!appPrefs.reduceMotion&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      turning.current=true;setTurn({page,scroll:content.current?.scrollTop||0,direction:target>page?'next':'previous'});
      turnTimer.current=setTimeout(()=>{setTurn(null);turning.current=false},580);
    }
    setReading(v => ({ ...v, page: target }));
    setDraft(null);
    setMessage('');
    if (target === page) {
      if (paragraph !== null) content.current?.querySelector(`[data-paragraph="${paragraph}"]`)?.scrollIntoView({ block: 'center' });
      else content.current?.scrollTo({ top: 0 });
    } else pendingParagraph.current = paragraph;
  }
  function toggleBookmark() {
    setReading(v => ({ ...v, bookmarks: bookmarked ? v.bookmarks.filter(p => p !== page) : [...v.bookmarks, page].sort((a, b) => a - b) }));
    setMessage(bookmarked ? 'Bookmark removed.' : 'Page bookmarked.');
  }
  function startAnnotation(segments) {
    if (!segments.length) return;
    setDraft({ id: null, page, segments, color: 'amber', note: '' });
    setPanel('notes');
    setMessage('');
  }
  function captureSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount || !content.current) return;
    const range = selection.getRangeAt(0);
    if (!content.current.contains(range.startContainer) || !content.current.contains(range.endContainer)) return;
    const segments = [];
    for (const element of content.current.querySelectorAll('[data-paragraph]')) {
      if (!range.intersectsNode(element)) continue;
      const selected = element.ownerDocument.createRange();
      selected.selectNodeContents(element);
      if (element.contains(range.startContainer)) selected.setStart(range.startContainer, range.startOffset);
      if (element.contains(range.endContainer)) selected.setEnd(range.endContainer, range.endOffset);
      const before = element.ownerDocument.createRange();
      before.selectNodeContents(element);
      before.setEnd(selected.startContainer, selected.startOffset);
      const start = before.toString().length;
      const quote = selected.toString();
      if (quote.trim()) segments.push({ paragraph: Number(element.dataset.paragraph), start, end: start + quote.length, quote });
    }
    startAnnotation(segments);
  }
  function saveAnnotation() {
    if (!draft) return;
    const saved = { ...draft, id: draft.id || crypto.randomUUID() };
    setReading(v => normalizeReaderState({ ...v, annotations: [...v.annotations.filter(a => a.id !== saved.id), saved] }, document));
    setDraft(null);
    window.getSelection()?.removeAllRanges();
    setMessage('Highlight and note saved.');
  }
  function editAnnotation(annotation) { setDraft({ ...annotation }); setPanel('notes'); }
  function removeAnnotation(id) {
    setReading(v => ({ ...v, annotations: v.annotations.filter(a => a.id !== id) }));
    if (draft?.id === id) setDraft(null);
    setMessage('Annotation removed.');
  }
  function togglePanel(next) { setPanel(current => current === next ? '' : next); }

  return <Modal title={`${book.title} · ${tr('reading room')}`} size="large" className={`${s.dialog} ${s.expanded} ${s['dialog-'+prefs.theme]}`} onClose={onClose}>
    <section className={s.reader} data-reader-theme={prefs.theme} aria-label={tr('Book reader')}>
      <div className={s.toolbar}>
        <div className={s.author}><BookOpen size={18} /><span>{book.author}<small>{tr('Complete edition · read inside Aster')}</small></span></div>
        <div className={s.tools}>
          <button aria-label={tr('Reading settings')} aria-pressed={panel === 'settings'} onClick={() => togglePanel('settings')}><Settings2 size={18} /><span>{tr('Appearance')}</span></button>
          <button aria-label={tr('Contents and bookmarks')} aria-pressed={panel === 'contents'} onClick={() => togglePanel('contents')}><List size={18} /><span>{tr('Contents')}</span></button>
          <button aria-label={tr('Highlights and notes')} aria-pressed={panel === 'notes'} onClick={() => togglePanel('notes')}><Highlighter size={18} /><span>{tr('Notes')} {annotations.length || ''}</span></button>
          <button aria-label={tr(expanded ? 'Exit browser fullscreen' : 'Enter browser fullscreen')} title={tr('Fullscreen · F')} aria-pressed={expanded} onClick={fullScreen}>{expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
        </div>
      </div>
      {saveError && <p className={s.error} role="alert">{tr(saveError)}</p>}
      <div className={`${s.workspace} ${panel ? s.withPanel : ''}`}>
        <div className={s.readingArea}>
          {error ? <div className={s.empty} role="alert"><p>{tr(error)}</p><a href={book.url} target="_blank" rel="noreferrer">{tr('Open original edition')}</a></div> : !document ? <div className={s.empty} role="status">{tr('Loading complete book…')}</div> : <>
            <div className={s.pageCaption}><span>{currentChapter || book.title}</span><button onClick={toggleBookmark} aria-label={tr(bookmarked ? 'Remove page bookmark' : 'Bookmark this page')} aria-pressed={bookmarked}><Bookmark size={17} fill={bookmarked ? 'currentColor' : 'none'} /></button></div>
            <div className={s.bookStage} style={{'--book-width':prefs.width+'px'}}>
            <div className={s.scroll} ref={content} tabIndex={0} aria-label={`${tr('Book text, page')} ${page + 1} ${tr('of')} ${document.pages.length}`} onMouseUp={captureSelection} onTouchStart={e=>{const p=e.touches[0];touch.current={x:p.clientX,y:p.clientY}}} onTouchEnd={e=>{const p=e.changedTouches[0],start=touch.current;touch.current=null;if(start&&Math.abs(p.clientX-start.x)>80&&Math.abs(p.clientY-start.y)<35&&window.getSelection()?.isCollapsed&&!draft){navigate(page+(p.clientX<start.x?1:-1))}else captureSelection()}} onKeyUp={captureSelection}>
              <article className={s.prose} style={{ fontFamily: FONTS[prefs.font], fontSize: prefs.fontSize, lineHeight: prefs.lineHeight, maxWidth: prefs.width }}>
                {document.pages[page].map(paragraph => <div className={s.paragraph} key={paragraph.id}>
                  <p data-paragraph={paragraph.id}>{markedPassage(paragraph.text, paragraph.id, pageAnnotations).map((part, index) => part.annotation ? <mark key={index} data-color={part.annotation.color} title={part.annotation.note || tr('Highlighted passage')} onClick={() => { if (window.getSelection()?.isCollapsed) editAnnotation(part.annotation); }}>{part.text}</mark> : part.text)}</p>
                  <button className={s.paragraphNote} aria-label={`${tr('Annotate paragraph')} ${paragraph.id + 1}`} title={tr('Annotate this paragraph')} onClick={() => startAnnotation([{ paragraph: paragraph.id, start: 0, end: paragraph.text.length, quote: paragraph.text }])}><Pencil size={14} /></button>
                </div>)}
                {page === document.pages.length - 1 && <div className={s.end}><Check size={24} /><h3>{tr('End of the book.')}</h3><button onClick={() => { saveRef.current({ status: 'finished', progress: 100 }); setMessage('Book marked as finished.'); }}>{tr('Mark as finished')}</button></div>}
              </article>
            </div>
            {turn&&<div className={s.flipSheet} data-direction={turn.direction} aria-hidden="true"><div style={{fontFamily:FONTS[prefs.font],fontSize:prefs.fontSize,lineHeight:prefs.lineHeight,transform:`translateY(-${turn.scroll}px)`}}>{document.pages[turn.page].map(p=><p key={p.id}>{p.text}</p>)}</div></div>}
            </div>
            <nav className={s.pagination} aria-label={tr('Reading pages')}>
              <button aria-label={tr('Previous reading page')} title={tr('Previous page · Left arrow')} disabled={page === 0||!!turn} onClick={() => navigate(page - 1)}><ChevronLeft size={18} /><span>{tr('Previous')}</span></button>
              <label>{tr('Page')} <select aria-label={tr('Reading page')} value={page} onChange={event => navigate(Number(event.target.value))}>{document.pages.map((_, index) => <option value={index} key={index}>{index + 1}</option>)}</select> {tr('of')} {document.pages.length}</label>
              <button aria-label={tr('Next reading page')} title={tr('Next page · Right arrow')} disabled={page === document.pages.length - 1||!!turn} onClick={() => navigate(page + 1)}><span>{tr('Next')}</span><ChevronRight size={18} /></button>
            </nav>
          </>}
        </div>
        {panel && <aside className={s.panel} aria-label={tr(panel === 'settings' ? 'Reader appearance' : panel === 'contents' ? 'Book navigation' : 'Book annotations')}>
          <div className={s.panelTitle}><h3>{tr(panel === 'settings' ? 'Make it yours' : panel === 'contents' ? 'Find your place' : 'Your margin notes')}</h3><button aria-label={tr('Close reader panel')} onClick={() => setPanel('')}><X size={17} /></button></div>
          {panel === 'settings' && <div className={s.settings}>
            <p>{tr('A little space for a good book. Your reading preferences are saved automatically.')}</p>
            <label>{tr('Text size')}<div className={s.sizeControl}><button aria-label={tr('Smaller reader text')} disabled={prefs.fontSize <= 14} onClick={() => updatePrefs({ fontSize: prefs.fontSize - 1 })}>A−</button><input aria-label={tr('Reader text size')} type="number" min="14" max="36" value={prefs.fontSize} onChange={e => { if (e.target.value) updatePrefs({ fontSize: Number(e.target.value) }); }} /><span>px</span><button aria-label={tr('Larger reader text')} disabled={prefs.fontSize >= 36} onClick={() => updatePrefs({ fontSize: prefs.fontSize + 1 })}>A+</button></div></label>
            <label>{tr('Font')}<select aria-label={tr('Reader font')} value={prefs.font} onChange={e => updatePrefs({ font: e.target.value })}><option value="serif">{tr('Literary · Georgia')}</option><option value="sans">{tr('Clean · Arial')}</option><option value="mono">{tr('Monospace · Courier')}</option></select></label>
            <label>{tr('Line spacing')}<select aria-label={tr('Reader line spacing')} value={prefs.lineHeight} onChange={e => updatePrefs({ lineHeight: Number(e.target.value) })}><option value="1.3">{tr('Compact · 1.3')}</option><option value="1.6">{tr('Relaxed · 1.6')}</option><option value="1.8">{tr('Comfortable · 1.8')}</option><option value="2.1">{tr('Spacious · 2.1')}</option><option value="2.4">{tr('Extra spacious · 2.4')}</option></select></label>
            <label>{tr('Reading width')}<select aria-label={tr('Reader width')} value={prefs.width} onChange={e => updatePrefs({ width: Number(e.target.value) })}><option value="440">{tr('Narrow')}</option><option value="680">{tr('Comfortable')}</option><option value="900">{tr('Wide')}</option></select></label>
            <fieldset><legend>{tr('Page theme')}</legend><div className={s.themes}>{[['paper', 'Paper'], ['sepia', 'Sepia'], ['night', 'Night']].map(([value, label]) => <button key={value} data-theme={value} aria-pressed={prefs.theme === value} onClick={() => updatePrefs({ theme: value })}>{tr(label)}</button>)}</div></fieldset>
          </div>}
          {panel === 'contents' && <div className={s.contents}>
            <h4>{tr('Bookmarks')}</h4>
            {!reading?.bookmarks.length && <p>{tr('Use the bookmark icon above the text to save a page.')}</p>}
            {reading?.bookmarks.map(p => <button key={p} onClick={() => navigate(p)}><Bookmark size={14} /><span>{tr('Page')} {p + 1}</span></button>)}
            <h4>{tr('Chapters & sections')}</h4>
            <p>{tr('Section headings come from this edition. Reading pages may differ from the printed book.')}</p>
            <button onClick={() => navigate(0)}><span>{tr('Beginning of the book')}</span></button>
            {document?.chapters.map(chapter => <button key={chapter.paragraph} onClick={() => navigate(chapter.page, chapter.paragraph)}><span>{chapter.title}</span><small>{chapter.page + 1}</small></button>)}
          </div>}
          {panel === 'notes' && <div className={s.notes}>
            <p>{tr('Select a passage to highlight it, or use the pencil beside a paragraph. Add your thoughts below.')}</p>
            {draft && <form className={s.noteEditor} onSubmit={event => { event.preventDefault(); saveAnnotation(); }}>
              <h4>{tr(draft.id ? 'Edit annotation' : 'New annotation')}</h4>
              <blockquote>{draft.segments.map(segment => segment.quote).join(' … ')}</blockquote>
              <fieldset><legend>{tr('Highlight color')}</legend><div className={s.colors}>{HIGHLIGHT_COLORS.map(color => <button type="button" key={color} data-color={color} aria-label={`${tr('Highlight color')}: ${color}`} aria-pressed={draft.color === color} onClick={() => setDraft(v => ({ ...v, color }))}>{draft.color === color && <Check size={15} />}</button>)}</div></fieldset>
              <label>{tr('Your note')}<textarea aria-label={tr('Annotation note')} value={draft.note} maxLength={5000} placeholder={tr('An idea, a question, a connection…')} onChange={event => setDraft(v => ({ ...v, note: event.target.value }))} /></label>
              <div className={s.noteActions}><button className={s.primary} type="submit">{tr('Save annotation')}</button><button type="button" onClick={() => setDraft(null)}>{tr('Cancel')}</button></div>
            </form>}
            {!annotations.length && !draft && <div className={s.noNotes}><Highlighter size={25} /><p>{tr('Keep the ideas you want to return to.')}</p></div>}
            {annotations.map(annotation => <article className={s.noteCard} key={annotation.id}>
              <button className={s.jump} onClick={() => navigate(annotation.page, annotation.segments[0].paragraph)}>{tr('Page')} {annotation.page + 1}<ChevronRight size={14} /></button>
              <blockquote data-color={annotation.color}>{annotation.segments.map(segment => segment.quote).join(' … ')}</blockquote>
              {annotation.note && <p>{annotation.note}</p>}
              <div className={s.noteActions}><button aria-label={`${tr('Edit annotation')} ${annotations.indexOf(annotation) + 1}`} onClick={() => editAnnotation(annotation)}><Pencil size={14} />{tr('Edit')}</button><button aria-label={`${tr('Delete annotation')} ${annotations.indexOf(annotation) + 1}`} onClick={() => removeAnnotation(annotation.id)}><Trash2 size={14} />{tr('Delete')}</button></div>
            </article>)}
          </div>}
        </aside>}
      </div>
      <footer className={s.footer}><span role="status">{tr(message || 'Saved in this browser · ← → Turn pages · F Fullscreen · Esc Close')}</span><a href={book.local} download><Download size={13} />{tr('Full text & credits')}</a></footer>
    </section>
  </Modal>;
}
