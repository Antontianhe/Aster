import React, { useMemo } from 'react';
import { ArrowRight, Check, Lightbulb, Sparkles } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { useT } from '../../i18n.jsx';
import { COURSES } from '../../study.js';
import { dailyQuestion, savedDailyChoice } from '../../today.js';
import s from './Today.module.css';

export default function DailySpark({ day }) {
  const tr = useT();
  const { prefs, setPrefs, navigate, playTone } = useApp();
  const pick = useMemo(() => dailyQuestion(day, COURSES), [day]);
  if (!pick) return <section className={s.spark}><Lightbulb/><h2>{tr('Follow your curiosity.')}</h2><button onClick={() => navigate('subjects')}>{tr('Explore your subjects')}<ArrowRight size={16}/></button></section>;
  const { subject, question } = pick;
  const choice = savedDailyChoice(prefs.dailySpark, day, question);
  const answered = choice !== null;
  function answer(index) {
    if (answered) return;
    setPrefs(previous => ({ ...previous, dailySpark: { day, id: question.id, choice: index } }));
    playTone(index === question.a);
  }
  return <section className={s.spark} aria-labelledby="daily-spark-title">
    <div className={s.sparkTop}><span><Sparkles size={15}/>{tr('THE DAILY SPARK')}</span><span>{tr(COURSES[subject].name)}</span></div>
    <h2 id="daily-spark-title">{tr('One question. A new connection.')}</h2>
    <p className={s.sparkQuestion}>{tr(question.q)}</p>
    <div className={s.answers} role="group" aria-label={tr('Choose an answer')}>
      {question.options.map((option, index) => <button key={index} disabled={answered} aria-pressed={choice === index}
        data-result={answered ? index === question.a ? 'correct' : index === choice ? 'incorrect' : 'other' : undefined}
        onClick={() => answer(index)}><span>{answered && index === question.a ? <Check size={14}/> : String.fromCharCode(65 + index)}</span>{tr(option)}</button>)}
    </div>
    {answered ? <div className={s.explanation} role="status"><strong>{tr(choice === question.a ? 'That’s the connection.' : 'A useful discovery.')}</strong><p>{tr(question.why)}</p><button onClick={() => navigate(`subjects/${subject}`)}>{tr('Keep exploring')}<ArrowRight size={15}/></button></div>
      : <p className={s.sparkNote}>{tr('Just a warm-up. No score, no pressure.')}</p>}
  </section>;
}
