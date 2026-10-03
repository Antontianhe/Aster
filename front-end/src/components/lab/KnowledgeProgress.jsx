import { useT } from "../../i18n.jsx";
import React, { useState } from 'react';
import { Check, ArrowRight, Target, Network, RotateCcw } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { COURSES } from '../../study.js';
import { CONFIDENCE } from '../../learning.js';
import { Button } from '../UI.jsx';
import s from './StudyLab.module.css';
export function KnowledgeProgress({
  subject
}) {
  const tr = useT();
  const {
    learning,
    setReview,
    setReviewQuestion
  } = useApp();
  const [selected, setSelected] = useState(0);
  const [visible,setVisible]=useState(24);
  const course = COURSES[subject];
  if (!course?.questions.length) return null;
  const question = course.questions[selected];
  const history = learning.attempts.filter(a => a.subject === subject && a.question === question.q),
    latest = history.at(-1);
  return <section className={s.knowledge}><div className={s.sectionTitle}><Network size={21} /><div><h2>{tr("Your knowledge, in view.")}</h2><p>{tr("Question-level evidence from your own attempts. Explanation status is self-reported.")}</p></div></div><div className={s.knowledgeGrid}><div className={s.knowledgeNodes}>{tr(course.questions.slice(0,visible).map((q, i) => {
          const attempts = learning.attempts.filter(a => a.subject === subject && a.question === q.q),
            last = attempts.at(-1);
          const status = !last ? 'Not attempted' : last.correct && last.canExplain ? 'Self-rated explanation' : last.correct ? 'Correct · check explanation' : 'Needs another check';
          return <button key={q.q} onClick={() => setSelected(i)} aria-pressed={i === selected} className={i === selected ? s.active : ''}><span className={last?.correct ? s.nodeGood : s.nodePending}>{tr(last?.correct ? <Check size={16} /> : i + 1)}</span><span><strong>{tr(q.q)}</strong><small>{tr(status)}{tr(" · ")}{tr(attempts.length)}{tr(" attempts")}</small></span><ArrowRight size={16} /></button>;
        }))}{visible<course.questions.length&&<Button variant="secondary" onClick={()=>setVisible(v=>v+24)}>{tr("Show more questions")}</Button>}</div><div className={s.knowledgeDetail}><span className={s.eyebrow}>{tr("SELECTED KNOWLEDGE CHECK")}</span><h3>{tr(question.q)}</h3>{tr(latest ? <><div className={s.signalPills}><span>{tr(latest.correct ? 'Last answer correct' : 'Last answer needs review')}</span><span>{tr(CONFIDENCE.find(c => c.value === latest.confidence)?.label)}</span>{tr(latest.hintUsed && <span>{tr("Used a hint")}</span>)}</div><p><strong>{tr("Your last answer:")}</strong> {tr(latest.selected)}</p>{tr(latest.reasoning && <p><strong>{tr("Your reasoning:")}</strong> {tr(latest.reasoning)}</p>)}{tr(latest.reflection && <p><strong>{tr("Your follow-up:")}</strong> {tr(latest.reflection)}</p>)}<p className={s.small}>{tr("Last attempted ")}{tr(new Date(latest.at).toLocaleDateString('en-GB'))}{tr(". Correctness alone does not prove lasting understanding.")}</p></> : <p>{tr("No recorded attempts yet. Try this check, record your confidence, and return to compare your thinking.")}</p>)}<Button onClick={() => {
          setReviewQuestion(question.q);
          setReview(subject);
        }}><RotateCcw size={16} />{tr(latest ? 'Reattempt this question' : 'Try this question')}</Button>{tr(history.length > 1 && <details className={s.history}><summary>{tr(history.length)}{tr(" previous attempts")}</summary>{tr(history.slice(-5).reverse().map(a => <p key={a.id}>{tr(new Date(a.at).toLocaleDateString('en-GB'))}{tr(" · ")}{tr(a.correct ? 'Correct' : 'Review needed')}{tr(" · ")}{tr(CONFIDENCE.find(c => c.value === a.confidence)?.label)}{tr(a.reasoning && <span>{tr(a.reasoning)}</span>)}</p>))}</details>)}</div></div></section>;
}
