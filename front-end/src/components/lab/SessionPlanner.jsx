import { useT } from "../../i18n.jsx";
import React, { useEffect, useRef, useState } from 'react';
import { Timer, ArrowRight, Check, ArrowUpRight } from 'lucide-react';
import { createStudyPlan } from '../../learning.js';
import { COURSES, SUBJECT_ORDER } from '../../study.js';
import { useApp } from '../../context.jsx';
import { Button } from '../UI.jsx';
import { SessionSaved } from './TeachAndRepair.jsx';
import s from './StudyLab.module.css';
export function SessionPlanner({
  onClose
}) {
  const tr = useT();
  const {
    setCards,
    setReview,
    setReviewQuestion,
    navigate,
    learning,
    saveLabSession
  } = useApp();
  const [minutes, setMinutes] = useState(12),
    [subject, setSubject] = useState('maths'),
    [energy, setEnergy] = useState('steady'),
    [plan, setPlan] = useState(null),
    [done, setDone] = useState([]),
    [reflection, setReflection] = useState(''),
    [deadline, setDeadline] = useState(null),
    [now, setNow] = useState(Date.now()),
    [saved, setSaved] = useState(false);
  const recorded = useRef(false);
  useEffect(() => {
    if (!deadline || saved) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline, saved]);
  const pastMistake = learning.attempts.filter(a => a.subject === subject && !a.correct).at(-1);
  const remaining = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
  function openStep(action) {
    if (action === 'cards') setCards(subject);
    if (action === 'quiz') {
      setReviewQuestion(null);
      setReview(subject);
    }
    if (action === 'notes') {
      navigate('subjects/' + subject);
      onClose();
    }
    if (action === 'mistakes') {
      setReviewQuestion(pastMistake?.question || null);
      setReview(subject);
    }
  }
  function save() {
    if (recorded.current) return;
    recorded.current = true;
    saveLabSession({
      kind: 'plan',
      title: `${plan.minutes}-minute ${COURSES[subject].name} session`,
      subject,
      energy,
      minutes: plan.minutes,
      steps: plan.steps,
      completedSteps: done,
      reflection
    });
    setSaved(true);
  }
  if (saved) return <SessionSaved title={tr("A finishable session, finished.")} onClose={onClose}>{tr("Your completed steps and reflection are saved. The time budget is a guide; take a break before deciding what comes next.")}</SessionSaved>;
  return <div className={s.labBody}><span className={s.eyebrow}>{tr("“I HAVE 12 MINUTES” MODE")}</span><h2>{tr("Make the time you have count.")}</h2><p>{tr("A small session based on your subject, available time, and energy. Timing is a guide; finish or pause at your own pace.")}</p>{tr(!plan ? <><div className={s.formRow}><label>{tr("Minutes available")}<input type="number" min="5" max="60" value={minutes} onChange={e => setMinutes(e.target.value)} aria-label={tr("Minutes available")} /></label><label>{tr("Energy level")}<select value={energy} onChange={e => setEnergy(e.target.value)}><option value="low">{tr("Low · keep it gentle")}</option><option value="steady">{tr("Steady · balanced practice")}</option><option value="high">{tr("High · lean into a challenge")}</option></select></label></div><label>{tr("Subject")}<select value={subject} onChange={e => setSubject(e.target.value)}>{tr(SUBJECT_ORDER.filter(id => COURSES[id].questions.length).map(id => <option key={id} value={id}>{tr(COURSES[id].name)}</option>))}</select></label><div className={s.labActions}><Button onClick={() => setPlan(createStudyPlan(minutes, energy, subject))}>{tr("Build my session ")}<ArrowRight size={16} /></Button></div></> : <><div className={s.planTime}><Timer size={20} /><span>{tr(COURSES[subject].name)}{tr(" · ")}{tr(plan.minutes)}{tr("-minute plan")}</span>{tr(deadline ? <strong role="timer">{tr(Math.floor(remaining / 60))}{tr(":")}{tr(String(remaining % 60).padStart(2, '0'))}</strong> : <button className="text-link" onClick={() => {
          setNow(Date.now());
          setDeadline(Date.now() + plan.minutes * 60000);
        }}>{tr("Start optional timer")}</button>)}</div>{tr(deadline && remaining === 0 && <p className={s.small} role="status">{tr("Your planned time is up. You can finish the remaining steps or take a break.")}</p>)}<div className={s.planSteps}>{tr(plan.steps.map((step, i) => <section key={step.label} className={s.planStep}><span>{tr(done.includes(i) ? <Check size={16} /> : i + 1)}</span><div><h3>{tr(step.label)}</h3><p>{tr(step.minutes)}{tr(" minutes · ")}{tr(step.action === 'mistakes' ? pastMistake ? pastMistake.question : 'No previous mistake is recorded for this subject. Try a fresh review.' : step.action === 'reflect' ? 'Explain one course idea without looking, then compare with your notes.' : step.action === 'notes' ? 'Read the concept below, then explain it in your own words.' : 'Work within the time you have; the suggested duration is not a speed target.')}</p>{tr(step.action === 'reflect' ? <textarea aria-label={tr("Session reflection")} value={reflection} onChange={e => setReflection(e.target.value)} maxLength={1800} placeholder={tr("Here is how I would explain it…")} /> : step.action === 'notes' ? <details className={s.history}><summary>{tr("Open one concept here")}</summary><p><strong>{tr(COURSES[subject].notes[0]?.[0])}</strong><br />{tr(COURSES[subject].notes[0]?.[1])}</p></details> : <button onClick={() => openStep(step.action)}>{tr("Open practice ")}<ArrowUpRight size={14} /></button>)}<label><input type="checkbox" checked={done.includes(i)} onChange={() => setDone(v => v.includes(i) ? v.filter(n => n !== i) : [...v, i])} />{tr("I completed this step")}</label></div></section>))}</div><div className={s.labActions}><button className="text-link" onClick={() => {
          setPlan(null);
          setDone([]);
          setDeadline(null);
        }}>{tr("Adjust my plan")}</button><Button disabled={done.length !== plan.steps.length} onClick={save}>{tr("Save completed session ")}<Check size={16} /></Button></div></>)}</div>;
}
