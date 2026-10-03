import {normalizeBuddy} from '../../buddies.js';
import { useT } from "../../i18n.jsx";
import React, { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Plus, Sparkles, ArrowUpRight, Headphones, CalendarDays, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { COURSES, SUBJECT_ORDER } from '../../study.js';
import { sortHomework } from '../../homework.js';
import { SCHOOL_NEWS } from '../../schoolExtras.js';
import { Blue, SubjectIcon, TaskRow, Button } from '../UI.jsx';
import { MainTree } from './MainTree.jsx';
import { GlowCard } from './GlowCard.jsx';
import { NeonSkeleton } from './NeonSkeleton.jsx';
import styles from './Aurora.module.css';
const StatTracker = lazy(() => import('./StatTracker.jsx'));
const EMPTY_PATH = Object.freeze([]);
export function NeonOverview() {
  const tr = useT();
  const {
    prefs,
    setPrefs,
    progress,
    setProgress,
    homework,
    now,
    navigate,
    openLesson,
    setDialog,
    playSound
  } = useApp();
  const [subject, setSubject] = useState(() => COURSES[progress.course]?.questions.length ? progress.course : 'music');
  const [greet, setGreet] = useState(false),
    course = COURSES[subject];
  const pending = useMemo(() => sortHomework(homework.filter(t => !t.done)).slice(0, 2), [homework]);
  const start = useCallback(index => openLesson(subject, index), [subject, openLesson]);
  const resources = useCallback(() => navigate(`subjects/${subject}`), [subject, navigate]);
  const onSubject = useCallback(id => {
    setSubject(id);
    setProgress(p => ({
      ...p,
      course: id
    }));
  }, [setProgress]);
  const onPractice = useCallback(() => navigate('practice'), [navigate]);
  const completed = progress.paths?.[subject] || EMPTY_PATH;
  return <div className={styles.world}>
    <header className={styles.worldHeading}><div><span className={styles.kicker}><i />{tr(" YOUR WORKSPACE. YOUR PACE.")}</span><h1>{tr("Make progress, ")}<em>{tr("your way.")}</em></h1><p>{tr("Welcome back, ")}{tr(prefs.name)}{tr(". Here's where your next step starts.")}</p></div><button className={styles.soundButton} onClick={() => setPrefs(p => ({
        ...p,
        sound: !p.sound
      }))} aria-label={tr(prefs.sound ? 'Mute study sounds' : 'Enable study sounds')} aria-pressed={prefs.sound}>{tr(prefs.sound ? <Volume2 size={19} /> : <VolumeX size={19} />)}</button></header>
    <section className={styles.cosmicHero} aria-label={tr("Welcome to your learning universe")}><div className={styles.heroAurora} /><div className={styles.heroText}><span className={styles.heroPill}><Sparkles size={13} />{tr(" ISR SCHOOL · GRADE 8 · TERM 1")}</span><h2>{tr("Focused today.")}<br /><em>{tr("Stronger tomorrow.")}</em></h2><p>{tr("Your coursework, revision, and deadlines.")}<br className={styles.desktopBreak} />{tr(" One space to stay on top of it all.")}</p><button className={styles.heroCta} onClick={() => start(Math.max(0, [0, 1, 2, 3, 4].find(i => !completed.includes(i)) ?? 4))}>{tr("Continue your path ")}<ArrowRight size={17} /></button><span className={styles.heroMicro}><span />{tr(" Short sessions. Lasting progress.")}</span></div><div className={styles.heroArt}><span className={styles.heroHalo} /><span className={styles.satelliteOne}><StarShape /></span><span className={styles.satelliteTwo}>{tr("✦")}</span><Blue interactive className={styles.cosmicBlue} onGreet={() => {
          setGreet(v => !v);
          playSound('correct');
        }} />{tr(greet ? <span className={styles.dinoSpeech} role="status">{tr("Ready when you are. Let's get started.")}</span> : <span className={styles.dinoTag}><span />{normalizeBuddy(prefs.buddy).name.toUpperCase()} · {tr("STUDY COMPANION")}</span>)}</div><span className={styles.heroEdgeLabel}>{tr("FOCUS. REVIEW. PROGRESS.")}</span></section>
    <div className={styles.subjectBar}><div><span className={styles.kicker}>{tr("YOUR SUBJECT")}</span><label className={styles.subjectSelect}><SubjectIcon id={subject} size={19} /><select aria-label={tr("Choose your subject")} value={subject} onChange={e => onSubject(e.target.value)}>{tr(SUBJECT_ORDER.filter(id => COURSES[id].questions.length).map(id => <option key={id} value={id}>{tr(COURSES[id].name)}</option>))}</select><ChevronDown size={15} /></label></div><button className={styles.allSubjects} onClick={() => navigate('subjects')}>{tr("All 13 subjects ")}<ArrowUpRight size={16} /></button><span className={styles.unitTag}>{tr("GRADE 8 ")}<i />{tr(" TERM 1")}</span></div>
    <div className={styles.worldGrid}><div className={styles.mainColumn}><MainTree course={course} completed={completed} onStart={start} onResources={resources} /><section className={styles.radar}><div className={styles.sectionTitle}><div><span className={styles.kicker}>{tr("UPCOMING WORK")}</span><h2>{tr("Deadlines to track.")}</h2></div><button onClick={() => setDialog({
              type: 'task-edit'
            })} aria-label={tr("Add homework")}><Plus size={20} /></button></div><GlowCard color="cyan" className={styles.radarTasks}>{tr(pending.map(t => <TaskRow task={t} key={t.id} compact />))}{tr(pending.length === 0 && <p className={styles.clearList}><CheckCircle2 size={21} />{tr("No outstanding tasks.")}</p>)}<button className={styles.radarLink} onClick={() => navigate('homework')}>{tr("View all homework ")}<ArrowRight size={15} /></button></GlowCard></section><div className={styles.bottomCards}><a className={styles.newsTile} href={SCHOOL_NEWS[0].url} target="_blank" rel="noreferrer"><CalendarDays size={20} /><span>{tr("FROM YOUR CLASSROOM")}</span><h3>{tr(SCHOOL_NEWS[0].title)}</h3><small>{tr("Read the Schoolbox notice ")}<ArrowUpRight size={14} /></small></a><button className={styles.focusTile} onClick={() => navigate('focus')}><Headphones size={24} /><span>{tr("FIND YOUR FLOW")}</span><h3>{tr("Less distraction.")}<br />{tr("More focus.")}</h3><small>{tr("Enter focus room ")}<ArrowUpRight size={14} /></small></button></div></div><Suspense fallback={<NeonSkeleton />}><StatTracker progress={progress} now={now} onSubject={onSubject} onPractice={onPractice} /></Suspense></div>
    <p className={styles.sourceCaption}>{tr("Built around your ISR classes. Schoolbox snapshot checked 19 September 2026. ")}<a href="https://lms.isr-school.com/news" target="_blank" rel="noreferrer">{tr("Check for updates ")}<ArrowUpRight size={12} /></a></p>
  </div>;
}
function StarShape() {
  const tr = useT();
  return <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m16 1 4.1 10.9L31 16l-10.9 4.1L16 31l-4.1-10.9L1 16l10.9-4.1z" fill="currentColor" /><path d="m16 7 2.5 6.5L25 16l-6.5 2.5L16 25l-2.5-6.5L7 16l6.5-2.5z" fill="white" opacity=".45" /></svg>;
}
