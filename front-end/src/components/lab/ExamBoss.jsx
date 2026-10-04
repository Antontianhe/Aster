import { useT } from "../../i18n.jsx";
import React, { useEffect, useRef, useState } from 'react';
import { Timer, Shield, ArrowRight, CheckCircle2, Check, ArrowUpRight } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { bossScore } from '../../learning.js';
import { BOSSES } from '../../labData.js';
import { COURSES } from '../../study.js';
import { Button } from '../UI.jsx';
import { Rubric } from './TeachAndRepair.jsx';
import s from './StudyLab.module.css';
import b from './Boss.module.css';
export function PopulationChart() {
  const tr = useT();
  const groups = [['65+', 2.4, 2.6], ['15–64', 30, 30], ['0–14', 18, 17]];
  return <figure className={b.pyramid}><figcaption>{tr("Riverton’s age and sex structure ")}<span>{tr("Fictional practice data · % of the total population")}</span></figcaption><svg viewBox="0 0 500 212" role="img" aria-label={tr("Age chart: ages zero to fourteen are 35 percent, ages fifteen to sixty-four are 60 percent, ages sixty-five and over are 5 percent. Male and female shares are in the accompanying table.")}><text x="115" y="25">{tr("Male")}</text><text x="348" y="25">{tr("Female")}</text>{tr(groups.map(([label, male, female], i) => <g key={label}><rect x={233 - male * 5.7} y={45 + i * 47} width={male * 5.7} height="32" rx="5" fill="#a989e4" /><rect x="267" y={45 + i * 47} width={female * 5.7} height="32" rx="5" fill="#69c0c5" /><text x="250" y={65 + i * 47} textAnchor="middle">{tr(label)}</text><text x={225 - male * 5.7} y={65 + i * 47} textAnchor="end">{tr(male)}{tr("%")}</text><text x={276 + female * 5.7} y={65 + i * 47}>{tr(female)}{tr("%")}</text></g>))}<text x="250" y="199" textAnchor="middle">{tr("AGE GROUP")}</text></svg><details><summary>{tr("Show chart data as a table")}</summary><table><thead><tr><th>{tr("Age")}</th><th>{tr("Male")}</th><th>{tr("Female")}</th><th>{tr("Total")}</th></tr></thead><tbody>{tr(groups.map(([label, male, female]) => <tr key={label}><th>{tr(label)}</th><td>{tr(male)}{tr("%")}</td><td>{tr(female)}{tr("%")}</td><td>{tr(male + female)}{tr("%")}</td></tr>))}</tbody></table></details></figure>;
}
export function ExamBoss({
  onClose
}) {
  const tr = useT();
  const {
    recordReview,
    saveLabSession
  } = useApp();
  const [id, setId] = useState('population'),
    [mode, setMode] = useState('practice'),
    [started, setStarted] = useState(false),
    [deadline, setDeadline] = useState(null),
    [now, setNow] = useState(Date.now()),
    [answers, setAnswers] = useState({}),
    [writing, setWriting] = useState(''),
    [finished, setFinished] = useState(false),
    [checks, setChecks] = useState([]),
    [saved, setSaved] = useState(false);
  const recorded = useRef(false),
    startTime = useRef(null);
  const boss = BOSSES.find(item => item.id === id),
    remaining = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null,
    expired = started && mode === 'exam' && remaining === 0;
  useEffect(() => {
    if (!started || finished || mode !== 'exam') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [started, finished, mode]);
  function start() {
    setStarted(true);
    startTime.current = Date.now();
    setNow(Date.now());
    if (mode === 'exam') setDeadline(Date.now() + 8 * 60000);
  }
  function finish() {
    if (recorded.current) return;
    recorded.current = true;
    recordReview(boss.subject, bossScore(boss, answers), boss.questions.length, Math.max(1, Math.round((Date.now() - startTime.current) / 60000)), 'boss');
    setFinished(true);
  }
  function save() {
    if (saved) return;
    saveLabSession({
      kind: 'boss',
      title: boss.title,
      subject: boss.subject,
      mode,
      score: bossScore(boss, answers),
      total: boss.questions.length,
      answers,
      writing,
      criteria: checks,
      availableCriteria: boss.criteria.length,
      expired
    });
    setSaved(true);
  }
  if (!started) return <div className={s.labBody}><span className={s.eyebrow}>{tr("EXAM BOSS BATTLES · MIXED-SKILL PRACTICE")}</span><h2>{tr("A bigger challenge, at your pace.")}</h2><p>{tr("Combine calculations, interpretation, and a written explanation. Objective questions are checked automatically; writing uses a transparent self-assessment rubric.")}</p><label>{tr("Challenge")}<select value={id} onChange={e => setId(e.target.value)}>{tr(BOSSES.map(item => <option key={item.id} value={item.id}>{tr(COURSES[item.subject].name)}{tr(" · ")}{tr(item.title)}</option>))}</select></label><div className={b.modeChoice}><button aria-pressed={mode === 'practice'} onClick={() => setMode('practice')}><Shield size={24} /><strong>{tr("Untimed practice")}</strong><span>{tr("Think carefully. Use as long as you need.")}</span></button><button aria-pressed={mode === 'exam'} onClick={() => setMode('exam')}><Timer size={24} /><strong>{tr("Exam-style mode")}</strong><span>{tr("8 minutes. Answers lock when time ends.")}</span></button></div><p className={s.small}>{tr("The time limit is an Learnify practice setting, not an official ISR or examination-board requirement. Leaving restarts an unfinished challenge.")}</p><div className={s.labActions}><Button onClick={start}>{tr("Start boss battle ")}<ArrowRight size={16} /></Button></div></div>;
  const score = bossScore(boss, answers);
  return <div className={s.labBody}><div className={b.bossHeader}><span className={s.eyebrow}>{tr(finished ? 'CHALLENGE REVIEW' : boss.subtitle)}</span>{tr(mode === 'exam' ? <span className={`${b.countdown} ${expired ? b.timeUp : ''}`} role="timer" aria-label={tr(`${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds remaining`)}><Timer size={15} />{tr(Math.floor(remaining / 60))}{tr(":")}{tr(String(remaining % 60).padStart(2, '0'))}</span> : <span className={b.countdown}>{tr("Untimed practice")}</span>)}</div><h2>{tr(boss.title)}</h2><p>{tr(boss.scenario)}</p>{tr(expired && !finished && <p className={s.flawed} role="status">{tr("Time is up. Your answers are locked; open the review to see what to work on next.")}</p>)}{tr(boss.id === 'population' && <PopulationChart />)}<div className={b.bossQuestions}>{tr(boss.questions.map((q, i) => {
        const correct = q.choices ? answers[i] === q.answer : String(answers[i] ?? '').trim() !== '' && Number(String(answers[i]).replace(/,/g, '')) === q.answer;
        return <section key={q.q}><span>{tr("SKILL CHECK ")}{tr(i + 1)}</span><h3>{tr(q.q)}</h3>{tr(q.choices ? <div className={s.choiceButtons}>{tr(q.choices.map((choice, option) => <button key={choice} disabled={finished || expired} aria-pressed={answers[i] === option} onClick={() => setAnswers(v => ({
              ...v,
              [i]: option
            }))}>{tr(choice)}</button>))}</div> : <label>{tr("Numeric answer")}<input aria-label={tr(`Answer to skill check ${i + 1}`)} value={answers[i] ?? ''} inputMode="decimal" onChange={e => setAnswers(v => ({
              ...v,
              [i]: e.target.value
            }))} maxLength={30} disabled={finished || expired} /></label>)}{tr(finished && <p className={`${b.answerCheck} ${correct ? s.positive : s.negative}`}><CheckCircle2 size={16} />{tr(correct ? 'Correct. ' : '')}{tr(q.why)}</p>)}</section>;
      }))}</div><label className={b.writing}><strong>{tr("CONNECT THE IDEAS")}</strong>{tr(boss.writing)}<textarea value={writing} onChange={e => setWriting(e.target.value)} maxLength={2600} disabled={finished || expired} placeholder={tr("Write your explanation…")} /></label>{tr(!finished ? <div className={s.labActions}><span>{tr("Unanswered checks receive 0.")}</span><Button onClick={finish}>{tr("Finish & review ")}<ArrowRight size={16} /></Button></div> : <><div className={b.bossResult}><strong>{tr(score)}<span>{tr(" / ")}{tr(boss.questions.length)}</span></strong><div><h3>{tr("Objective checks correct")}</h3><p>{tr("+")}{tr(score * 5)}{tr(" XP · writing assessed separately below")}</p></div></div><div className={s.modelAnswer}><span>{tr("ONE POSSIBLE WRITTEN RESPONSE")}</span><p>{tr(boss.model)}</p></div><p className={s.small}>{tr("Compare your writing with the criteria. These checks are your own assessment, not an exam grade.")}</p><Rubric criteria={boss.criteria} value={checks} onChange={setChecks} disabled={saved} /><div className={s.labActions}>{tr(saved ? <><span className={s.positive}>{tr("Written reflection saved.")}</span><Button onClick={onClose}>{tr("Back to the lab ")}<ArrowRight size={16} /></Button></> : <Button onClick={save}>{tr("Save writing & self-check ")}<Check size={16} /></Button>)}</div></>)}<a className={s.sourceLink} href={COURSES[boss.subject].unitSource || COURSES[boss.subject].source} target="_blank" rel="noopener noreferrer">{tr("Current course context ")}<ArrowUpRight size={13} /></a></div>;
}
