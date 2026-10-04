import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ChartNoAxesCombined, NotebookPen, Download } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { useT } from '../../i18n.jsx';
import { readStored, dayKey } from '../../study.js';
import { storage } from '../../storage.js';
import { NOTEBOOK_KEY, normalizeNotebook, revisionAnalytics, reportCsv } from '../../revision.js';
import { PageHeading, Button } from '../UI.jsx';
import RevisionQueue from './RevisionQueue.jsx';
import StudyInsights from './StudyInsights.jsx';
import StudyNotebook from './StudyNotebook.jsx';
import { downloadText } from './downloadText.js';
import s from './Revision.module.css';

export default function RevisionCentre({subject,embedded=false}) {
  const tr = useT();
  const { learning, revisionSchedule, sessionHistory, route, navigate, now } = useApp();
  const [notes, setNotes] = useState(() => normalizeNotebook(readStored(NOTEBOOK_KEY, [])));
  const [selectedNote, setSelectedNote] = useState(() => { const saved = normalizeNotebook(readStored(NOTEBOOK_KEY, [])); return saved.find(note => !note.archived && note.id === route.query.get('note'))?.id || saved.find(note => !note.archived)?.id || null; }), [saveError, setSaveError] = useState(false);
  const tabParam=route.query.get(embedded?'reviewtab':'tab');
  const link=id=>embedded?`subjects/${subject}?tab=revision&reviewtab=${id}`:`revision?tab=${id}`;
  const tab = ['review', 'insights', 'notebook'].includes(tabParam) ? tabParam : 'review';
  const analytics = useMemo(() => revisionAnalytics(learning.attempts, sessionHistory, revisionSchedule, new Date(now), subject), [learning.attempts, sessionHistory, revisionSchedule, now, subject]);
  useEffect(() => {
    try { storage.setItem(NOTEBOOK_KEY, JSON.stringify(notes)); setSaveError(false); }
    catch { setSaveError(true); }
  }, [notes]);

  function createNote(seed = {}) {
    if (notes.length >= 60) return false;
    const note = { id: crypto.randomUUID(), subject: subject||'maths', title: '', cue: '', notes: '', summary: '', pinned: false, archived: false, ...seed, updatedAt: new Date().toISOString() };
    setNotes(list => [note, ...list]); setSelectedNote(note.id); navigate(link('notebook')); return true;
  }

  return <div className={s.root}>
    <PageHeading eyebrow={tr('A CLEARER WAY FORWARD')} title={tr('Your revision centre.')} description={tr('Know what to revisit. See what is changing. Keep the ideas that click.')} action={<Button variant="secondary" onClick={() => downloadText(reportCsv(analytics), `aster-progress-${dayKey()}.csv`, 'text/csv;charset=utf-8')}><Download size={16}/>{tr('Export progress')}</Button>}/>
    <nav className={s.tabs} aria-label={tr('Revision centre sections')}>
      {[[ 'review', 'Review queue', CalendarClock ], [ 'insights', 'Study insights', ChartNoAxesCombined ], [ 'notebook', 'Study notebook', NotebookPen ]].map(([id, label, Icon]) => <a key={id} href={`#/${link(id)}`} aria-current={tab === id ? 'page' : undefined}><Icon size={18}/>{tr(label)}{id === 'review' && analytics.due > 0 && <span>{analytics.due}</span>}</a>)}
    </nav>
    {saveError && <p className={s.error} role="alert">{tr('Your notebook could not be saved. Keep this page open and export your notes.')}</p>}
    {subject && tab === 'insights' && <p className={s.footnote}>These insights include only this subject. Focus sessions without a subject are excluded.</p>}
    {tab === 'review' ? <RevisionQueue fixedSubject={subject} onNote={createNote} notebookFull={notes.length >= 60}/> : tab === 'insights' ? <StudyInsights analytics={analytics}/> : <StudyNotebook fixedSubject={subject} notes={notes} setNotes={setNotes} selected={selectedNote} setSelected={setSelectedNote} onCreate={createNote} saveError={saveError}/>}
    <p className={s.footnote}>{tr('Private to your workspace. Guest work saves in this browser; signed-in work also syncs to your local account. Charts describe practice, not school grades.')}</p>
  </div>;
}
