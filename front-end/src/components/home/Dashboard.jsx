import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, ArrowRight, CalendarDays, CheckCircle2, Clock3, Rss, Target } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { useAuth, api } from '../../auth.jsx';
import { useT } from '../../i18n.jsx';
import { COURSES, dayKey } from '../../study.js';
import { sortHomework, dueLabel, dueTimestamp } from '../../homework.js';
import { revisionQueue } from '../../revision.js';
import { SCHOOL_NEWS } from '../../schoolExtras.js';
import { SCHOOL_EVENTS } from '../../schoolCalendar.js';
import { External, Modal } from '../UI.jsx';
import { StudyRhythm } from './StudyRhythm.jsx';
import TodayEssentials from '../essentials/TodayEssentials.jsx';
import DailySpark from './DailySpark.jsx';
import {TodayClasses,UpcomingExams} from '../school/SchoolConnection.jsx';
import base from './Home.module.css';
import s from './Today.module.css';

export default function Dashboard() {
  const tr = useT(), { user } = useAuth();
  const { homework, navigate, setDialog, revisionSchedule, now } = useApp();
  const [feed, setFeed] = useState(null), [feedError, setFeedError] = useState(false), [spark, setSpark] = useState(false);
  const today = dayKey(new Date(now));
  const pending = useMemo(() => sortHomework(homework.filter(task => !task.done && (task.kind !== 'Assessment' || task.id.startsWith('local-') && dueTimestamp(task)>=now))), [homework,now]);
  const due = useMemo(() => revisionQueue(revisionSchedule, { now }).length, [revisionSchedule, now]);
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
    <TodayClasses/>
    <div className={s.deskLayout}>
      <section className={s.newsColumn} aria-labelledby="school-briefing-title">
        <header className={s.columnHeading}><h2 id="school-briefing-title"><Rss size={17}/>{tr('School news')}</h2><button onClick={() => navigate('school?tab=news')} aria-label={tr('All updates')}><ArrowUpRight size={17}/></button></header>
        <p className={s.feedStatus}><span data-live={feedHealthy}/>{tr(feed?.connected ? 'Schoolbox feed · checked every minute' : 'Schoolbox snapshot · 19 September 2026')}{feedError && ' · ' + tr('Live connection unavailable')}{feed?.error && ' · ' + tr('Feed needs attention')}</p>
        {news.map((item,index)=><article className={s.newsLine} key={item.id}><span className={s.newsIndex}>{String(index+1).padStart(2,'0')}</span><div><small>{item.tag || 'ISR Schoolbox'} · {(item.date || item.publishedAt || '').slice(0,10)}</small><h3><External href={item.url}>{item.title}</External></h3><p>{item.excerpt || item.description}</p></div></article>)}
        {!news.length && <p className={base.empty}>{tr('No posts in your connected feed yet.')}</p>}
        <button className={s.columnLink} onClick={()=>navigate('headlines')}>{tr('World news')}<ArrowRight size={14}/></button>
      </section>
      <section id="today-radar" className={s.radarColumn} aria-labelledby="today-radar-title">
        <header className={s.columnHeading}><h2 id="today-radar-title"><Target size={17}/>{tr('On your radar')} <small>{pending.length}</small></h2><button onClick={()=>navigate('planner')} aria-label={tr('Open planner')}><ArrowUpRight size={17}/></button></header>
        <div className={base.deadlineList}>{pending.slice(0,3).map((task,index)=><button key={task.id} onClick={()=>setDialog({type:'task-detail',id:task.id})}><span className={s.radarMark} data-overdue={dueTimestamp(task)<now}>{String(index+1).padStart(2,'0')}</span><span><small>{tr(COURSES[task.course]?.name || 'Personal task')}</small><strong>{task.title}</strong><em data-overdue={dueTimestamp(task)<now}><Clock3 size={11}/>{dueTimestamp(task)<now&&<>{tr('Overdue')} · </>}{task.due?dueLabel(task.due,new Date(now),task.allDay):tr('No date set')}</em></span></button>)}{!pending.length&&<p className={base.empty}><CheckCircle2 size={26}/>{tr('You are all caught up.')}</p>}</div>
        <button className={s.columnLink} onClick={()=>navigate('homework')}>{tr('All homework')}<ArrowRight size={14}/></button>
      </section>
      <section className={s.calendarColumn}><UpcomingExams limit={2}/></section>
    </div>
    <TodayEssentials/><StudyRhythm/>
    {spark&&<Modal title={tr('Daily spark')} onClose={()=>setSpark(false)} size="small"><DailySpark day={today}/></Modal>}
  </div>;
}
