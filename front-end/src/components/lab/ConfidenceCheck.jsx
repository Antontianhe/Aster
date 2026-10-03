import { useT } from "../../i18n.jsx";
import React, { useState } from 'react';
import { Target, Lightbulb, ScanSearch, CheckCircle2 } from 'lucide-react';
import { CONFIDENCE, DIAGNOSES } from '../../learning.js';
import { useApp } from '../../context.jsx';
import s from './StudyLab.module.css';
export function ConfidenceCheck({
  value,
  onChange,
  reasoning,
  onReasoning,
  hintUsed,
  onHint,
  hint
}) {
  const tr = useT();
  return <section className={s.confidence}><div><Target size={16} /><strong>{tr("How confident are you?")}</strong><small>{tr("Before checking your answer")}</small></div><div className={s.confidenceOptions} role="group" aria-label={tr("Confidence before answering")}>{tr(CONFIDENCE.map(option => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{tr(option.label)}</button>))}</div><details className={s.reasoning}><summary>{tr("Add your reasoning ")}<span>{tr("optional · useful for comparing attempts")}</span></summary><textarea aria-label={tr("My reasoning before answering")} value={reasoning} onChange={e => onReasoning(e.target.value)} maxLength={1600} placeholder={tr("What led you to this answer?")} /></details>{tr(hintUsed ? <p className={s.hint}><Lightbulb size={15} /><span>{tr(hint)} <small>{tr("This attempt is recorded as assisted.")}</small></span></p> : <button className={s.hintButton} type="button" onClick={onHint}><Lightbulb size={14} />{tr("Show an explanation hint")}</button>)}</section>;
}
export function AnswerReflection({
  attemptId
}) {
  const tr = useT();
  const {
    learning,
    updateAttempt
  } = useApp();
  const attempt = learning.attempts.find(a => a.id === attemptId);
  const [check, setCheck] = useState(false);
  if (!attempt) return null;
  const diagnosis = DIAGNOSES.find(d => d.id === attempt.diagnosis);
  return <section className={s.reflection}>{tr(!attempt.correct && <><div className={s.reflectionTitle}><ScanSearch size={19} /><div><h3>{tr("Mistake detective")}</h3><p>{tr("What needs attention? Choose what best describes this attempt.")}</p></div></div><div className={s.diagnosisOptions}>{tr(DIAGNOSES.map(d => <button key={d.id} aria-pressed={attempt.diagnosis === d.id} onClick={() => {
          updateAttempt(attemptId, {
            diagnosis: d.id
          });
          setCheck(false);
        }}>{tr(d.label)}</button>))}</div>{tr(diagnosis && <div className={s.targetedCheck}><span>{tr("TARGETED FOLLOW-UP · SELF-CHECK")}</span><label>{tr(diagnosis.prompt)}<textarea value={attempt.reflection || ''} onChange={e => updateAttempt(attemptId, {
            reflection: e.target.value
          })} maxLength={1600} placeholder={tr("Work through the idea in your own words…")} /></label><button disabled={!attempt.reflection?.trim()} onClick={() => setCheck(true)}>{tr("Compare with the checkpoint ")}<CheckCircle2 size={15} /></button>{tr(check && <p role="status">{tr(diagnosis.check)}<br /><strong>{tr("Key idea:")}</strong> {tr(attempt.why)}</p>)}</div>)}</>)}<label className={s.explanationCheck}><input type="checkbox" checked={attempt.canExplain || false} onChange={e => updateAttempt(attemptId, {
        canExplain: e.target.checked
      })} /><span>{tr("I can now explain why this answer works.")}<small>{tr("A self-rating, saved to your knowledge map.")}</small></span></label></section>;
}
