import TodayEssentials from '../essentials/TodayEssentials.jsx';
import RevisionHomeCard from '../revision/RevisionHomeCard.jsx';
import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowRight, Play, Pause, Square, Clock3, CalendarDays, Coins, Rss, CheckCircle2, BookOpen, Sparkles, GraduationCap } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { useAuth, api } from '../../auth.jsx';
import { useT } from '../../i18n.jsx';
import { StudyRhythm } from './StudyRhythm.jsx';
import { COURSES, dayKey } from '../../study.js';
import { sortHomework, dueLabel, dueTimestamp } from '../../homework.js';
import { SCHOOL_NEWS } from '../../schoolExtras.js';
import { SCHOOL_EVENTS } from '../../schoolCalendar.js';
import { normalizeBuddy } from '../../buddies.js';
import { BuddyAvatar } from '../buddy/BuddyAvatar.jsx';
import { Button, External } from '../UI.jsx';
import s from './Home.module.css';
export default function Dashboard() {
  const tr = useT(),
    {
      user
    } = useAuth();
  const {
    prefs,
    setPrefs,
    homework,
    navigate,
    setDialog,
    coins,
    progress,
    recordFocus
  } = useApp();
  const [tick, setTick] = useState(Date.now()),
    [feed, setFeed] = useState(null),
    [feedError, setFeedError] = useState(false);
  const watch = prefs.stopwatch || {
      elapsed: 0,
      startedAt: null,
      task: ''
    },
    running = Number.isFinite(watch.startedAt),
    elapsed = Math.max(0, Number(watch.elapsed) || 0) + (running ? Math.max(0, tick - watch.startedAt) : 0);
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), running ? 1000 : 30000);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    if (!user) return;
    let live = true;
    const controller = new AbortController();
    const load = () => api('/school-news', 'GET', undefined, controller.signal).then(v => {
      if (live) {
        setFeed(v);
        setFeedError(false);
      }
    }).catch(() => {
      if (live) setFeedError(true);
    });
    load();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 15000);
    return () => {
      live = false;
      controller.abort();
      clearInterval(t);
    };
  }, [user]);
  const seconds = Math.floor(elapsed / 1000),
    pending = sortHomework(homework.filter(t => !t.done)),
    buddy = normalizeBuddy(prefs.buddy),
    events = SCHOOL_EVENTS.filter(e => e.date >= dayKey()).slice(0, 2);
  const news = feed?.connected ? feed.items.slice(0, 3) : [...SCHOOL_NEWS].sort((a, b) => b.date.localeCompare(a.date));
  function toggle() {
    setTick(Date.now());
    setPrefs(p => {
      const w = p.stopwatch || {
        elapsed: 0,
        startedAt: null,
        task: ''
      };
      return {
        ...p,
        stopwatch: {
          ...w,
          elapsed: Math.max(0, Number(w.elapsed) || 0) + (Number.isFinite(w.startedAt) ? Math.max(0, Date.now() - w.startedAt) : 0),
          startedAt: Number.isFinite(w.startedAt) ? null : Date.now()
        }
      };
    });
  }
  function finish() {
    if (elapsed < 1000) return;
    recordFocus(elapsed, watch.task);
    setPrefs(p => ({
      ...p,
      stopwatch: {
        elapsed: 0,
        startedAt: null,
        task: p.stopwatch?.task || ''
      }
    }));
  }
  return <div className={s.dashboard}><header className={s.welcome}><div><span className={s.dateStamp}><CalendarDays size={14} aria-hidden="true" />{new Date(tick).toLocaleDateString(tr.locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}</span><h1>{tr('A little focus.')}{' '}<span>{tr('A lot of possibility.')}</span></h1><p>{tr('Welcome back')}, {user?.name || prefs.name}. {tr('Here is your day, all in one place.')}</p></div><button className={s.wallet} onClick={() => navigate('buddy')}><span className={s.walletIcon}><Coins size={22} aria-hidden="true" /></span><span><strong>{coins.toLocaleString(tr.locale)}</strong><small>{tr('Learning coins')}</small></span><ArrowUpRight size={17} /></button></header>
 <div className={s.topGrid}><section className={s.timerCard} data-running={running} aria-labelledby="today-focus-heading"><div className={s.cardHeading}><h2 id="today-focus-heading"><span className={s.liveDot} />{tr(running ? 'IN THE FLOW' : 'YOUR FOCUS SPACE')}</h2><span><Clock3 size={15} /> {tr('Open stopwatch')}</span></div><label className={s.taskLabel} htmlFor="today-focus">{tr('One thing to work on')}</label><input id="today-focus" className={s.taskInput} value={watch.task || ''} maxLength={150} onChange={e => setPrefs(p => ({
          ...p,
          stopwatch: {
            ...p.stopwatch,
            task: e.target.value
          }
        }))} placeholder={tr('What would you like to make progress on?')} /><div className={s.digits} data-hours={seconds >= 3600} role="timer" aria-label={Math.floor(seconds / 60) + ' minutes ' + seconds % 60 + ' seconds'}>{seconds >= 3600 && <>{String(Math.floor(seconds / 3600)).padStart(2, '0')}<span>:</span></>}{String(Math.floor(seconds / 60) % 60).padStart(2, '0')}<span>:</span>{String(seconds % 60).padStart(2, '0')}</div><p className={s.timerCaption}>{tr('No countdown. No rush. Just you and your next idea.')}</p><div className={s.timerActions}><button onClick={toggle}>{running ? <Pause size={18} /> : <Play size={18} />} {tr(running ? 'Pause' : elapsed ? 'Resume' : 'Start focusing')}</button><button className={s.finish} disabled={elapsed < 1000} onClick={finish}><Square size={16} /> {tr('Finish & save')}</button></div><div className={s.timerBottom}><span>{tr('Continues across pages and refreshes')}</span><button onClick={() => navigate('focus')}>{tr('Prefer a countdown?')} <ArrowUpRight size={13} /></button></div></section>
 <section className={s.deadlines}><div className={s.sectionHead}><h2><span className={s.headingIcon} data-tone="amber"><CalendarDays size={18} /></span>{tr('Next up')}<span className={s.count}>{pending.length}</span></h2><button onClick={() => navigate('planner')} aria-label={tr('Open planner')}><ArrowUpRight size={20} /></button></div><p className={s.subtle}>{pending.length} {tr('open tasks. One step at a time.')}</p><div className={s.deadlineList}>{pending.slice(0, 3).map((t, i) => <button key={t.id} onClick={() => setDialog({
            type: 'task-detail',
            id: t.id
          })}><span className={s.taskNumber}>{String(i + 1).padStart(2, '0')}</span><span><small>{tr(COURSES[t.course]?.name || 'Personal task')}</small><strong>{t.title}</strong><em data-overdue={dueTimestamp(t) < tick}><Clock3 size={11} aria-hidden="true" />{dueTimestamp(t) < tick && <>{tr('Overdue')} · </>}{t.due ? dueLabel(t.due, new Date(tick), t.allDay) : tr('No date set')}</em></span><ArrowUpRight size={15} /></button>)}{!pending.length && <p className={s.empty}><CheckCircle2 size={26} />{tr('You are all caught up.')}</p>}</div><Button variant="secondary" onClick={() => navigate('homework')}>{tr('All homework')}<ArrowRight size={16} /></Button></section></div>

 <div className={s.bottomGrid}><section className={s.news}><div className={s.sectionHead}><div><span className={s.eyebrow}>{tr('THE DAILY BRIEFING')}</span><h2>{tr('Around your school')}</h2></div><button onClick={() => navigate('school?tab=news')}>{tr('All updates')} <ArrowUpRight size={15} /></button></div><p className={s.sourceStatus}><span data-live={Boolean(feed?.connected && !feedError && !feed?.error)} />{tr(feed?.connected ? 'Schoolbox feed · checked every minute' : 'Schoolbox snapshot · 19 September 2026')}{feedError && ' · ' + tr('Live connection unavailable')}{feed?.error && ' · ' + tr('Feed needs attention')}</p>{news.map((n, i) => <article key={n.id} className={s.newsItem}><span className={s.newsIcon} data-tone={['blue', 'violet', 'green'][i % 3]}>{i === 0 ? <Rss size={21} /> : i === 1 ? <BookOpen size={21} /> : <Sparkles size={21} />}</span><div><small>{n.tag || 'ISR Schoolbox'} · {(n.date || n.publishedAt || '').slice(0, 10)}</small><h3><External href={n.url}>{n.title}</External></h3><p>{n.excerpt || n.description}</p></div></article>)}{!news.length && <p>{tr('No posts in your connected feed yet.')}</p>}<div className={s.newsFoot}><span>{tr(feed?.connected ? 'Your private school feed' : 'Connect your private feed for new posts automatically.')}</span><button onClick={() => navigate('headlines')}>{tr('World news')} <ArrowRight size={14} /></button></div></section>
 <div className={s.rightStack}><section className={s.schedule}><div className={s.sectionHead}><h2><span className={s.headingIcon} data-tone="green"><CalendarDays size={18} /></span>{tr('Your school day')}</h2></div><p>{tr('Check today’s lessons and rooms in Veracross. A timetable feed is not connected yet.')}</p><External href={'https://portals.veracross.com/isrschool/student/student/daily-schedule?date=' + dayKey()}>{tr('Open today’s schedule')}</External>{events.map(e => <div className={s.event} key={e.id}><time dateTime={e.date}>{e.date.slice(8)}<small>{new Date(e.date + 'T12:00:00').toLocaleDateString(tr.locale, {
                  month: 'short'
                })}</small></time><span><strong>{tr(e.title)}</strong><small>{tr(e.time)}</small></span></div>)}<small className={s.subtle}>{tr('Calendar snapshot · checked 20 September 2026')}</small></section>
 <button className={s.buddyCard} onClick={() => navigate('buddy')}><div><span className={s.eyebrow}>{tr('YOUR STUDY COMPANION')}</span><h2>{buddy.adopted ? buddy.name : tr('Meet your buddy.')}</h2><p>{tr(buddy.adopted ? 'A little reward for your hard work.' : 'Ten personalities. One companion for your journey.')}</p><span>{tr(buddy.adopted ? 'Visit & customise' : 'Choose your companion')} <ArrowRight size={15} /></span></div><BuddyAvatar {...buddy} /></button></div></div>
 <nav className={s.quickLinks} aria-label={tr("Learn")}>{[['subjects', 'Pick up where you left off', 'Your subjects', BookOpen], ['curriculum', 'Build a deeper understanding', 'IGCSE & IB', GraduationCap], ['exams', 'Turn preparation into confidence', 'Mock exams', Sparkles]].map(([path, caption, title, Icon]) => <button key={path} onClick={() => navigate(path)}><span className={s.shortcutIcon} data-tone={path === 'subjects' ? 'blue' : path === 'curriculum' ? 'violet' : 'green'}><Icon size={22} /></span><span><strong>{tr(title)}</strong><small>{tr(caption)}</small></span><ArrowUpRight size={18} /></button>)}</nav>
 <TodayEssentials /><RevisionHomeCard className={s.revisionPanel} /><StudyRhythm /><div className={s.progressStrip}><span><strong>{progress.sessions}</strong>{tr('Reviews completed')}</span><span><strong>{progress.focusMinutes}</strong>{tr('Focus minutes')}</span><span><strong>+2</strong>{tr('Coins per correct answer')}</span><span><strong>+50</strong>{tr('Coins per exam above 90%')}</span></div></div>;
}
