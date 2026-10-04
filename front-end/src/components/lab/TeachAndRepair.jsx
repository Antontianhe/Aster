import { useT } from "../../i18n.jsx";
import React, { useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, ArrowUpRight, RotateCcw } from 'lucide-react';
import { TEACH_TOPICS, REPAIRS } from '../../labData.js';
import { useApp } from '../../context.jsx';
import { COURSES } from '../../study.js';
import { Blue, Button } from '../UI.jsx';
import s from './StudyLab.module.css';
export function Rubric({
  criteria,
  value,
  onChange,
  disabled = false
}) {
  const tr = useT();
  return <div className={s.rubric}>{tr(criteria.map((criterion, i) => <label key={criterion}><input type="checkbox" checked={value.includes(i)} disabled={disabled} onChange={() => onChange(value.includes(i) ? value.filter(v => v !== i) : [...value, i])} /><span>{tr(criterion)}</span></label>))}</div>;
}
export function SessionSaved({
  title,
  children,
  onClose
}) {
  const tr = useT();
  return <div className={s.savedSession}><CheckCircle2 size={43} /><span className={s.eyebrow}>{tr("SAVED TO YOUR LEARNING RECORD")}</span><h2>{tr(title)}</h2><p>{tr(children)}</p><Button onClick={onClose}>{tr("Back to the lab ")}<ArrowRight size={16} /></Button></div>;
}
export function TeachStudent({
  onClose
}) {
  const tr = useT();
  const {
    saveLabSession,
    playSound
  } = useApp();
  const [topicId, setTopicId] = useState('photosynthesis'),
    [index, setIndex] = useState(0),
    [answer, setAnswer] = useState(''),
    [revealed, setRevealed] = useState(false),
    [checks, setChecks] = useState([]),
    [responses, setResponses] = useState([]),
    [done, setDone] = useState(false);
  const saved = useRef(false);
  const topic = TEACH_TOPICS.find(t => t.id === topicId),
    turn = topic.turns[index];
  function choose(value) {
    setTopicId(value);
    setIndex(0);
    setAnswer('');
    setRevealed(false);
    setChecks([]);
    setResponses([]);
    saved.current = false;
  }
  function next() {
    const nextResponses = [...responses, {
      prompt: turn.prompt,
      answer,
      criteria: checks,
      availableCriteria: turn.criteria.length
    }];
    setResponses(nextResponses);
    if (index === topic.turns.length - 1) {
      if (!saved.current) {
        saved.current = true;
        saveLabSession({
          kind: 'teach',
          title: topic.title,
          subject: topic.subject,
          responses: nextResponses,
          source: topic.source
        });
        playSound('reward');
      }
      setDone(true);
    } else {
      setIndex(i => i + 1);
      setAnswer('');
      setRevealed(false);
      setChecks([]);
    }
  }
  if (done) return <SessionSaved title={tr("You took the teacher’s seat.")} onClose={onClose}>{tr("Your explanations and self-checks are saved. Compare them with the source or ask a teacher where you are still unsure.")}</SessionSaved>;
  return <div className={s.labBody}><span className={s.eyebrow}>{tr("TEACH BLUE · SCRIPTED PRACTICE PARTNER")}</span><p>{tr("You explain. Blue asks a prepared question or deliberately suggests a wrong idea. Your writing stays in this browser; no AI service reads or grades it.")}</p><label>{tr("Topic")}<select value={topicId} onChange={e => choose(e.target.value)}>{tr(TEACH_TOPICS.map(t => <option key={t.id} value={t.id}>{tr(t.title)}{tr(" · ")}{tr(t.scope)}</option>))}</select></label><div className={`${s.labPrompt} ${turn.mistake ? s.misconception : ''}`}><Blue className={s.studentAvatar} /><span>{tr(turn.mistake ? 'CATCH THE DELIBERATE MISCONCEPTION' : 'BLUE ASKS')}{tr(" · ")}{tr(index + 1)}{tr(" / ")}{tr(topic.turns.length)}</span><p>{tr(turn.prompt)}</p></div><label>{tr("Your explanation to Blue")}<textarea value={answer} onChange={e => setAnswer(e.target.value)} maxLength={1800} placeholder={tr("Explain the idea, give a reason, and use an example…")} disabled={revealed} /></label>{tr(!revealed ? <div className={s.labActions}><Button disabled={!answer.trim()} onClick={() => {
        setRevealed(true);
        playSound('click');
      }}>{tr("Compare with the key idea ")}<ArrowRight size={16} /></Button></div> : <><div className={s.modelAnswer}><span>{tr("KEY IDEA · COMPARE IT WITH YOUR EXPLANATION")}</span><p>{tr(turn.answer)}</p></div><p className={s.small}>{tr("Check the statements that honestly describe your explanation. These are self-ratings, not an AI assessment.")}</p><Rubric criteria={turn.criteria} value={checks} onChange={setChecks} /><div className={s.labActions}><button className="text-link" onClick={() => setRevealed(false)}><RotateCcw size={14} />{tr("Refine my explanation")}</button><Button onClick={next}>{tr(index === topic.turns.length - 1 ? 'Save teach-back session' : 'Next student question')}<ArrowRight size={16} /></Button></div></>)}<a className={s.sourceLink} href={topic.source} target="_blank" rel="noopener noreferrer">{tr("Source context: ")}{tr(topic.scope)} <ArrowUpRight size={13} /></a></div>;
}
export function RepairAnswer({
  onClose
}) {
  const tr = useT();
  const {
    saveLabSession,
    playSound
  } = useApp();
  const [id, setId] = useState('peel'),
    [answer, setAnswer] = useState(''),
    [revealed, setRevealed] = useState(false),
    [checks, setChecks] = useState([]),
    [done, setDone] = useState(false);
  const saved = useRef(false);
  const item = REPAIRS.find(r => r.id === id);
  function save() {
    if (saved.current) return;
    saved.current = true;
    saveLabSession({
      kind: 'repair',
      title: item.title,
      subject: item.subject,
      answer,
      criteria: checks,
      availableCriteria: item.criteria.length
    });
    setDone(true);
    playSound('reward');
  }
  return done ? <SessionSaved title={tr("A stronger answer, built by you.")} onClose={onClose}>{tr("Your repaired response and self-assessment are saved for reflection. The model answer is a comparison point, not the only valid wording.")}</SessionSaved> : <div className={s.labBody}><span className={s.eyebrow}>{tr("REPAIR THE ANSWER")}</span><label>{tr("Choose a challenge")}<select value={id} onChange={e => {
        setId(e.target.value);
        setAnswer('');
        setRevealed(false);
        setChecks([]);
      }}>{tr(REPAIRS.map(r => <option key={r.id} value={r.id}>{tr(COURSES[r.subject].name)}{tr(" · ")}{tr(r.title)}</option>))}</select></label><h2>{tr(item.title)}</h2><p>{tr(item.prompt)}</p><div className={s.flawed}><span className={s.eyebrow}>{tr("INTENTIONALLY FLAWED RESPONSE")}</span><p>{tr(item.flawed)}</p></div><label>{tr(item.task)}<textarea value={answer} onChange={e => setAnswer(e.target.value)} maxLength={2400} placeholder={tr("Write your improved version and explain the correction…")} /></label>{tr(!revealed ? <div className={s.labActions}><Button disabled={!answer.trim()} onClick={() => setRevealed(true)}>{tr("Review my repair ")}<ArrowRight size={16} /></Button></div> : <><div className={s.modelAnswer}><span>{tr("ONE POSSIBLE REPAIR")}</span><p>{tr(item.model)}</p></div><p className={s.small}>{tr("Assess your own response against the criteria. Free writing is not automatically graded.")}</p><Rubric criteria={item.criteria} value={checks} onChange={setChecks} /><div className={s.labActions}><Button onClick={save}>{tr("Save repaired answer ")}<CheckCircle2 size={16} /></Button></div></>)}<p className={s.small}>{tr("Original Learnify practice, based on current course concepts. This is not a teacher’s marked response.")}</p></div>;
}
