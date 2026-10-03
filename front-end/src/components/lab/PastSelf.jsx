import { useT } from "../../i18n.jsx";
import React, { useMemo, useState } from 'react';
import { RotateCcw, ArrowRight, Target } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { COURSES, SUBJECT_ORDER } from '../../study.js';
import { CONFIDENCE, confidenceSummary, previousAttempt } from '../../learning.js';
import { Button } from '../UI.jsx';
import s from './StudyLab.module.css';
export function PastSelf() {
  const tr = useT();
  const {
    learning,
    setReview,
    setReviewQuestion
  } = useApp();
  const [subject, setSubject] = useState('all');
  const attempts = useMemo(() => learning.attempts.filter(a => subject === 'all' || a.subject === subject), [learning.attempts, subject]);
  const summary = confidenceSummary(attempts);
  const latest = useMemo(() => {
    const map = new Map();
    for (const attempt of attempts) map.set(attempt.subject + ':' + attempt.question, attempt);
    return [...map.values()].reverse().slice(0, 12);
  }, [attempts]);
  return <div className={s.labBody}><span className={s.eyebrow}>{tr("BEAT YOUR PAST SELF")}</span><h2>{tr("Your most useful comparison is you.")}</h2><p>{tr("Compare your latest answer with a previous attempt at the same question. Reasoning, confidence, and hints give context to accuracy.")}</p><div className={s.pastFilters}><label>{tr("Subject")}<select value={subject} onChange={e => setSubject(e.target.value)}><option value="all">{tr("All subjects")}</option>{tr(SUBJECT_ORDER.filter(id => COURSES[id].questions.length).map(id => <option value={id} key={id}>{tr(COURSES[id].name)}</option>))}</select></label></div><div className={s.metrics}><div><strong>{tr(summary.total ? Math.round(summary.correct / summary.total * 100) + '%' : '—')}</strong><span>{tr("accuracy across ")}{tr(summary.total)}{tr(" recorded checks")}</span></div><div><strong>{tr(summary.unsureCorrect)}</strong><span>{tr("correct but unsure · revisit to build confidence")}</span></div><div><strong>{tr(summary.confidentWrong)}</strong><span>{tr("incorrect but very confident · investigate the idea")}</span></div></div><p className={s.small}>{tr("These counts include assisted attempts, identified below. They describe practice history, not a predicted exam grade.")}</p>{tr(!latest.length ? <div className={s.labPrompt}><Target size={27} /><p>{tr("Your first attempt is the starting point.")}</p><p className={s.small}>{tr("Complete a quick recall question and record your confidence. Reattempt it later to compare your thinking.")}</p><Button onClick={() => {
        setReviewQuestion(null);
        setReview(subject === 'all' ? 'maths' : subject);
      }}>{tr("Start a review ")}<ArrowRight size={16} /></Button></div> : <div className={s.personalCards}>{tr(latest.map(current => {
        const before = previousAttempt(attempts, current);
        return <article key={current.id} className={s.personalCard}><span className={s.eyebrow}>{tr(COURSES[current.subject].name)}</span><h3>{tr(current.question)}</h3><div className={s.comparison}>{tr([['Previous attempt', before], ['Latest attempt', current]].map(([title, attempt]) => <div key={title}><span className={s.comparisonTitle}>{tr(title.toUpperCase())}</span>{tr(attempt ? <><strong className={attempt.correct ? s.positive : s.negative}>{tr(attempt.correct ? 'Correct answer' : 'Needs another check')}</strong><small>{tr(new Date(attempt.at).toLocaleDateString('en-GB'))}{tr(" · ")}{tr(CONFIDENCE.find(c => c.value === attempt.confidence)?.label)}{tr(" · ")}{tr(attempt.hintUsed ? 'Hint used' : 'No hint')}</small><p>{tr(attempt.reasoning || 'No reasoning note recorded.')}</p>{tr(attempt.canExplain && <small>{tr("Self-rated: can explain")}</small>)}</> : <p>{tr("No earlier attempt yet. Return after another try.")}</p>)}</div>))}</div><div className={s.labActions}><Button variant="secondary" onClick={() => {
              setReviewQuestion(current.question);
              setReview(current.subject);
            }}><RotateCcw size={15} />{tr("Try this question again")}</Button></div></article>;
      }))}</div>)}</div>;
}
