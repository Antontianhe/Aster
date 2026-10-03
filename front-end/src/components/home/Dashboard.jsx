import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock3, Coins, Compass, GraduationCap, Layers3, Orbit, Rss, Sparkles, Target } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { useAuth, api } from '../../auth.jsx';
import { useT } from '../../i18n.jsx';
import { COURSES, dayKey } from '../../study.js';
import { sortHomework, dueLabel, dueTimestamp } from '../../homework.js';
import { revisionQueue } from '../../revision.js';
import { SCHOOL_NEWS } from '../../schoolExtras.js';
import { SCHOOL_EVENTS } from '../../schoolCalendar.js';
import { normalizeBuddy } from '../../buddies.js';
import { BuddyAvatar } from '../buddy/BuddyAvatar.jsx';
import { External } from '../UI.jsx';
import { StudyRhythm } from './StudyRhythm.jsx';
import TodayEssentials from '../essentials/TodayEssentials.jsx';
import DailySpark from './DailySpark.jsx';
import base from './Home.module.css';
import s from './Today.module.css';

const INTENTS = [['plan', 'Make a plan', CalendarDays], ['review', 'Reconnect', Layers3], ['explore', 'Get curious', Compass]];

function NextMove({ pending, due, buddy }) {
  const tr = useT();
  const { navigate, setDialog } = useApp();
  const [intent, setIntent] = useState('plan');
  const first = pending[0];
  const moves = {
    plan: { kicker: 'A LITTLE DIRECTION', title: first ? 'Big things start with one small step.' : 'A clear day. An open possibility.', detail: first ? 'Start with the next thing on your radar. The rest can wait a moment.' : 'Choose a subject, follow an idea, and see where it takes you.', action: first ? 'Open this task' : 'Explore your subjects', run: () => first ? setDialog({ type: 'task-detail', id: first.id }) : navigate('subjects') },
    review: { kicker: 'CONNECT THE DOTS', title: 'Some ideas deserve a second hello.', detail: due ? 'Your review queue is ready. Revisit an idea and make it stick.' : 'A little retrieval goes a long way. See what you remember from your subjects.', action: due ? 'Open review queue' : 'Try a quick review', run: () => navigate(due ? 'revision?tab=review' : 'practice') },
    explore: { kicker: 'TAKE THE SCENIC ROUTE', title: 'Your next favourite idea is out there.', detail: 'Step outside the syllabus for a moment. Find a story, a new perspective, or a question worth chasing.', action: 'Find your next read', run: () => navigate('books') },
  };
  const move = moves[intent];
  return <section className={s.spotlight} data-intent={intent} aria-labelledby="next-move-heading">
    <div className={s.intentPicker} role="group" aria-label={tr('Choose your direction')}>
      {INTENTS.map(([id, label, Icon]) => <button key={id} aria-pressed={intent === id} onClick={() => setIntent(id)}><Icon size={14}/>{tr(label)}</button>)}
    </div>
    <div className={s.spotlightBody}>
      <div className={s.spotlightCopy} key={intent}>
        <span className={s.heroKicker}>{tr(move.kicker)}</span>
        <h2 id="next-move-heading">{tr(move.title)}</h2>
        <p>{tr(move.detail)}</p>
        {intent === 'plan' && first && <div className={s.nextTask}><span>{tr(COURSES[first.course]?.name || 'Personal task')}</span><strong>{first.title}</strong></div>}
        {intent === 'review' && <div className={s.nextTask}><span>{tr('Ready to revisit')}</span><strong>{due} {tr('questions in your queue')}</strong></div>}
        {intent === 'explore' && <div className={s.nextTask}><span>{tr('A DIFFERENT KIND OF ADVENTURE')}</span><strong>{tr('One page can change your perspective.')}</strong></div>}
        <button className={s.heroAction} onClick={move.run}>{tr(move.action)}<ArrowUpRight size={18}/></button>
      </div>
      <div className={s.heroArt}>
        <div className={s.orbitRing} aria-hidden="true"/><div className={s.orbitRingInner} aria-hidden="true"/>
        <span className={s.starOne} aria-hidden="true">✦</span><span className={s.starTwo} aria-hidden="true">✧</span>
        <span className={s.artLabel}>{tr('A WORLD OF POSSIBILITIES')}</span>
        <button className={s.buddyPlanet} onClick={() => navigate('buddy')} aria-label={tr('Visit your buddy')}><BuddyAvatar {...buddy}/></button>
        <span className={s.orbitNote}><Sparkles size={13}/>{tr('Stay curious.')}</span>
        <span className={s.orbitSymbol} aria-hidden="true">a² + b²</span>
        <span className={s.orbitBook} aria-hidden="true"><BookOpen size={23}/></span>
      </div>
    </div>
    <div className={s.spotlightFoot}><span><Orbit size={14}/>{tr('Your pace. Your next chapter.')}</span><a href="#/focus">{tr('Focus room')}<ArrowUpRight size={13}/></a></div>
  </section>;
}

export default function Dashboard() {
  const tr = useT(), { user } = useAuth();
  const { prefs, homework, navigate, setDialog, coins, revisionSchedule, now, progress } = useApp();
  const [feed, setFeed] = useState(null), [feedError, setFeedError] = useState(false);
  const today = dayKey(new Date(now));
  const pending = useMemo(() => sortHomework(homework.filter(task => !task.done)), [homework]);
  const due = useMemo(() => revisionQueue(revisionSchedule, { now }).length, [revisionSchedule, now]);
  const buddy = normalizeBuddy(prefs.buddy);
  const events = SCHOOL_EVENTS.filter(event => event.date >= today).slice(0, 2);
  const news = feed?.connected ? feed.items.slice(0, 3) : [...SCHOOL_NEWS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const feedHealthy = Boolean(feed?.connected && !feedError && !feed?.error);

  useEffect(() => {
    if (!user) return;
    let live = true;
    const controller = new AbortController();
    const load = () => api('/school-news', 'GET', undefined, controller.signal)
      .then(value => { if (live) { setFeed(value); setFeedError(false); } })
      .catch(() => { if (live) setFeedError(true); });
    load();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 15000);
    return () => { live = false; controller.abort(); clearInterval(timer); };
  }, [user]);

  return <div className={`${base.dashboard} ${s.page}`}>
    <header className={s.masthead}>
      <div className={s.edition}><span><span aria-hidden="true">✳</span>{tr('THE DAILY EDIT')}</span><time dateTime={today}>{new Date(now).toLocaleDateString(tr.locale, { timeZone: 'Europe/Berlin', weekday: 'long', day: 'numeric', month: 'long' })}</time></div>
      <div className={s.greeting}><div><h1>{tr('A good day to')} <em>{tr('get curious.')}</em></h1><p>{tr('Welcome back')}, {user?.name || prefs.name}. {tr('A little direction. A little discovery. All yours.')}</p></div><button className={s.coinPill} onClick={() => navigate('buddy')}><Coins size={19}/><strong>{coins.toLocaleString(tr.locale)}</strong><span>{tr('Learning coins')}</span><ArrowUpRight size={14}/></button></div>
    </header>

    <div className={s.leadGrid}><NextMove pending={pending} due={due} buddy={buddy}/><DailySpark day={today}/></div>

    <nav className={s.pulse} aria-label={tr('Your day at a glance')}>
      <span className={s.pulseLabel}><span/>{tr('YOUR DAY, AT A GLANCE')}</span>
      <button onClick={() => document.getElementById('today-radar')?.scrollIntoView({ behavior: prefs.reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })}><CalendarDays size={16}/><strong>{pending.length}</strong>{tr('open tasks')}<ArrowRight size={13}/></button>
      <button onClick={() => navigate('revision?tab=review')}><Layers3 size={16}/><strong>{due}</strong>{tr('ready to revisit')}<ArrowRight size={13}/></button>
      <button onClick={() => navigate('revision?tab=insights')}><CheckCircle2 size={16}/><strong>{progress.sessions}</strong>{tr('Reviews completed')}<ArrowRight size={13}/></button>
    </nav>

    <div className={s.briefingGrid}>
      <section className={s.briefing} aria-labelledby="school-briefing-title">
        <header className={s.sectionTitle}><div><span className={s.kicker}>{tr('BEYOND YOUR DESK')}</span><h2 id="school-briefing-title">{tr('The school edit.')}</h2></div><button onClick={() => navigate('school?tab=news')}>{tr('All updates')}<ArrowUpRight size={16}/></button></header>
        <p className={s.feedStatus}><span data-live={feedHealthy}/>{tr(feed?.connected ? 'Schoolbox feed · checked every minute' : 'Schoolbox snapshot · 19 September 2026')}{feedError && ' · ' + tr('Live connection unavailable')}{feed?.error && ' · ' + tr('Feed needs attention')}</p>
        <div className={s.stories}>{news.map((item, index) => <article className={s.story} key={item.id}>
          <span className={s.storyNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <div><div className={s.storyMeta}><span>{item.tag || 'ISR Schoolbox'}</span><time>{(item.date || item.publishedAt || '').slice(0, 10)}</time></div><h3><External href={item.url}>{item.title}</External></h3><p>{item.excerpt || item.description}</p></div>
        </article>)}</div>
        {!news.length && <p className={base.empty}>{tr('No posts in your connected feed yet.')}</p>}
        <div className={s.briefingFoot}><Rss size={15}/><span>{tr(feed?.connected ? 'Your private school feed' : 'Connect your private feed for new posts automatically.')}</span><button onClick={() => navigate('headlines')}>{tr('World news')}<ArrowRight size={14}/></button></div>
      </section>

      <div className={s.agendaStack}>
        <section id="today-radar" className={`${base.deadlines} ${s.radar}`} aria-labelledby="today-radar-title">
          <div className={base.sectionHead}><h2 id="today-radar-title"><Target size={19}/>{tr('On your radar')}<span className={base.count}>{pending.length}</span></h2><button onClick={() => navigate('planner')} aria-label={tr('Open planner')}><ArrowUpRight size={18}/></button></div>
          <div className={base.deadlineList}>{pending.slice(0, 3).map((task, index) => <button key={task.id} onClick={() => setDialog({ type: 'task-detail', id: task.id })}>
            <span className={s.radarMark} data-overdue={dueTimestamp(task) < now}>{String(index + 1).padStart(2, '0')}</span><span><small>{tr(COURSES[task.course]?.name || 'Personal task')}</small><strong>{task.title}</strong><em data-overdue={dueTimestamp(task) < now}><Clock3 size={11}/>{dueTimestamp(task) < now && <>{tr('Overdue')} · </>}{task.due ? dueLabel(task.due, new Date(now), task.allDay) : tr('No date set')}</em></span><ArrowUpRight size={15}/>
          </button>)}{!pending.length && <p className={base.empty}><CheckCircle2 size={28}/>{tr('You are all caught up.')}</p>}</div>
          <button className={s.textAction} onClick={() => navigate('homework')}>{tr('All homework')}<ArrowRight size={15}/></button>
        </section>
        <section className={`${base.schedule} ${s.schedule}`} aria-labelledby="today-school-day"><div className={base.sectionHead}><h2 id="today-school-day"><CalendarDays size={19}/>{tr('Your school day')}</h2></div><p>{tr('Check today’s lessons and rooms in Veracross. A timetable feed is not connected yet.')}</p><External href={'https://portals.veracross.com/isrschool/student/student/daily-schedule?date=' + today}>{tr('Open today’s schedule')}</External>
          {events.map(event => <div className={base.event} key={event.id}><time dateTime={event.date}>{event.date.slice(8)}<small>{new Date(event.date + 'T12:00:00').toLocaleDateString(tr.locale, { month: 'short' })}</small></time><span><strong>{tr(event.title)}</strong><small>{tr(event.time)}</small></span></div>)}<small className={base.subtle}>{tr('Calendar snapshot · checked 20 September 2026')}</small>
        </section>
      </div>
    </div>

    <section className={s.discover} aria-labelledby="today-discover-title"><header><div><span className={s.kicker}>{tr('FOLLOW A DIFFERENT THREAD')}</span><h2 id="today-discover-title">{tr('There’s more out there.')}</h2></div><span>{tr('Choose your own adventure.')}</span></header><div className={s.discoveryCards}>
      {[[BookOpen, 'subjects', '01', 'Make it click.', 'Your subjects', 'Pick up where you left off', 'blue'], [GraduationCap, 'curriculum', '02', 'See the bigger picture.', 'IGCSE & IB', 'Build a deeper understanding', 'violet'], [Sparkles, 'exams', '03', 'Meet your next challenge.', 'Mock exams', 'Turn preparation into confidence', 'green']].map(([Icon, path, number, headline, title, detail, tone]) => <button key={path} data-tone={tone} onClick={() => navigate(path)}><div><span>{number} / {tr(title)}</span><Icon size={24}/></div><h3>{tr(headline)}</h3><p>{tr(detail)}</p><span className={s.discoveryArrow}><ArrowUpRight size={20}/></span></button>)}
    </div></section>
    <TodayEssentials/><StudyRhythm/>
    <div className={s.signoff}><span aria-hidden="true">✦</span>{tr('A little curiosity looks good on you.')}<button onClick={() => navigate('buddy')}>{tr('Visit your buddy')}<ArrowUpRight size={14}/></button></div>
  </div>;
}
