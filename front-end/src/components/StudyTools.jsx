import { useT } from "../i18n.jsx";
import { ConfidenceCheck, AnswerReflection } from './lab/ConfidenceCheck.jsx';
import { courseDeck } from '../studySets.js';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Check, X, Target, Clock3, Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight, Sparkles, Layers3, BookOpen, Timer, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context.jsx';
import { COURSES, SUBJECT_META, makeQuiz, dayKey, readStored, minutesLabel } from '../study.js';
import { Blue, Button, Modal, PageHeading, Progress, SubjectTag, ColorIcon } from './UI.jsx';
import { FlashcardFace } from './neon/FlashcardFace.jsx';
import { requireCourse } from './neon/validation.js';
import PracticeSetup from './PracticeSetup.jsx';
import {selectPractice} from '../questionBank.js';
export function Quiz({
  subject,
  selectedQuestion,
  selectedQuestions,
  onClose
}) {
  const tr = useT();
  const {
    recordReview,
    prefs,
    playTone,
    playSound,
    reward,
    logAttempt
  } = useApp();
  const [questions,setQuestions] = useState(() => selectedQuestion || selectedQuestions?.length ? makeQuiz(subject,{selectedQuestion, selectedQuestions}) : []),
    [index, setIndex] = useState(0),
    [choice, setChoice] = useState(null),
    [checked, setChecked] = useState(false),
    [answers, setAnswers] = useState([]),
    [finished, setFinished] = useState(false),
    [exit, setExit] = useState(false);
  const recorded = useRef(false),
    started = useRef(Date.now()),
    question = questions[index];
  const [confidence, setConfidence] = useState(null),
    [reasoning, setReasoning] = useState(''),
    [hintUsed, setHintUsed] = useState(false),
    [attemptId, setAttemptId] = useState(null);
  const correct = answers.filter(a => a.correct).length;
  function submit() {
    if (choice === null || !checked && confidence === null) return;
    if (!checked) {
      setChecked(true);
      playTone(question.choices[choice].correct);
      setAttemptId(logAttempt({
        subject,
        questionId: question.id,
        question: question.q,
        selected: question.choices[choice].text,
        expected: question.choices.find(c => c.correct).text,
        why: question.why,
        correct: question.choices[choice].correct,
        confidence,
        reasoning,
        hintUsed,
        diagnosis: '',
        reflection: '',
        canExplain: false
      }));
      return;
    }
    const next = [...answers, {
      q: question.q,
      why: question.why,
      correct: question.choices[choice].correct,
      selected: question.choices[choice].text,
      right: question.choices.find(c => c.correct).text
    }];
    setAnswers(next);
    if (index < questions.length - 1) {
      setIndex(i => i + 1);
      setChoice(null);
      setChecked(false);
      setConfidence(null);
      setReasoning('');
      setHintUsed(false);
      setAttemptId(null);
    } else {
      if (!recorded.current) {
        recorded.current = true;
        recordReview(subject, next.filter(a => a.correct).length, questions.length, Math.max(1, Math.round((Date.now() - started.current) / 60000)), selectedQuestion ? 'checkpoint' : 'review');
      }
      setFinished(true);
    }
  }
  useEffect(() => {
    function key(e) {
      if (exit || finished || !question || e.target?.matches('input,textarea,select,[contenteditable="true"]')) return;
      if (/^[1-4]$/.test(e.key) && !checked && Number(e.key) <= question.choices.length) setChoice(Number(e.key) - 1);
    }
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [exit, finished, checked, question]);
  if(!questions.length)return <Modal title={tr(COURSES[subject].name)+' · '+tr('Practice')} onClose={onClose} size="large"><PracticeSetup subject={subject} onStart={next=>{started.current=Date.now();setQuestions(next)}}/></Modal>;
  return <><Modal title={tr(finished ? 'Review complete' : `${COURSES[subject].name} · quick recall`)} onClose={() => finished ? onClose() : setExit(true)} size="large" className={`quiz-dialog ${checked && !finished ? question.choices[choice].correct ? 'ambient-success' : 'ambient-error' : ''}`}>{tr(finished ? <div className="review-result"><Blue celebrate className="result-blue" /><span className="eyebrow">{tr("SESSION COMPLETE")}</span><h2>{tr(correct === questions.length ? 'Perfect recall.' : correct / questions.length >= .6 ? 'Review complete.' : 'Keep building your understanding.')}</h2><p>{tr(correct / questions.length >= .6 ? 'Your progress is saved. Keep building on it.' : 'Review the explanations, then try again when you are ready.')}</p>{tr(reward?.tier && <p className="review-tier" role="status"><Sparkles size={16} />{tr(" New tier unlocked: ")}<strong>{tr(reward.tier)}</strong></p>)}<div className="result-metrics"><div><strong>{tr(Math.round(correct / questions.length * 100))}<small>{tr("%")}</small></strong><span>{tr("Accuracy")}</span></div><div><strong>{tr(correct)}<small>{tr(" / ")}{tr(questions.length)}</small></strong><span>{tr("Ideas recalled")}</span></div><div><strong>{tr("+")}{tr(correct * 5)}</strong><span>{tr("Learning XP")}</span></div></div><p>{tr("Coins earned:")} <strong>+{correct*2}</strong></p>{tr(answers.some(a => !a.correct) && <details className="review-mistakes"><summary><BookOpen size={17} />{tr("Review your missed questions")}</summary>{tr(answers.filter(a => !a.correct).map(a => <div key={a.q}><h4>{tr(a.q)}</h4><p><strong>{tr(a.right)}</strong>{tr(" — ")}{tr(a.why)}</p></div>))}</details>)}<Button className="full" onClick={onClose}>{tr("Back to my study space ")}<ArrowRight size={17} /></Button></div> : <><div className="quiz-top"><Progress value={index / questions.length * 100} label={tr("Review progress")} /><span>{tr(index + 1)}{tr(" of ")}{tr(questions.length)}</span></div><div className="quiz-body"><span className="eyebrow">{tr(question.topic)} · {tr(question.level==='applied'?'Application':'Recall')}</span><h2>{tr(question.q)}</h2><p className="keyboard-hint">{tr(question.sourceLabel)}</p><div className="quiz-choices">{tr(question.choices.map((c, i) => <button key={c.text} disabled={checked} aria-pressed={choice === i} className={`quiz-choice ${choice === i ? 'chosen' : ''} ${checked && c.correct ? 'correct' : ''} ${checked && choice === i && !c.correct ? 'incorrect' : ''}`} onClick={() => {
              setChoice(i);
              playSound('click');
            }}><span>{tr(i + 1)}</span><strong>{tr(c.text)}</strong>{tr(checked && c.correct && <CheckCircle2 size={21} />)}</button>))}</div><span className="keyboard-hint">{tr("Use keys 1–4 to choose an answer")}</span>{tr(!checked && <ConfidenceCheck value={confidence} onChange={setConfidence} reasoning={reasoning} onReasoning={setReasoning} hintUsed={hintUsed} onHint={() => setHintUsed(true)} hint={question.why} />)}</div><footer className={`quiz-feedback ${checked ? question.choices[choice].correct ? 'success' : 'learn' : ''}`}><div role="status">{tr(checked ? <><h3>{tr(question.choices[choice].correct ? 'Correct.' : "Not quite. Here's why.")}</h3><p>{tr(question.why)}</p></> : <p>{tr("Choose an answer to check your understanding.")}</p>)}</div><Button disabled={choice === null || !checked && confidence === null} onClick={submit}>{tr(checked ? index === questions.length - 1 ? 'Finish review' : 'Next idea' : 'Check answer')}<ArrowRight size={17} /></Button></footer>{tr(checked && attemptId && <AnswerReflection key={attemptId} attemptId={attemptId} />)}</>)}</Modal>{tr(exit && <Modal title={tr("Leave this review?")} onClose={() => setExit(false)} size="small"><div className="dialog-content"><p>{tr("Checked answers and reflections are saved. Finish the review to receive its XP; leaving restarts the question sequence.")}</p><div className="dialog-actions"><Button variant="secondary" onClick={onClose}>{tr("Leave review")}</Button><Button onClick={() => setExit(false)}>{tr("Keep going")}</Button></div></div></Modal>)}</>;
}
export function Flashcards({
  subject,
  deck,
  onClose
}) {
  const tr = useT();
  const {
    completeCards,
    playSound
  } = useApp();
  const [studyDeck] = useState(()=>{if(deck)return deck;const base=courseDeck(subject);const chosen=selectPractice(COURSES[subject]?.questions||[],{limit:20,mode:'mixed'});return {...base,cards:(base?.cards||[]).filter(c=>chosen.some(q=>q.q===c.question))}});
  const cards = studyDeck?.cards || [];
  if (!cards.length) throw new Error('This study set has no flashcards.');
  const completedOnce = useRef(false);
  const [index, setIndex] = useState(0),
    [flipped, setFlipped] = useState(false),
    [known, setKnown] = useState([]),
    [reviewed, setReviewed] = useState([]),
    [completed, setCompleted] = useState(false);
  function move(delta) {
    setFlipped(false);
    setIndex(i => (i + delta + cards.length) % cards.length);
  }
  function rate(gotIt) {
    setKnown(list => gotIt ? [...new Set([...list, index])] : list.filter(i => i !== index));
    const nextReviewed = [...new Set([...reviewed, index])];
    setReviewed(nextReviewed);
    playSound(gotIt ? 'correct' : 'click');
    if (nextReviewed.length === cards.length) {
      setCompleted(true);
      if (!completedOnce.current) {
        completedOnce.current = true;
        if (!deck) completeCards(subject);
      }
    } else {
      setFlipped(false);
      setIndex(cards.findIndex((_, i) => !nextReviewed.includes(i)));
    }
  }
  const card = cards[index];
  return <Modal title={tr(`${COURSES[subject].name} · flashcards`)} onClose={onClose} size="large"><div className="flashcards">{tr(completed ? <><Blue celebrate className="flashcard-blue" /><h2>{tr("Review pass complete.")}</h2><p>{tr(known.length)}{tr(" of ")}{tr(cards.length)}{tr(" answers marked familiar. Self-ratings help you choose what to revisit.")}</p><div className="dialog-actions"><Button variant="secondary" onClick={() => {
            setIndex(0);
            setFlipped(false);
            setCompleted(false);
            setKnown([]);
            setReviewed([]);
          }}><RotateCcw size={16} />{tr("Another pass")}</Button><Button onClick={onClose}>{tr("Done ")}<Check size={16} /></Button></div></> : <><div className="flashcard-header"><SubjectTag id={subject} /><span>{tr(index + 1)}{tr(" / ")}{tr(cards.length)}</span></div><FlashcardFace title={tr(card.question)} explanation={card.answer + (card.explanation && card.explanation !== card.answer ? ' — ' + card.explanation : '')} flipped={flipped} onFlip={() => {
          setFlipped(f => !f);
          playSound('click');
        }} />{tr(flipped ? <div className="flashcard-rating"><Button variant="secondary" onClick={() => rate(false)}>{tr("Still learning")}</Button><Button onClick={() => rate(true)}><Check size={17} />{tr("Recalled it")}</Button></div> : <div className="flashcard-navigation"><button className="icon-button" aria-label={tr("Previous flashcard")} onClick={() => move(-1)}><ChevronLeft /></button><span>{tr("Try answering before you reveal.")}</span><button className="icon-button" aria-label={tr("Next flashcard")} onClick={() => move(1)}><ChevronRight /></button></div>)}{tr(card.source && <a className="flashcard-source" href={card.source} target="_blank" rel="noopener noreferrer">{tr(deck ? 'Study set source' : 'Based on this Schoolbox unit')}{tr(" ↗")}</a>)}</>)}</div></Modal>;
}
export function FocusRoom() {
  const tr = useT();
  const {
    focus,
    setFocus,
    finishFocus,
    prefs,
    setPrefs,
    homework,
    navigate,
    sessionHistory
  } = useApp();
  const [tick, setTick] = useState(Date.now()),
    [confirmReset, setConfirmReset] = useState(false),
    [celebrate, setCelebrate] = useState(false);
  const lastCompleted = useRef(false);
  const remaining = focus.running ? Math.max(0, Math.ceil((focus.endsAt - tick) / 1000)) : focus.remaining;
  useEffect(() => {
    if (!focus.running) return;
    const timer = setInterval(() => setTick(Date.now()), 250);
    return () => clearInterval(timer);
  }, [focus.running]);
  useEffect(() => {
    if (focus.running && remaining === 0 && !lastCompleted.current) {
      lastCompleted.current = true;
      finishFocus();
      setCelebrate(true);
    }
  }, [remaining, focus.running, finishFocus]);
  function choose(minutes) {
    if (focus.running) {
      setConfirmReset(true);
      return;
    }
    setFocus(f => ({
      ...f,
      duration: minutes * 60,
      remaining: minutes * 60,
      endsAt: null,
      running: false
    }));
    setCelebrate(false);
    lastCompleted.current = false;
  }
  function toggle() {
    lastCompleted.current = false;
    setTick(Date.now());
    setFocus(f => f.running ? {
      ...f,
      running: false,
      remaining: Math.max(0, Math.ceil((f.endsAt - Date.now()) / 1000)),
      endsAt: null
    } : {
      ...f,
      running: true,
      remaining: f.remaining || f.duration,
      endsAt: Date.now() + (f.remaining || f.duration) * 1000
    });
    setCelebrate(false);
  }
  function reset() {
    setFocus(f => ({
      ...f,
      running: false,
      remaining: f.duration,
      endsAt: null
    }));
    setConfirmReset(false);
    lastCompleted.current = false;
    setCelebrate(false);
  }
  const today = dayKey();
  const focusToday = sessionHistory.filter(s => s.kind === 'focus' && dayKey(new Date(s.finishedAt)) === today).reduce((sum, s) => sum + s.minutes, 0);
  return <><PageHeading eyebrow={tr("TIME TO FOCUS.")} title={tr("Make time for focused work.")} description={tr("Choose a task, set your session length, and get started.")} /><div className="focus-layout"><section className="focus-room"><div className="focus-durations" aria-label={tr("Session length")}>{tr([15, 25, 50].map(min => <button key={min} aria-pressed={focus.duration === min * 60} className={focus.duration === min * 60 ? 'active' : ''} onClick={() => choose(min)}>{tr(min)}{tr(" min")}</button>))}</div><div className={`timer-stage ${focus.running ? 'running' : ''}`}><div className="timer-orbit" style={{
            '--progress': `${(1 - remaining / focus.duration) * 100}%`
          }} /><Blue pose="read" celebrate={celebrate} className="timer-blue" /><span className="timer-status">{tr(celebrate ? 'SESSION COMPLETE' : focus.running ? 'JUST YOU AND YOUR NEXT IDEA' : 'READY WHEN YOU ARE')}</span><div className="timer-digits" aria-live="off" role="timer" aria-label={tr(`${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds remaining`)}>{tr(String(Math.floor(remaining / 60)).padStart(2, '0'))}<span>{tr(":")}</span>{tr(String(remaining % 60).padStart(2, '0'))}</div><p>{tr(celebrate ? 'Stretch, drink some water, and enjoy the progress.' : focus.running ? 'You don’t need to do everything. Just this one thing.' : 'Make a little room for focused work.')}</p></div><div className="timer-actions"><button className="icon-button" aria-label={tr("Reset focus timer")} onClick={() => setConfirmReset(true)}><RotateCcw size={20} /></button><Button onClick={toggle}>{tr(focus.running ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />)}{tr(focus.running ? 'Pause session' : remaining < focus.duration && remaining > 0 ? 'Resume session' : celebrate ? 'Start another session' : 'Start focusing')}</Button><button className="icon-button" aria-label={tr(prefs.sound ? 'Mute study sounds' : 'Enable study sounds')} aria-pressed={prefs.sound} onClick={() => setPrefs(p => ({
            ...p,
            sound: !p.sound
          }))}>{tr(prefs.sound ? <Volume2 size={21} /> : <VolumeX size={21} />)}</button></div><div className="focus-task-picker"><label htmlFor="focus-task">{tr("What’s your one thing?")}</label><select id="focus-task" value={focus.task || ''} onChange={e => setFocus(f => ({
            ...f,
            task: e.target.value
          }))}><option value="">{tr("Free study · follow your curiosity")}</option>{tr(homework.filter(t => !t.done).map(t => <option key={t.id} value={t.id}>{tr(COURSES[t.course].name)}{tr(" · ")}{tr(t.title)}</option>))}</select></div><p className="timer-footnote">{tr("The timer continues while you move around Aster. Keep this browser open to hear the finish.")}</p></section><aside className="focus-aside"><div className="panel focus-goal"><span className="tiny-icon tone-mint"><Timer size={23} /></span><h3>{tr("Your focus, adding up.")}</h3><strong>{tr(focusToday)}<span>{tr(" / ")}{tr(prefs.dailyGoal)}{tr(" min")}</span></strong><Progress value={focusToday / prefs.dailyGoal * 100} label={tr("Today's focus goal")} /><p>{tr(focusToday >= prefs.dailyGoal ? 'Your daily goal is in the bag. Make room for a break.' : 'Build towards your daily focus goal.')}</p></div><div className="focus-tips"><span className="eyebrow">{tr("THREE WAYS TO STAY FOCUSED")}</span>{tr([['01', 'Make the task smaller.', 'Pick one page, one problem, or one paragraph.'], ['02', 'Keep distractions out of reach.', 'A quiet tab and a clear desk can help.'], ['03', 'Rest is part of the rhythm.', 'Give your brain a short break afterwards.']].map(([n, title, text]) => <div key={n}><span>{tr(n)}</span><h4>{tr(title)}</h4><p>{tr(text)}</p></div>))}</div></aside></div>{tr(confirmReset && <Modal title={tr("Start with a fresh timer?")} size="small" onClose={() => setConfirmReset(false)}><div className="dialog-content"><p>{tr("This resets the current session. Previously completed focus time stays saved.")}</p><div className="dialog-actions"><Button variant="secondary" onClick={() => setConfirmReset(false)}>{tr("Keep this session")}</Button><Button onClick={reset}>{tr("Reset timer")}</Button></div></div></Modal>)}</>;
}
