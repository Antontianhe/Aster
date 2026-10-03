import PracticeLibrary from './PracticeLibrary.jsx';
import { useT } from "../i18n.jsx";
import { WeekPlanner } from './workspace/WeekPlanner.jsx';
import plannerStyles from './workspace/Planner.module.css';
import { StudySets } from './StudySets.jsx';
import { MindMap } from './MindMap.jsx';
import React, { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Plus, Search, SlidersHorizontal, CalendarDays, Clock3, Check, CheckCircle2, ChevronLeft, ChevronRight, Bookmark, BookOpen, Layers3, Play, Pin, Bell, Download, School, Target, Sparkles, Flame, Timer, FileText, LayoutGrid, ListFilter, TrendingUp, ArrowDown, ExternalLink, MoreHorizontal, X } from 'lucide-react';
import { useApp } from '../context.jsx';
import { COURSES, SUBJECT_META, SUBJECT_ORDER, RESOURCES, dayKey, shiftDay, localDayDate, activeStreak, minutesLabel } from '../study.js';
import { SCHOOL } from '../schoolData.js';
import { SCHOOL_NEWS } from '../schoolExtras.js';
import { dueTimestamp, sortHomework, taskDay, dueLabel } from '../homework.js';
import { Blue, Button, ColorIcon, SubjectTag, SubjectIcon, External, Empty, PageHeading, SectionHeader, MiniCalendar, SubjectCard, TaskRow, ResourceRow, Progress } from './UI.jsx';
export function Overview() {
  const tr = useT();
  const {
    prefs,
    progress,
    homework,
    now,
    navigate,
    setDialog,
    setReview,
    notify,
    sessionHistory
  } = useApp();
  const pending = sortHomework(homework.filter(t => !t.done)),
    today = dayKey(new Date(now));
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const date = localDayDate(today);
    return {
      year: date.getFullYear(),
      month: date.getMonth()
    };
  });
  const [selectedDay, setSelectedDay] = useState(today);
  const markers = homework.filter(t => !t.done && t.due).reduce((all, t) => {
    (all[taskDay(t)] ??= []).push(t);
    return all;
  }, {});
  const weekEnd = shiftDay(today, 7),
    thisWeek = pending.filter(t => t.due && taskDay(t) >= today && taskDay(t) <= weekEnd);
  const focusedToday = sessionHistory.filter(s => s.kind === 'focus' && dayKey(new Date(s.finishedAt)) === today).reduce((sum, s) => sum + s.minutes, 0);
  const hour = Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    hour: '2-digit',
    hourCycle: 'h23'
  }).format(new Date(now)));
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const next = pending.find(t => t.due && dueTimestamp(t) > now),
    recommended = next?.course || progress.course || 'music';
  const [blueMessage, setBlueMessage] = useState('');
  return <><PageHeading eyebrow={tr(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Berlin',
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(new Date(now)))} title={tr(`${greeting}, ${prefs.name}.`)} description={tr("A fresh page, a little focus, and room to grow.")} action={<Button variant="secondary" onClick={() => setDialog({
      type: 'task-edit'
    })}><Plus size={17} />{tr("Add homework")}</Button>} />
  <div className="overview-layout"><div className="overview-main"><section className="welcome-hero"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-copy"><span className="hero-kicker"><span />{tr(" YOUR SPACE TO GROW")}</span><h2>{tr("Small steps.")}<br /><em>{tr("Brilliant possibilities.")}</em></h2><p>{tr(next ? <>{tr("A little ")}{tr(COURSES[recommended].name.toLowerCase())}{tr(" today goes a long way.")}<br />{tr("Blue’s ready whenever you are.")}</> : 'Pick a subject, find your focus, and make a little progress.')}</p><Button onClick={() => COURSES[recommended].questions.length ? setReview(recommended) : navigate(`subjects/${recommended}`)}>{tr("Let’s get into it ")}<ArrowRight size={18} /></Button><span className="hero-time"><Clock3 size={13} />{tr(" Just 5 minutes to start")}</span></div><div className="hero-art"><span className="floating-note note-one"><Sparkles size={15} />{tr(" One step at a time")}</span><Blue interactive className="hero-blue" onGreet={() => setBlueMessage(m => m ? '' : 'Hey! Ready to make something click?')} />{tr(blueMessage && <div className="blue-speech" role="status">{tr(blueMessage)}</div>)}<span className="hero-star star-one">{tr("✦")}</span><span className="hero-star star-two">{tr("✦")}</span><span className="hero-dot" /></div></section>
  <section className="overview-stats" aria-label={tr("Your study overview")}><div><span className="stat-icon tone-blue"><CalendarDays size={21} /></span><div><strong>{tr(thisWeek.length)}<small>{tr("this week")}</small></strong><p>{tr("Upcoming deadlines")}</p></div></div><div><span className="stat-icon tone-mint"><Timer size={21} /></span><div><strong>{tr(focusedToday)}<small>{tr("/ ")}{tr(prefs.dailyGoal)}{tr(" min")}</small></strong><p>{tr("Focus time today")}</p></div></div><div><span className="stat-icon tone-peach"><Flame size={21} /></span><div><strong>{tr(activeStreak(progress, new Date(now)))}<small>{tr("day")}{tr(activeStreak(progress, new Date(now)) === 1 ? '' : 's')}</small></strong><p>{tr("Your review streak")}</p></div></div></section>
  <section className="dashboard-tasks"><SectionHeader title={tr("On your radar")} description={tr("A little organisation makes a lot of difference.")} action={<button className="text-link" onClick={() => navigate('homework')}>{tr("All homework ")}<ArrowRight size={15} /></button>} /><div className="task-list-card">{tr(pending.slice(0, 3).map(t => <TaskRow task={t} key={t.id} compact />))}{tr(!pending.length && <Empty title={tr("A lovely clear list")} icon={CheckCircle2}>{tr("Your homework is all checked off.")}</Empty>)}<div className="task-list-footer"><span><span className="status-dot" />{tr(pending.filter(t => !t.due).length)}{tr(" tasks have a date to confirm")}</span><button onClick={() => navigate('homework?filter=undated')}>{tr("Take a look ")}<ArrowRight size={13} /></button></div></div></section>
  <section><SectionHeader title={tr("Your subjects")} description={tr("Different worlds. One curious mind.")} action={<button className="text-link" onClick={() => navigate('subjects')}>{tr("View all 13 ")}<ArrowRight size={15} /></button>} /><div className="subject-grid overview-subjects">{tr((prefs.pinned.length ? prefs.pinned : SUBJECT_ORDER).slice(0, 4).map(id => <SubjectCard key={id} id={id} compact />))}</div></section>
  <section><SectionHeader title={tr("From your classroom")} description={tr("Useful updates from ISR Schoolbox.")} /><div className="news-grid">{tr(SCHOOL_NEWS.slice(0, 2).map(news => <a href={news.url} className="news-card" target="_blank" rel="noreferrer" key={news.id}><span className={`news-icon tone-${SUBJECT_META[news.subject].color}`}><SubjectIcon id={news.subject} size={23} /></span><span className="news-meta">{tr(news.tag)}{tr(" · ")}{tr(new Intl.DateTimeFormat('en-GB', {
                  day: 'numeric',
                  month: 'short'
                }).format(new Date(news.date + 'T12:00:00')))}</span><h3>{tr(news.title)}</h3><p>{tr(news.excerpt)}</p><span className="news-source">{tr("Read the school notice ")}<ArrowUpRight size={15} /></span></a>))}</div></section>
  </div><aside className="overview-aside"><section className="panel calendar-panel"><div className="panel-eyebrow">{tr("YOUR LITTLE LOOK AHEAD")}</div><MiniCalendar selected={selectedDay} onSelect={setSelectedDay} month={calendarMonth} onMonth={setCalendarMonth} markers={markers} /><div className="calendar-key"><i className="tone-violet" />{tr("Assessment")}<i className="tone-peach" />{tr("Homework")}</div><div className="calendar-selection"><h4>{tr(selectedDay === today ? 'Today' : new Intl.DateTimeFormat('en-GB', {
                day: 'numeric',
                month: 'short'
              }).format(localDayDate(selectedDay)))}<span>{tr(markers[selectedDay]?.length || 0)}{tr(" planned")}</span></h4>{tr(markers[selectedDay]?.length ? markers[selectedDay].slice(0, 2).map(t => <button key={t.id} onClick={() => setDialog({
              type: 'task-detail',
              id: t.id
            })}><span className={`event-line tone-${SUBJECT_META[t.course].color}`} /><span><strong>{tr(t.title)}</strong><small>{tr(t.allDay ? 'Time to confirm' : berlinTime(t.due))}{tr(" · ")}{tr(COURSES[t.course].name)}</small></span><ChevronRight size={15} /></button>) : <p>{tr("Nothing due. Space for a little discovery.")}</p>)}<button className="text-link" onClick={() => navigate(`planner?day=${selectedDay}`)}>{tr("Open your planner ")}<ArrowRight size={14} /></button></div></section>
  <section className="focus-prompt"><span className="focus-prompt-icon"><Timer size={27} /></span><span className="eyebrow">{tr("LESS SCROLL. MORE FOCUS.")}</span><h3>{tr("A moment for")}<br />{tr("your next big idea.")}</h3><p>{tr("One task. A quiet timer.")}<br />{tr("See what 25 minutes can do.")}</p><button className="button button-dark" onClick={() => navigate('focus')}><Play size={15} fill="currentColor" />{tr("Enter focus room")}</button><span className="focus-prompt-doodle" aria-hidden="true">{tr("✳")}</span></section>
  <section className="week-goal panel"><div className="section-inline"><h3>{tr("Your weekly rhythm")}</h3><span className="tone-butter tiny-icon"><TrendingUp size={18} /></span></div><p>{tr("A bit of practice, more often.")}</p><div className="week-days">{tr(Array.from({
              length: 7
            }, (_, i) => {
              const start = shiftDay(today, -((localDayDate(today).getDay() + 6) % 7)),
                key = shiftDay(start, i),
                studied = progress.studyDays.includes(key);
              return <div key={key}><span>{tr(['M', 'T', 'W', 'T', 'F', 'S', 'S'][i])}</span><span className={`${studied ? 'studied' : ''} ${key === today ? 'today' : ''}`}>{tr(studied ? <Check size={15} /> : key === today ? <span /> : null)}</span></div>;
            }))}</div><div className="week-goal-bottom"><span>{tr(progress.studyDays.filter(d => d >= shiftDay(today, -6) && d <= today).length)}{tr(" active days in the last 7")}</span><Sparkles size={16} /></div></section>
  <div className="school-source"><School size={18} /><p>{tr("Made for your ISR school day.")}<br /><External href={SCHOOL.url}>{tr("Schoolbox · checked 19 Sep")}</External></p></div></aside></div></>;
}
function berlinTime(value) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}
export function Subjects() {
  const tr = useT();
  const {
    prefs
  } = useApp();
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState('All subjects');
  const list = SUBJECT_ORDER.filter(id => (category === 'All subjects' || category === 'Pinned' && prefs.pinned.includes(id) || SUBJECT_META[id].category === category) && `${COURSES[id].name} ${COURSES[id].title}`.toLowerCase().includes(search.toLowerCase()));
  return <><PageHeading eyebrow={tr("YOUR ISR CLASSES.")} title={tr("Your subjects.")} description={tr("Course materials, revision notes, and progress in one place.")} /><div className="page-toolbar"><div className="segmented-tabs">{tr(['All subjects', 'Pinned', 'Core', 'Languages', 'Creative', 'Wellbeing'].map(c => <button key={c} onClick={() => setCategory(c)} className={category === c ? 'active' : ''} aria-pressed={category === c}>{tr(c)}{tr(c === 'All subjects' && <span>{tr("13")}</span>)}</button>))}</div><label className="search-input"><Search size={18} /><input aria-label={tr("Search subjects")} placeholder={tr("Find a subject…")} value={search} onChange={e => setSearch(e.target.value)} />{tr(search && <button aria-label={tr("Clear subject search")} onClick={() => setSearch('')}><X size={15} /></button>)}</label></div><div className="subject-grid all-subjects">{tr(list.map(id => <SubjectCard id={id} key={id} />))}</div>{tr(!list.length && <Empty title={tr("Nothing here just yet")} icon={Search}>{tr(category === 'Pinned' ? 'Pin a subject to keep it close.' : 'Try another subject or clear your filters.')}</Empty>)}<SourceNote /></>;
}
export function SubjectPage({
  id
}) {
  const tr = useT();
  const {
    navigate,
    progress,
    homework,
    setReview,
    setCards,
    setDialog,
    prefs,
    setPrefs
  } = useApp();
  const course = COURSES[id],
    meta = SUBJECT_META[id];
  const [tab, setTab] = useState('Overview');
  if (!course) return <Empty title={tr("Subject not found")} action={<Button onClick={() => navigate('subjects')}>{tr("Back to subjects")}</Button>}>{tr("Choose one of your enrolled subjects.")}</Empty>;
  const tasks = sortHomework(homework.filter(t => t.course === id && !t.done)),
    pinned = prefs.pinned.includes(id);
  return <><button className="back-link" onClick={() => navigate('subjects')}><ChevronLeft size={16} />{tr("All subjects")}</button><header className={`subject-hero tone-${meta.color}`}><div><span className="eyebrow">{tr("GRADE 8 · ")}{tr(course.code)}</span><h1>{tr(course.name)}</h1><p>{tr(course.description)}</p><div className="subject-hero-meta"><span><BookOpen size={15} />{tr(course.resources.length)}{tr(" resources")}</span><span><CalendarDays size={15} />{tr(tasks.length)}{tr(" open tasks")}</span></div></div><span className="subject-hero-icon"><SubjectIcon id={id} size={95} /></span><button className={`button button-white ${pinned ? 'is-pinned' : ''}`} onClick={() => setPrefs(p => ({
        ...p,
        pinned: pinned ? p.pinned.filter(s => s !== id) : [...p.pinned, id]
      }))}><Pin size={15} />{tr(pinned ? 'Pinned' : 'Pin subject')}</button></header><div className="line-tabs" role="tablist" aria-label={tr("Subject sections")}>{tr(['Overview', 'Resources', 'Revision notes', 'Mind map'].map(t => <button role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={tab === t ? 'active' : ''} key={t}>{tr(t)}{tr(t === 'Resources' && <span>{tr(course.resources.length)}</span>)}</button>))}</div>
  {tr(tab === 'Overview' && <div className="subject-detail-grid"><section><SectionHeader eyebrow={tr("CURRENT CHAPTER")} title={tr(course.title)} description={tr("A few ideas worth getting familiar with.")} />{tr(course.notes.length ? <div className="topic-list">{tr(course.notes.map(([title, text], i) => <button className="topic-row" key={title} onClick={() => setDialog({
            type: 'note',
            subject: id,
            index: i
          })}><span className={`topic-number tone-${meta.color}`}>{tr(String(i + 1).padStart(2, '0'))}</span><div><h3>{tr(title)}</h3><p>{tr(text.slice(0, 90))}{tr("…")}</p></div><ArrowUpRight size={18} /></button>))}</div> : <div className="class-link-panel"><ColorIcon id={id} size={35} /><h3>{tr("Your classroom starts here.")}</h3><p>{tr("Open your class page for the latest materials from your teacher.")}</p><External className="button button-primary" href={course.source}>{tr("Open ")}{tr(course.name)}</External></div>)}<section className="subject-homework"><SectionHeader title={tr("On the to-do list")} action={<button className="text-link" onClick={() => setDialog({
            type: 'task-edit',
            course: id
          })}><Plus size={15} />{tr("Add a task")}</button>} />{tr(tasks.length ? <div className="task-list-card">{tr(tasks.map(t => <TaskRow task={t} key={t.id} />))}</div> : <Empty title={tr("All clear for this subject")} icon={CheckCircle2}>{tr("No open homework in your saved list.")}</Empty>)}</section></section><aside><div className="subject-review-card"><span className={`review-symbol tone-${meta.color}`}><Layers3 size={30} /></span><h3>{tr("Make it click.")}</h3><p>{tr(course.questions.length ? 'A quick review helps today’s learning stick around.' : 'Explore the materials and build your understanding at your own pace.')}</p>{tr(course.questions.length > 0 && <><div className="review-facts"><span><Clock3 size={15} />{tr("5 minutes")}</span><span><Target size={15} />{tr("Choose your session length")}</span></div><Button className="full" onClick={() => setReview(id)}>{tr("Start a quick review ")}<ArrowRight size={17} /></Button><Button variant="secondary" className="full" onClick={() => setCards(id)}><Layers3 size={16} />{tr("Try flashcards")}</Button></>)}<div className="best-score"><span>{tr("Personal best")}</span><strong>{tr(progress.bestScores[id] !== undefined ? `${progress.bestScores[id]}%` : 'Your first try awaits')}</strong></div></div><div className="source-card"><School size={23} /><h4>{tr("Straight from your classroom")}</h4><p>{tr("These short revision notes are written for Aster. Your teacher’s original material is one click away.")}</p><External href={course.unitSource || course.source}>{tr("Open the Schoolbox unit")}</External></div></aside></div>)}
  {tr(tab === 'Resources' && <section><SectionHeader title={tr("From your teacher")} description={tr("Original resources open securely in Schoolbox.")} /><div className="resource-list">{tr(RESOURCES.filter(r => r.subject === id).map(r => <ResourceRow resource={r} key={r.id} />))}</div></section>)}
  {tr(tab === 'Mind map' && <MindMap subject={id} />)}
  {tr(tab === 'Revision notes' && <section><SectionHeader title={tr("The ideas to keep")} description={tr("Aster revision notes, informed by your class topics.")} action={course.notes.length > 0 && <Button variant="secondary" onClick={() => setCards(id)}><Layers3 size={16} />{tr("Flashcards")}</Button>} /><div className="notes-grid">{tr(course.notes.map(([title, text], i) => <article className="revision-note" key={title}><span className={`note-number tone-${meta.color}`}>{tr("0")}{tr(i + 1)}</span><h3>{tr(title)}</h3><p>{tr(text)}</p><button className="text-link" onClick={() => setDialog({
            type: 'note',
            subject: id,
            index: i
          })}>{tr("Focus on this idea ")}<ArrowUpRight size={15} /></button></article>))}</div>{tr(!course.notes.length && <Empty title={tr("Your teacher has the latest")} icon={BookOpen} action={<External href={course.source}>{tr("Open your class page")}</External>}>{tr("Use the original classroom materials for this subject.")}</Empty>)}</section>)}</>;
}
export function Homework() {
  const tr = useT();
  const {
    homework,
    setDialog,
    now,
    exportCalendar,
    route
  } = useApp();
  const [filter, setFilter] = useState(route.query.get('filter') || 'todo'),
    [subject, setSubject] = useState('all'),
    [search, setSearch] = useState(''),
    [sort, setSort] = useState('date');
  const open = homework.filter(t => !t.done),
    today = dayKey(new Date(now));
  const counts = {
    todo: open.length,
    week: open.filter(t => t.due && taskDay(t) >= today && taskDay(t) <= shiftDay(today, 7)).length,
    undated: open.filter(t => !t.due).length,
    done: homework.filter(t => t.done).length
  };
  let visible = sortHomework(homework.filter(t => (subject === 'all' || t.course === subject) && `${t.title} ${t.details}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || filter === 'todo' && !t.done || filter === 'week' && !t.done && t.due && taskDay(t) >= today && taskDay(t) <= shiftDay(today, 7) || filter === 'undated' && !t.done && !t.due || filter === 'done' && t.done)));
  if (sort === 'priority') visible.sort((a, b) => ({
    high: 0,
    normal: 1,
    low: 2
  })[a.priority || 'normal'] - {
    high: 0,
    normal: 1,
    low: 2
  }[b.priority || 'normal']);
  if (sort === 'subject') visible.sort((a, b) => COURSES[a.course].name.localeCompare(COURSES[b.course].name));
  return <><PageHeading eyebrow={tr("YOUR WORKLOAD, IN VIEW.")} title={tr("Your homework.")} description={tr("Plan deadlines, set reminders, and track what is done.")} action={<Button onClick={() => setDialog({
      type: 'task-edit'
    })}><Plus size={17} />{tr("Add homework")}</Button>} /><div className="homework-metrics"><button onClick={() => setFilter('todo')}><span className="metric-icon tone-blue"><ListFilter size={23} /></span><div><strong>{tr(counts.todo)}</strong><span>{tr("On your list")}</span></div></button><button onClick={() => setFilter('week')}><span className="metric-icon tone-peach"><CalendarDays size={23} /></span><div><strong>{tr(counts.week)}</strong><span>{tr("Due in 7 days")}</span></div></button><button onClick={() => setFilter('done')}><span className="metric-icon tone-mint"><CheckCircle2 size={23} /></span><div><strong>{tr(counts.done)}</strong><span>{tr("Already done")}</span></div></button></div><div className="page-toolbar homework-toolbar"><div className="segmented-tabs">{tr([['todo', 'To do'], ['week', 'Next 7 days'], ['undated', 'Date to confirm'], ['done', 'Done'], ['all', 'All']].map(([key, label]) => <button aria-pressed={filter === key} className={filter === key ? 'active' : ''} key={key} onClick={() => setFilter(key)}>{tr(label)}{tr(counts[key] !== undefined && <span>{tr(counts[key])}</span>)}</button>))}</div><div className="toolbar-selects"><select aria-label={tr("Filter by subject")} value={subject} onChange={e => setSubject(e.target.value)}><option value="all">{tr("All subjects")}</option>{tr(SUBJECT_ORDER.map(id => <option key={id} value={id}>{tr(COURSES[id].name)}</option>))}</select><select aria-label={tr("Sort homework")} value={sort} onChange={e => setSort(e.target.value)}><option value="date">{tr("Due date")}</option><option value="priority">{tr("Priority")}</option><option value="subject">{tr("Subject")}</option></select></div></div><label className="search-input homework-search"><Search size={18} /><input placeholder={tr("Find a task or a note…")} aria-label={tr("Search homework")} value={search} onChange={e => setSearch(e.target.value)} />{tr(search && <button aria-label={tr("Clear homework search")} onClick={() => setSearch('')}><X size={16} /></button>)}</label><div className="task-list-card homework-list">{tr(visible.map(t => <TaskRow task={t} key={t.id} />))}{tr(!visible.length && <Empty title={tr(filter === 'done' ? 'Your first little win is waiting' : 'A little breathing room')} icon={CheckCircle2} action={<Button variant="secondary" onClick={() => setDialog({
        type: 'task-edit'
      })}><Plus size={16} />{tr("Add a task")}</Button>}>{tr(search ? 'No tasks match your search.' : filter === 'done' ? 'Check off a task when you finish it.' : 'There are no tasks in this view.')}</Empty>)}</div><div className="homework-bottom"><section className="reminder-explainer"><span className="tone-blue color-icon"><Bell size={24} /></span><div><h3>{tr("Reminders that fit your schedule.")}</h3><p>{tr("Choose a reminder inside any task. Export your calendar for alerts when this page is closed.")}</p></div><Button variant="secondary" onClick={() => exportCalendar()}><Download size={16} />{tr("Export calendar")}</Button></section><SourceNote /></div></>;
}
export function Planner() {
  const tr = useT();
  const {
    homework,
    now,
    route,
    setDialog,
    exportCalendar
  } = useApp();
  const today = dayKey(new Date(now));
  const [selected, setSelected] = useState(route.query.get('day') || today),
    [month, setMonth] = useState(() => {
      const d = localDayDate(route.query.get('day') || today);
      return {
        year: d.getFullYear(),
        month: d.getMonth()
      };
    }),
    [showDone, setShowDone] = useState(false),
    [view, setView] = useState('month');
  const tasks = homework.filter(t => t.due && (showDone || !t.done));
  const markers = tasks.reduce((all, t) => {
    (all[taskDay(t)] ??= []).push(t);
    return all;
  }, {});
  const dayTasks = sortHomework(markers[selected] || []);
  function reset() {
    setSelected(today);
    const d = localDayDate(today);
    setMonth({
      year: d.getFullYear(),
      month: d.getMonth()
    });
  }
  return <><PageHeading eyebrow={tr("MAKE SPACE FOR WHAT MATTERS.")} title={tr("Make space for your week.")} description={tr("Homework, assessments, revision sessions, and personal plans in one calendar.")} action={<Button onClick={() => setDialog({
      type: 'task-edit',
      date: selected
    })}><Plus size={17} />{tr("Plan an event")}</Button>} /><div className={plannerStyles.plannerTabs}><div className="segmented-tabs">{tr(['month', 'week'].map(v => <button key={v} aria-pressed={view === v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>{tr(v === 'month' ? 'Month view' : 'Week view')}</button>))}</div><div className={plannerStyles.typeLegend}>{tr(['Homework', 'Assessments', 'Revision', 'Personal plans'].map(kind => <span key={kind}><i />{tr(kind)}</span>))}</div></div>{tr(view === 'week' && <><div className="planner-controls"><label className="checkbox-label"><input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} />{tr("Show completed")}</label><button className="text-link" onClick={reset}>{tr("Back to today")}</button></div><WeekPlanner selected={selected} today={today} markers={markers} onSelect={setSelected} /></>)}{tr(view === 'month' && <div className="planner-layout"><section className="panel planner-calendar"><div className="planner-controls"><label className="checkbox-label"><input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} />{tr("Show completed")}</label><button className="text-link" onClick={reset}>{tr("Back to today")}</button></div><MiniCalendar large selected={selected} onSelect={setSelected} month={month} onMonth={setMonth} markers={markers} /><div className="planner-legend"><span><i className="tone-violet" />{tr("Subjects have their own colour")}</span><span>{tr("All dates: Europe/Berlin")}</span></div></section><section className="planner-day"><div className="planner-day-heading"><span className="planner-day-number">{tr(localDayDate(selected).getDate())}</span><div><span>{tr(new Intl.DateTimeFormat('en-GB', {
                month: 'long',
                year: 'numeric'
              }).format(localDayDate(selected)))}</span><h2>{tr(new Intl.DateTimeFormat('en-GB', {
                weekday: 'long'
              }).format(localDayDate(selected)))}</h2></div><button className="icon-button" aria-label={tr("Add a task on selected date")} onClick={() => setDialog({
            type: 'task-edit',
            date: selected
          })}><Plus size={21} /></button></div><div className="planner-events">{tr(dayTasks.length ? dayTasks.map(task => <button className={`planner-event tone-${SUBJECT_META[task.course].color} ${task.done ? 'completed-event' : ''}`} onClick={() => setDialog({
            type: 'task-detail',
            id: task.id
          })} key={task.id}><span>{tr(task.allDay ? 'Date only' : berlinTime(task.due))}{tr(task.done && <Check size={14} />)}</span><h3>{tr(task.title)}</h3><p>{tr(COURSES[task.course].name)}<ArrowUpRight size={16} /></p></button>) : <div className="planner-free"><Blue interactive className="planner-blue" /><h3>{tr("A clear day.")}</h3><p>{tr("No events saved for this day.")}</p><button className="text-link" onClick={() => setDialog({
              type: 'task-edit',
              date: selected
            })}><Plus size={15} />{tr("Add an event")}</button></div>)}</div><Button variant="secondary" className="full" onClick={() => exportCalendar()}><Download size={16} />{tr("Take dates to your calendar")}</Button></section></div>)}<section className="unscheduled-section"><SectionHeader title={tr("Unscheduled tasks")} description={tr("These tasks need a deadline confirmed in class.")} /><div className="task-list-card">{tr(homework.filter(t => !t.done && !t.due).map(t => <TaskRow key={t.id} task={t} />))}</div></section><SourceNote /></>;
}
export function Library() {
  const tr = useT();
  const {
    bookmarks
  } = useApp();
  const [subject, setSubject] = useState('all'),
    [search, setSearch] = useState(''),
    [savedOnly, setSavedOnly] = useState(false);
  const resources = RESOURCES.filter(r => (subject === 'all' || r.subject === subject) && (!savedOnly || bookmarks.includes(r.id)) && `${r.title} ${r.type} ${COURSES[r.subject].name}`.toLowerCase().includes(search.toLowerCase()));
  return <><PageHeading eyebrow={tr("GOOD IDEAS, WITHIN REACH.")} title={tr("Your resource shelf.")} description={tr("Worksheets, lesson materials, and revision guides from your classes.")} /><div className="library-banner"><span className="tone-butter color-icon"><BookOpen size={27} /></span><div><h3>{tr("The right material. Right when you need it.")}</h3><p>{tr("Save useful links with the bookmark icon. Your school login stays in Schoolbox.")}</p></div><span className="library-count">{tr(RESOURCES.length)}<small>{tr("resources")}</small></span></div><div className="page-toolbar"><div className="segmented-tabs"><button className={!savedOnly ? 'active' : ''} aria-pressed={!savedOnly} onClick={() => setSavedOnly(false)}>{tr("All resources")}</button><button className={savedOnly ? 'active' : ''} aria-pressed={savedOnly} onClick={() => setSavedOnly(true)}><Bookmark size={15} />{tr("Saved")}<span>{tr(bookmarks.length)}</span></button></div><select value={subject} onChange={e => setSubject(e.target.value)} aria-label={tr("Resource subject")}><option value="all">{tr("All subjects")}</option>{tr(SUBJECT_ORDER.map(id => <option value={id} key={id}>{tr(COURSES[id].name)}</option>))}</select></div><label className="search-input library-search"><Search size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder={tr("Search a worksheet, topic, or subject…")} aria-label={tr("Search resources")} />{tr(search && <button onClick={() => setSearch('')} aria-label={tr("Clear resource search")}><X size={16} /></button>)}</label><div className="resource-list">{tr(resources.map(r => <ResourceRow resource={r} key={r.id} />))}{tr(!resources.length && <Empty title={tr(savedOnly ? 'A shelf of your favourites' : 'No matches this time')} icon={Bookmark}>{tr(savedOnly ? 'Tap the bookmark on a resource to save it here.' : 'Try a different topic or subject.')}</Empty>)}</div><StudySets /><SourceNote /></>;
}
export function Practice(){return <PracticeLibrary/>;}
export function SourceNote() {
  const tr = useT();
  return <div className="source-note"><School size={18} /><p>{tr("ISR Schoolbox snapshot · checked 19 September 2026.")}<br />{tr("Local edits stay on this device. ")}<External href={SCHOOL.url}>{tr("Check Schoolbox for changes")}</External></p></div>;
}
