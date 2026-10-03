import { useT } from "../../i18n.jsx";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, X, RotateCcw, Shuffle, GripVertical, Lightbulb } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { shuffled } from '../../study.js';
import { makeRecall, makeVerification, wordCards, scrambleAnswer, normalizeAnswer, NUMBER_ROUNDS, isAscending, uniqueAnswerCards } from '../../arcade.js';
import { Button } from '../UI.jsx';
import g from './Arcade.module.css';
function Feedback({
  correct,
  children
}) {
  const tr = useT();
  return <div className={`${g.feedback} ${correct ? g.correct : g.incorrect}`} role="status">{tr(correct ? <CheckCircle2 size={20} /> : <Lightbulb size={20} />)}<div><strong>{tr(correct ? 'Correct.' : 'Review the answer.')}</strong><p>{tr(children)}</p></div></div>;
}
function Step({
  index,
  total,
  children
}) {
  const tr = useT();
  return <><div className={g.step}><span>{tr("CHALLENGE ")}{tr(index + 1)}{tr(" OF ")}{tr(total)}</span><div><span style={{
          width: (index + 1) / total * 100 + '%'
        }} /></div></div>{tr(children)}</>;
}
export function RecallGame({
  deck,
  onFinish
}) {
  const tr = useT();
  const {
    playTone
  } = useApp();
  const [questions] = useState(() => makeRecall(deck)),
    [index, setIndex] = useState(0),
    [choice, setChoice] = useState(null),
    [checked, setChecked] = useState(false),
    [score, setScore] = useState(0);
  const question = questions[index];
  function submit() {
    if (choice === null) return;
    if (!checked) {
      const right = question.choices[choice].correct;
      setScore(v => v + Number(right));
      playTone(right);
      setChecked(true);
    } else if (index === questions.length - 1) onFinish({
      score,
      total: questions.length,
      label: 'questions recalled'
    });else {
      setIndex(i => i + 1);
      setChoice(null);
      setChecked(false);
    }
  }
  return <Step index={index} total={questions.length}>{tr(deck.custom && <p className={g.hint}>{tr("Choose the answer saved in this user-added deck. Check its source if an answer seems ambiguous.")}</p>)}<h2 className={g.question}>{tr(question.question)}</h2><div className={g.choices}>{tr(question.choices.map((c, i) => <button key={c.text} disabled={checked} aria-pressed={choice === i} className={`${choice === i ? g.chosen : ''} ${checked && c.correct ? g.rightChoice : ''} ${checked && choice === i && !c.correct ? g.wrongChoice : ''}`} onClick={() => setChoice(i)}><span>{tr(i + 1)}</span>{tr(c.text)}{tr(checked && c.correct && <Check size={17} />)}</button>))}</div>{tr(checked && <Feedback correct={question.choices[choice].correct}>{tr(question.answer)}{tr(". ")}{tr(question.explanation)}</Feedback>)}<Button onClick={submit} disabled={choice === null}>{tr(checked ? index === questions.length - 1 ? 'Finish challenge' : 'Next question' : 'Check answer')}<ArrowRight size={16} /></Button></Step>;
}
export function VerificationGame({
  deck,
  onFinish
}) {
  const tr = useT();
  const {
    playTone
  } = useApp();
  const [rounds] = useState(() => makeVerification(deck)),
    [index, setIndex] = useState(0),
    [choice, setChoice] = useState(null),
    [score, setScore] = useState(0);
  const round = rounds[index];
  const checked = choice !== null;
  function select(value) {
    if (checked) return;
    const right = value === round.same;
    playTone(right);
    setChoice(value);
    setScore(v => v + Number(right));
  }
  function next() {
    if (index === rounds.length - 1) onFinish({
      score,
      total: rounds.length,
      label: 'pairs verified'
    });else {
      setIndex(i => i + 1);
      setChoice(null);
    }
  }
  return <Step index={index} total={rounds.length}><p className={g.hint}>{tr("Does this answer match the one saved for this question?")}</p><h2 className={g.question}>{tr(round.card.question)}</h2><div className={g.proposed}><span>{tr("PROPOSED ANSWER")}</span><strong>{tr(round.answer)}</strong></div><div className={g.binary}><button disabled={checked} onClick={() => select(true)}><CheckCircle2 size={24} />{tr("Matches the deck")}</button><button disabled={checked} onClick={() => select(false)}><X size={24} />{tr("Does not match")}</button></div>{tr(checked && <><Feedback correct={choice === round.same}>{tr("Saved answer: ")}{tr(round.card.answer)}{tr(". ")}{tr(round.card.explanation)}</Feedback><Button onClick={next}>{tr(index === rounds.length - 1 ? 'Finish challenge' : 'Next pair')}<ArrowRight size={16} /></Button></>)}</Step>;
}
export function WordGame({
  deck,
  onFinish
}) {
  const tr = useT();
  const {
    playTone
  } = useApp();
  const [rounds] = useState(() => shuffled(wordCards(deck)).slice(0, 5).map(c => ({
      ...c,
      scrambled: scrambleAnswer(c.answer)
    }))),
    [index, setIndex] = useState(0),
    [value, setValue] = useState(''),
    [checked, setChecked] = useState(false),
    [right, setRight] = useState(false),
    [score, setScore] = useState(0);
  const input = useRef(null),
    round = rounds[index];
  useEffect(() => {
    input.current?.focus();
  }, [index]);
  function submit(e) {
    e.preventDefault();
    if (!value.trim() || checked) return;
    const correct = normalizeAnswer(value) === normalizeAnswer(round.answer);
    setRight(correct);
    setChecked(true);
    playTone(correct);
    if (correct) setScore(v => v + 1);
  }
  function next() {
    if (index === rounds.length - 1) onFinish({
      score,
      total: rounds.length,
      label: 'answers unscrambled'
    });else {
      setIndex(i => i + 1);
      setValue('');
      setChecked(false);
    }
  }
  if (!round) return <p className={g.hint}>{tr("This deck needs answers with at least three letters for Word lab. Choose another deck.")}</p>;
  return <Step index={index} total={rounds.length}><h2 className={g.question}>{tr(round.question)}</h2><div className={g.scrambled} aria-label={tr(`Scrambled answer: ${round.scrambled}`)}>{tr(round.scrambled)}</div><form onSubmit={submit} className={g.wordForm}><label htmlFor="word-answer">{tr("Unscramble the saved answer")}</label><input ref={input} id="word-answer" value={value} onChange={e => setValue(e.target.value)} autoComplete="off" maxLength={100} disabled={checked} placeholder={tr("Type your answer…")} /><p className={g.hint}>{tr("Keep spaces and punctuation; capitalization does not matter.")}</p>{tr(!checked && <Button disabled={!value.trim()} type="submit">{tr("Check answer ")}<ArrowRight size={16} /></Button>)}</form>{tr(checked && <><Feedback correct={right}>{tr(round.answer)}{tr(". ")}{tr(round.explanation)}</Feedback><Button onClick={next}>{tr(index === rounds.length - 1 ? 'Finish challenge' : 'Next word')}<ArrowRight size={16} /></Button></>)}</Step>;
}
export function MemoryGame({
  deck,
  onFinish
}) {
  const tr = useT();
  const {
    playTone
  } = useApp();
  const [cards] = useState(() => shuffled(shuffled(uniqueAnswerCards(deck.cards)).slice(0, 4).flatMap((c, i) => [{
      id: `q${i}`,
      pair: i,
      kind: 'question',
      text: c.question
    }, {
      id: `a${i}`,
      pair: i,
      kind: 'answer',
      text: c.answer
    }]))),
    [open, setOpen] = useState([]),
    [matched, setMatched] = useState([]),
    [moves, setMoves] = useState(0),
    [locked, setLocked] = useState(false),
    [message, setMessage] = useState('Reveal a question and its answer.');
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  function reveal(card) {
    if (locked || open.includes(card.id) || matched.includes(card.pair)) return;
    const next = [...open, card.id];
    setOpen(next);
    if (next.length === 2) {
      const first = cards.find(c => c.id === next[0]);
      const correct = first.pair === card.pair;
      setMoves(v => v + 1);
      setLocked(true);
      playTone(correct);
      setMessage(correct ? 'Pair found.' : 'Different pairs. Take another look.');
      timer.current = setTimeout(() => {
        if (correct) setMatched(v => [...v, card.pair]);
        setOpen([]);
        setLocked(false);
      }, correct ? 400 : 1400);
    }
  }
  const finished = matched.length === 4;
  return <><div className={g.gameTop}><span>{tr(matched.length)}{tr(" / 4 pairs")}</span><span>{tr(moves)}{tr(" turns")}</span></div><p className={g.hint}>{tr("Match each question to its answer. Cards stay visible briefly after each turn.")}</p><div className={g.memoryGrid}>{tr(cards.map((card, i) => {
        const shown = open.includes(card.id) || matched.includes(card.pair);
        return <button key={card.id} onClick={() => reveal(card)} disabled={locked || matched.includes(card.pair)} className={`${g.memoryCard} ${shown ? g.revealed : ''} ${matched.includes(card.pair) ? g.paired : ''}`} aria-label={tr(shown ? `${card.kind}: ${card.text}` : `Reveal card ${i + 1}`)}><span className={g.memoryInner}><span className={g.memoryBack} aria-hidden={shown}><Shuffle size={23} /><small>{tr(String(i + 1).padStart(2, '0'))}</small></span><span className={g.memoryFace} aria-hidden={!shown}><small>{tr(card.kind)}</small><strong>{tr(card.text)}</strong>{tr(matched.includes(card.pair) && <Check size={15} />)}</span></span></button>;
      }))}</div><p className={g.gameMessage} role="status">{tr(message)}</p>{tr(finished && <><p className={g.hint}>{tr("All four pairs found in ")}{tr(moves)}{tr(" turns. Memory rewards completion; turns track your efficiency.")}</p><Button onClick={() => onFinish({
        score: 4,
        total: 4,
        label: `pairs found in ${moves} turns`,
        turns: moves
      })}>{tr("Finish challenge ")}<ArrowRight size={16} /></Button></>)}</>;
}
export function ConnectGame({
  deck,
  onFinish
}) {
  const tr = useT();
  const {
    playTone
  } = useApp();
  const [pairs] = useState(() => shuffled(uniqueAnswerCards(deck.cards)).slice(0, 4)),
    [answers] = useState(() => shuffled(pairs)),
    [selected, setSelected] = useState(null),
    [matched, setMatched] = useState([]),
    [mistakes, setMistakes] = useState([]),
    [message, setMessage] = useState('Choose a prompt, then its answer. You can also drag a prompt onto an answer.');
  function connect(target, id = selected) {
    if (!id || matched.includes(target) || matched.includes(id)) return;
    const correct = target === id;
    playTone(correct);
    if (correct) {
      setMatched(v => [...v, target]);
      setSelected(null);
      setMessage('Connected.');
    } else {
      setMistakes(v => [...new Set([...v, id])]);
      setMessage('These do not belong together. Try another answer.');
    }
  }
  return <><div className={g.gameTop}><span>{tr(matched.length)}{tr(" / 4 connected")}</span><span>{tr("Drag or tap")}</span></div><p className={g.hint}>{tr("Match the saved prompt-and-answer pairs in your deck.")}</p><div className={g.connectGrid}><div>{tr(pairs.map(card => <button draggable={!matched.includes(card.id)} onDragStart={e => {
          e.dataTransfer.setData('text/plain', card.id);
          e.dataTransfer.effectAllowed = 'move';
          setSelected(card.id);
        }} key={card.id} disabled={matched.includes(card.id)} aria-pressed={selected === card.id} className={`${selected === card.id ? g.chosen : ''} ${matched.includes(card.id) ? g.paired : ''}`} onClick={() => setSelected(card.id)}><GripVertical size={16} /><span>{tr(card.question)}</span>{tr(matched.includes(card.id) && <Check size={15} />)}</button>))}</div><div>{tr(answers.map(card => <button key={card.id} disabled={matched.includes(card.id)} className={matched.includes(card.id) ? g.paired : ''} onDragOver={e => e.preventDefault()} onDrop={e => {
          e.preventDefault();
          const id = e.dataTransfer.getData('text/plain');
          if (pairs.some(c => c.id === id)) connect(card.id, id);
        }} onClick={() => connect(card.id)}>{tr(card.answer)}{tr(matched.includes(card.id) && <Check size={15} />)}</button>))}</div></div><p className={g.gameMessage} role="status">{tr(message)}</p>{tr(matched.length === 4 && <Button onClick={() => onFinish({
      score: 4 - mistakes.length,
      total: 4,
      label: 'pairs matched on the first attempt'
    })}>{tr("Finish challenge ")}<ArrowRight size={16} /></Button>)}</>;
}
export function OrderGame({
  onFinish
}) {
  const tr = useT();
  const {
    playTone
  } = useApp();
  const [rounds] = useState(() => shuffled(NUMBER_ROUNDS).map(items => shuffled(items))),
    [index, setIndex] = useState(0),
    [order, setOrder] = useState([]),
    [checked, setChecked] = useState(false),
    [score, setScore] = useState(0),
    [right, setRight] = useState(false);
  const options = rounds[index];
  function check() {
    const correct = isAscending(order);
    setRight(correct);
    setChecked(true);
    playTone(correct);
    if (correct) setScore(v => v + 1);
  }
  function next() {
    if (index === rounds.length - 1) onFinish({
      score,
      total: rounds.length,
      label: 'sequences ordered'
    });else {
      setIndex(i => i + 1);
      setOrder([]);
      setChecked(false);
    }
  }
  return <Step index={index} total={rounds.length}><h2 className={g.question}>{tr("Build an ascending sequence.")}</h2><p className={g.hint}>{tr("Tap the values from smallest to largest. Remember: −2² means −(2²), while (−2)² squares the whole negative number.")}</p><div className={g.orderSlots}>{tr([0, 1, 2, 3].map(i => <span key={i}>{tr(order[i]?.label || <small>{tr(i + 1)}</small>)}</span>))}</div><div className={g.numberOptions}>{tr(options.map(item => <button disabled={checked || order.includes(item)} key={item.label} onClick={() => setOrder(v => [...v, item])}>{tr(item.label)}</button>))}</div>{tr(!checked && <div className={g.gameActions}><Button variant="secondary" disabled={!order.length} onClick={() => setOrder([])}><RotateCcw size={15} />{tr("Reset order")}</Button><Button disabled={order.length !== 4} onClick={check}>{tr("Check sequence ")}<ArrowRight size={16} /></Button></div>)}{tr(checked && <><Feedback correct={right}>{tr([...options].sort((a, b) => a.value - b.value).map(i => i.label).join(' < '))}</Feedback><Button onClick={next}>{tr(index === rounds.length - 1 ? 'Finish challenge' : 'Next sequence')}<ArrowRight size={16} /></Button></>)}</Step>;
}
