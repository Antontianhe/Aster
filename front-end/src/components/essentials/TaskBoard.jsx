import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCheck, Clock3, Plus, Search, Star, Target } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { useT } from '../../i18n.jsx';
import { COURSES } from '../../study.js';
import { dueLabel, dueTimestamp, sortHomework, taskDay } from '../../homework.js';
import { TASK_ESTIMATES, taskEstimate, taskStatus, boardSummary, choosePriority, changeTaskStatus, quickTask } from '../../taskBoard.js';
import { PageHeading, Button, SubjectIcon } from '../UI.jsx';
import s from './Essentials.module.css';

const COLUMNS = [['todo', 'To do'], ['doing', 'In progress'], ['done', 'Done']];
export default function TaskBoard() {
  const tr = useT(), { homework, setHomework, now, setDialog, setPrefs, navigate, notify, route } = useApp();
  const [search, setSearch] = useState(''), [subject, setSubject] = useState('all'), [period, setPeriod] = useState(() => route.query.get('view') === 'today' ? 'today' : 'all');
  const [title, setTitle] = useState(''), [course, setCourse] = useState('maths'), [estimate, setEstimate] = useState(25), [error, setError] = useState('');
  const summary = useMemo(() => boardSummary(homework, new Date(now)), [homework, now]);
  const visible = useMemo(() => sortHomework(homework.filter(t => (subject === 'all' || t.course === subject) && t.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()) && (period === 'all' || period === 'today' && t.plannedFor === summary.today || period === 'overdue' && !t.done && dueTimestamp(t) < now || period === 'undated' && !t.due))), [homework, subject, search, period, now, summary.today]);
  const peak = Math.max(30, ...summary.days.map(day => day.minutes));
  function dueCaption(task) {
    if (!task.due) return tr('No date set');
    const [day, time] = dueLabel(task.due, new Date(now), task.allDay).split(' · ');
    const label = ['Today', 'Tomorrow', 'Yesterday'].includes(day) ? tr(day) : new Date(taskDay(task) + 'T12:00:00Z').toLocaleDateString(tr.locale, { day: 'numeric', month: 'short', ...(taskDay(task).slice(0, 4) !== summary.today.slice(0, 4) ? { year: 'numeric' } : {}) });
    return label + (time ? ' · ' + time : '');
  }
  function add(e) {
    e.preventDefault();
    try { const task = quickTask({ title, course, due: new FormData(e.currentTarget).get('due'), estimateMinutes: estimate }); setHomework(list => [...list, task]); setTitle(''); setError(''); notify(tr('Task added to your board.')); }
    catch (err) { setError(err.message); }
  }
  function priority(id) {
    try { setHomework(choosePriority(homework, id, summary.today)); setError(''); }
    catch (err) { setError(err.message); }
  }
  function status(id, value) {
    const old = homework.find(t => t.id === id); if (!old) return;
    setHomework(list => changeTaskStatus(list, id, value));
    notify(tr('Task status updated.'), { label: tr('Undo'), run: () => setHomework(list => changeTaskStatus(list, id, taskStatus(old))) });
  }
  function focus(task) { setPrefs(p => ({ ...p, stopwatch: { elapsed: 0, startedAt: null, ...p.stopwatch, task: task.title } })); navigate('overview'); }
  return <div className={s.root}>
    <PageHeading eyebrow={tr('MAKE ROOM FOR WHAT MATTERS')} title={tr('A plan you can actually finish.')} description={tr('Choose three priorities, break work into steps, and see what is moving.')} action={<Button variant="secondary" onClick={() => setDialog({ type: 'task-edit' })}><Plus size={17}/>{tr('Detailed task')}</Button>}/>
    <div className={s.metrics}>
      {[[summary.open, 'Open tasks', Target], [summary.doing, 'In progress', Clock3], [summary.overdue, 'Overdue', CheckCheck]].map(([value, label, Icon]) => <div key={label}><Icon size={19}/><strong>{value}</strong><span>{tr(label)}</span></div>)}
    </div>
    <section className={s.workload} aria-labelledby="workload-heading">
      <div><span className={s.kicker}>{tr('THE NEXT SEVEN DAYS')}</span><h2 id="workload-heading">{tr('A little perspective.')}</h2><p>{tr('Estimated work by due date. Open tasks only.')}</p><small>{summary.unestimated} {tr('tasks without an estimate')}</small></div>
      <div className={s.bars}>{summary.days.map(day => <div key={day.day} className={day.day === summary.today ? s.todayBar : ''}><span>{day.minutes}{tr('m')}</span><div className={s.barTrack}><i style={{ height: `${day.minutes / peak * 100}%` }}/></div><strong>{new Date(day.day + 'T12:00:00').toLocaleDateString(tr.locale, { weekday: 'short' })}</strong><small>{day.count} {tr('tasks')}</small>{day.unestimated > 0 && <small className={s.noEstimate}>{day.unestimated} {tr('unestimated')}</small>}</div>)}</div>
    </section>
    <form className={s.capture} onSubmit={add}>
      <label className={s.captureTitle}>{tr('Quick capture')}<input value={title} onChange={e => setTitle(e.target.value)} required maxLength={180} placeholder={tr('What needs doing?')}/></label>
      <label>{tr('Subject')}<select value={course} onChange={e => setCourse(e.target.value)}>{Object.entries(COURSES).map(([id, c]) => <option key={id} value={id}>{tr(c.name)}</option>)}</select></label>
      <label>{tr('Due date (optional)')}<input type="date" name="due"/></label>
      <label>{tr('Time estimate')}<select value={estimate} onChange={e => setEstimate(Number(e.target.value))}>{TASK_ESTIMATES.map(v => <option key={v} value={v}>{v ? v + ' ' + tr('min') : tr('No estimate')}</option>)}</select></label>
      <Button type="submit"><Plus size={17}/>{tr('Add task')}</Button>
    </form>
    {error && <p className={s.error} role="alert">{tr(error)}</p>}
    <div className={s.filters}><label className={s.search}><Search size={18}/><input aria-label={tr('Search tasks')} value={search} onChange={e => setSearch(e.target.value)} placeholder={tr('Search tasks')}/></label><select aria-label={tr('Filter by subject')} value={subject} onChange={e => setSubject(e.target.value)}><option value="all">{tr('All subjects')}</option>{Object.entries(COURSES).map(([id,c]) => <option key={id} value={id}>{tr(c.name)}</option>)}</select><select aria-label={tr('Filter tasks')} value={period} onChange={e => setPeriod(e.target.value)}>{[['all','All tasks'],['today','Today’s priorities'],['overdue','Overdue'],['undated','No date set']].map(([id,label]) => <option key={id} value={id}>{tr(label)}</option>)}</select></div>
    <div className={s.board}>{COLUMNS.map(([id, label]) => {
      const tasks = visible.filter(t => taskStatus(t) === id);
      return <section key={id} className={s.column} aria-label={tr(label)}><header><span className={`${s.statusDot} ${s[id]}`}/><h2>{tr(label)}</h2><span>{tasks.length}</span></header><div className={s.cards}>{tasks.map(task => <article className={`${s.task} ${task.plannedFor === summary.today ? s.priority : ''}`} key={task.id}>
        <div className={s.taskMeta}><span><SubjectIcon id={task.course} size={15}/>{tr(COURSES[task.course]?.name)}</span><button className={s.iconButton} disabled={task.done} aria-label={tr('Today’s priority') + ': ' + task.title} aria-pressed={task.plannedFor === summary.today} onClick={() => priority(task.id)}><Star size={17} fill={task.plannedFor === summary.today ? 'currentColor' : 'none'}/></button></div>
        <button className={s.taskTitle} onClick={() => setDialog({ type: 'task-detail', id: task.id })}>{task.title}</button>
        <p className={!task.done && dueTimestamp(task) < now ? s.late : ''}>{dueCaption(task)}</p>
        {task.checklist?.length > 0 && <small className={s.checklist}><CheckCheck size={14}/>{task.checks?.length || 0}/{task.checklist.length} {tr('steps complete')}</small>}
        <div className={s.taskControls}><label><span>{tr('Status')}</span><select aria-label={tr('Status') + ': ' + task.title} value={taskStatus(task)} onChange={e => status(task.id, e.target.value)}>{COLUMNS.map(([value, caption]) => <option key={value} value={value}>{tr(caption)}</option>)}</select></label><label><span>{tr('Time estimate')}</span><select aria-label={tr('Time estimate') + ': ' + task.title} value={taskEstimate(task)} onChange={e => {const value=Number(e.target.value); setHomework(list => list.map(t => t.id === task.id ? { ...t, estimateMinutes: value } : t));}}>{TASK_ESTIMATES.map(v => <option key={v} value={v}>{v ? v + ' ' + tr('min') : tr('No estimate')}</option>)}</select></label></div>
        {!task.done && <button className={s.textButton} onClick={() => focus(task)}>{tr('Focus on this')}<ArrowRight size={14}/></button>}
      </article>)}{!tasks.length && <div className={s.emptyColumn}>{tr('Nothing here yet.')}<small>{tr(search || subject !== 'all' || period !== 'all' ? 'Try another filter.' : 'Your next step starts in To do.')}</small></div>}</div></section>;
    })}</div>
    <p className={s.footnote}>{tr('Star up to three open tasks for today. Your board and homework list always stay in sync.')}</p>
  </div>;
}
