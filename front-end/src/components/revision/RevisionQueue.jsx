import React, { useMemo, useState } from 'react';
import { ArrowRight, CalendarClock, Search, CheckCircle2, BookOpen, NotebookPen, CircleHelp } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { useT } from '../../i18n.jsx';
import { COURSES, SUBJECT_ORDER, dayKey, shiftDay } from '../../study.js';
import { revisionQueue } from '../../revision.js';
import { Button, ColorIcon } from '../UI.jsx';
import s from './Revision.module.css';

export default function RevisionQueue({ onNote, notebookFull }) {
  const tr = useT(), { revisionSchedule, startRevision, navigate, now } = useApp();
  const [subject, setSubject] = useState('all'), [filter, setFilter] = useState('due'), [query, setQuery] = useState(''), [limit, setLimit] = useState(12);
  const all = useMemo(() => revisionQueue(revisionSchedule, { filter: 'all', now }), [revisionSchedule, now]);
  const queue = useMemo(() => revisionQueue(revisionSchedule, { subject, filter, query, now }), [revisionSchedule, subject, filter, query, now]);
  const due = all.filter(c => c.due), support = all.filter(c => c.needsSupport);
  const batch = queue.length ? queue.filter(c => c.subject === queue[0].subject).slice(0, 10) : [];
  const future = Array.from({ length: 7 }, (_, index) => {
    const day = shiftDay(dayKey(new Date(now)), index);
    return { day, count: all.filter(c => !c.due && dayKey(new Date(c.dueAt)) === day).length };
  });
  function change(setter, value) { setter(value); setLimit(12); }
  return <>
    <section className={s.hero}><div><span className={s.kicker}>{tr('SMALL SESSIONS. LASTING UNDERSTANDING.')}</span><h2>{due.length ? tr('A few ideas are ready for another look.') : tr('A little space helps ideas settle.')}</h2><p>{tr('Your answers shape your next review. Missed answers, hints, and low confidence get an earlier follow-up.')}</p><Button onClick={() => batch.length ? startRevision(batch[0].subject, batch.map(c => c.question.id)) : navigate('practice')}>{batch.length ? `${tr('Review')} ${tr(COURSES[batch[0].subject].name)} · ${batch.length}` : tr('Explore practice')}<ArrowRight size={17}/></Button><small>{tr('One subject, up to 10 questions. Stop after a manageable session.')}</small></div><div className={s.heroCount}><CalendarClock size={28}/><strong>{due.length}</strong><span>{tr('ready to revisit')}</span></div></section>
    <div className={s.metrics}><div><strong>{all.length}</strong><span>{tr('Questions tracked')}</span></div><div><strong>{support.length}</strong><span>{tr('Could use another look')}</span></div><div><strong>{all.length - due.length}</strong><span>{tr('Scheduled for later')}</span></div></div>
    <div className={s.queueLayout}><section className={s.panel}>
      <div className={s.panelHeading}><div><h2>{tr('Make your next session count.')}</h2><p>{tr('Filter your queue, or return to a particular idea.')}</p><p className={s.subtle} role="status">{queue.length} {tr('matching questions')}</p></div></div>
      <div className={s.filters}><label>{tr('Subject')}<select value={subject} onChange={e => change(setSubject, e.target.value)}><option value="all">{tr('All subjects')}</option>{SUBJECT_ORDER.map(id => <option key={id} value={id}>{tr(COURSES[id].name)}</option>)}</select></label><label>{tr('Show')}<select value={filter} onChange={e => change(setFilter, e.target.value)}><option value="due">{tr('Ready to revisit')}</option><option value="support">{tr('Needs support')}</option><option value="all">{tr('All tracked questions')}</option></select></label></div>
      <label className={s.search}><Search size={17}/><input value={query} onChange={e => change(setQuery, e.target.value)} placeholder={tr('Find an idea…')} aria-label={tr('Search your review queue')}/></label>
      {!queue.length && <div className={s.empty}><CheckCircle2 size={32}/><h3>{tr(all.length ? 'Nothing in this view.' : 'Your next answer starts the story.')}</h3><p>{tr(all.length ? 'Try a different filter, or explore something new.' : 'Complete a practice question to build your personal review schedule.')}</p><Button variant="secondary" onClick={() => navigate('practice')}>{tr('Open practice library')}<ArrowRight size={16}/></Button></div>}
      <div className={s.queue}>{queue.slice(0, limit).map(card => <article key={card.key}><div className={s.rowTop}><ColorIcon id={card.subject} size={18}/><span>{tr(COURSES[card.subject].name)} · {tr(card.question.topic)}</span><span className={s.badge} data-tone={card.due ? 'amber' : 'blue'}>{tr(card.due ? 'Ready' : 'Later')}</span></div><h3>{card.question.q}</h3><p>{tr(!card.correct ? 'Last answer needs correction' : card.hintUsed ? 'Last answer used a hint' : card.confidence === 1 ? 'Correct, but not yet confident' : 'Building confidence')} · {tr('Next review')}: {new Date(card.dueAt).toLocaleDateString(tr.locale, { day: 'numeric', month: 'short', timeZone: 'Europe/Berlin' })}</p><div className={s.rowActions}><button onClick={() => startRevision(card.subject, [card.question.id])}><ArrowRight size={15}/>{tr('Try again')}</button><button disabled={notebookFull} onClick={() => onNote({ subject: card.subject, title: card.question.topic, cue: card.question.q, notes: `${card.question.options[card.question.a]}\n\n${card.question.why}` })}><NotebookPen size={15}/>{tr('Make a study note')}</button></div></article>)}</div>
      {queue.length > limit && <Button variant="secondary" onClick={() => setLimit(n => n + 12)}>{tr('Show more')}</Button>}
      {notebookFull && <p className={s.subtle}>{tr('Notebook limit reached: 60 notes. Edit an existing note or export your notebook.')}</p>}
    </section><aside className={s.sideStack}>
      <section className={s.panel}><CalendarClock size={23}/><h2>{tr('Coming up')}</h2><p>{tr('Scheduled reviews for the next seven days. Ready items stay in your queue until you practise them.')}</p><div className={s.forecast}>{future.map(day => <div key={day.day}><span>{new Date(day.day + 'T12:00:00Z').toLocaleDateString(tr.locale, { weekday: 'short', day: 'numeric' })}</span><div><i style={{ width: `${day.count ? Math.max(8, day.count / Math.max(1, ...future.map(d => d.count)) * 100) : 0}%` }}/></div><strong>{day.count}</strong></div>)}</div></section>
      <section className={s.tip}><BookOpen size={23}/><h3>{tr('Recall first. Reveal second.')}</h3><p>{tr('Explain an answer in your own words before checking it. Use your notebook to keep the explanation that makes sense to you.')}</p></section>
      <details className={s.explainer}><summary><CircleHelp size={17}/>{tr('How review timing works')}</summary><p>{tr('A missed, hinted, or low-confidence answer returns after one day. A confident correct answer starts at three days; later successful reviews gradually extend up to 30 days. Same-day repeats do not extend the interval.')}</p><p>{tr('This is a practice schedule, not a prediction of what you will remember or an exam-grade forecast.')}</p></details>
    </aside></div>
  </>;
}
