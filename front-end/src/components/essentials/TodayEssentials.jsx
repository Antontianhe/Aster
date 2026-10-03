import React, { useMemo } from 'react';
import { ArrowUpRight, FileText, NotebookPen, Star } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { useT } from '../../i18n.jsx';
import { readStored } from '../../study.js';
import { STUDIO_KEY, normalizeDocuments } from '../../studio.js';
import { NOTEBOOK_KEY, normalizeNotebook } from '../../revision.js';
import { boardSummary } from '../../taskBoard.js';
import s from './Essentials.module.css';

export default function TodayEssentials() {
  const tr = useT(), { homework, now, navigate, toggleTask } = useApp();
  const priorities = useMemo(() => boardSummary(homework, new Date(now)).priorities, [homework, now]);
  const recent = useMemo(() => [
    ...normalizeDocuments(readStored(STUDIO_KEY, [])).map(doc => ({ ...doc, label: doc.type === 'slides' ? 'Presentation' : 'Essay', icon: FileText, path: 'writing?doc=' + encodeURIComponent(doc.id) })),
    ...normalizeNotebook(readStored(NOTEBOOK_KEY, [])).filter(note => !note.archived).map(note => ({ ...note, label: 'Study note', icon: NotebookPen, path: 'revision?tab=notebook&note=' + encodeURIComponent(note.id) })),
  ].sort((a,b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0)).slice(0, 3), []);
  return <div className={s.todayGrid}>
    <section className={s.homePanel}><header><h2><Star size={18}/>{tr('Today’s priorities')}</h2><button onClick={() => navigate('board?view=today')}>{tr('Plan today')}<ArrowUpRight size={16}/></button></header><p>{tr('Three small commitments. A clearer day.')}</p>{priorities.length ? <div className={s.priorityList}>{priorities.map(task => <label key={task.id} className={task.done ? s.completed : ''}><input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)}/><span>{task.title}</span></label>)}</div> : <button className={s.startPlan} onClick={() => navigate('board')}><Star size={22}/><span>{tr('Choose what matters today.')}<small>{tr('Star a task on your board to bring it here.')}</small></span><ArrowUpRight size={17}/></button>}</section>
    <section className={s.homePanel}><header><h2><NotebookPen size={18}/>{tr('Pick up your work')}</h2><a href="#/backup" aria-label={tr('Backup & recovery')}><ArrowUpRight size={18}/></a></header><p>{tr('Your latest notes and writing, one click away.')}</p><div className={s.recent}>{recent.map(item => <button key={item.path} onClick={() => navigate(item.path)}><item.icon size={19}/><span><strong>{item.title || tr('Untitled note')}</strong><small>{tr(item.label)}</small></span><ArrowUpRight size={16}/></button>)}</div>{!recent.length && <div className={s.emptyRecent}><a href="#/writing">{tr('Start writing')}<ArrowUpRight size={15}/></a><a href="#/revision?tab=notebook">{tr('Open study notebook')}<ArrowUpRight size={15}/></a></div>}</section>
  </div>;
}
