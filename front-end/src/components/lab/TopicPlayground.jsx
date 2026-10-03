import { useT } from "../../i18n.jsx";
import React, { useId, useMemo, useState } from 'react';
import { RotateCcw, ArrowRight, Eye, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { quadraticValue, quadraticFeatures } from '../../learning.js';
import { useApp } from '../../context.jsx';
import { Button } from '../UI.jsx';
import s from './StudyLab.module.css';
import v from './Playground.module.css';
export function TopicPlayground() {
  const tr = useT();
  const {
    saveLabSession,
    playTone
  } = useApp();
  const [a, setA] = useState(1),
    [b, setB] = useState(0),
    [c, setC] = useState(0),
    [prediction, setPrediction] = useState(null),
    [choice, setChoice] = useState(null),
    [revealed, setRevealed] = useState(false);
  const id = useId();
  const features = useMemo(() => quadraticFeatures(a, b, c), [a, b, c]);
  const path = useMemo(() => Array.from({
    length: 201
  }, (_, i) => {
    const x = -6 + i * .06,
      y = quadraticValue(a, b, c, x);
    return `${i ? 'L' : 'M'}${(280 + x * 38).toFixed(2)},${(200 - y * 16).toFixed(2)}`;
  }).join(' '), [a, b, c]);
  function reset() {
    setA(1);
    setB(0);
    setC(0);
    setPrediction(null);
    setChoice(null);
    setRevealed(false);
  }
  function predict() {
    setPrediction({
      a,
      b,
      c,
      nextC: c + 2
    });
    setChoice(null);
    setRevealed(false);
  }
  function reveal() {
    if (choice === null || !prediction || revealed) return;
    setC(prediction.nextC);
    setRevealed(true);
    playTone(choice === 'up');
    saveLabSession({
      kind: 'playground',
      title: 'Predict a vertical graph shift',
      subject: 'maths',
      choice,
      correct: choice === 'up',
      parameters: prediction
    });
  }
  const round = n => Number(n.toFixed(2));
  return <div className={s.labBody}><span className={s.eyebrow}>{tr("TOPIC PLAYGROUND · QUADRATIC FUNCTIONS")}</span><h2>{tr("Change a value. Test an idea.")}</h2><p>{tr("Explore y = ax² + bx + c. This is optional algebra extension; check your current course before treating it as exam content.")}</p><div className={v.equation} aria-live="polite">{tr("y = ")}<strong>{tr(a)}</strong>{tr("x² ")}{tr(b < 0 ? '−' : '+')} <strong>{tr(Math.abs(b))}</strong>{tr("x ")}{tr(c < 0 ? '−' : '+')} <strong>{tr(Math.abs(c))}</strong></div><div className={v.graph}><svg viewBox="0 0 560 400" role="img" aria-label={tr(`Graph of y equals ${a} x squared plus ${b} x plus ${c}. Window x from minus 6 to 6 and y from minus 10 to 10.`)}><defs><clipPath id={id}><rect x="35" y="24" width="490" height="352" /></clipPath><linearGradient id={id + 'g'}><stop stopColor="#b780ff" /><stop offset="1" stopColor="#76e1d8" /></linearGradient></defs><g className={v.gridLines}>{tr(Array.from({
            length: 13
          }, (_, i) => <line key={'v' + i} x1={52 + i * 38} x2={52 + i * 38} y1="40" y2="360" />))}{tr(Array.from({
            length: 11
          }, (_, i) => <line key={'h' + i} x1="52" x2="508" y1={40 + i * 32} y2={40 + i * 32} />))}</g><g className={v.axes}><line x1="44" x2="518" y1="200" y2="200" /><line x1="280" x2="280" y1="29" y2="371" /></g><g className={v.labels}>{tr([-6, -4, -2, 2, 4, 6].map(x => <text key={x} x={280 + x * 38} y="219" textAnchor="middle">{tr(x)}</text>))}{tr([-10, -6, -2, 2, 6, 10].map(y => <text key={y} x="268" y={204 - y * 16} textAnchor="end">{tr(y)}</text>))}<text x="530" y="204">{tr("x")}</text><text x="285" y="21">{tr("y")}</text></g><g clipPath={`url(#${id})`}><path d={path} fill="none" stroke={`url(#${id + 'g'})`} strokeWidth="3.5" vectorEffect="non-scaling-stroke" />{tr(features.vertex && <circle cx={280 + features.vertex[0] * 38} cy={200 - features.vertex[1] * 16} r="5" fill="#e4ceff" />)}</g></svg>{tr(prediction && !revealed && <div className={v.graphMask}><Eye size={27} /><strong>{tr("Predict before revealing.")}</strong><span>{tr("The new graph is hidden until you commit.")}</span></div>)}</div><div className={v.sliders}>{tr([['a', a, setA, -3, 3, .5], ['b', b, setB, -5, 5, .5], ['c', c, setC, -5, 7, .5]].map(([label, value, set, min, max, step]) => <label key={label}><span>{tr(label)}<strong>{tr(value)}</strong></span><input aria-label={tr(`Coefficient ${label}`)} type="range" min={min} max={max} step={step} value={value} disabled={Boolean(prediction && !revealed)} onChange={e => {
          set(Number(e.target.value));
          setPrediction(null);
          setChoice(null);
          setRevealed(false);
        }} /></label>))}</div><div className={v.features}><span>{tr(features.type === 'quadratic' ? <>{tr("Vertex ")}<strong>{tr("(")}{tr(round(features.vertex[0]))}{tr(", ")}{tr(round(features.vertex[1]))}{tr(")")}</strong></> : <>{tr("a = 0: ")}<strong>{tr(features.type)}{tr(" function")}</strong></>)}</span><span>{tr(features.roots.length ? <>{tr("Real root")}{tr(features.roots.length > 1 ? 's' : '')} <strong>{tr(features.roots.map(round).join(', '))}</strong></> : <strong>{tr(a === 0 && b === 0 && c === 0 ? 'Every x is a root' : 'No real roots')}</strong>)}</span></div><div className={s.labActions}><Button variant="secondary" onClick={reset}><RotateCcw size={15} />{tr("Reset graph")}</Button><Button disabled={c > 5 || Boolean(prediction && !revealed)} onClick={predict}>{tr("Predict c + 2 ")}<ArrowRight size={15} /></Button></div>{tr(prediction && <div className={s.labPrompt}><span>{tr("PREDICTION CHECK")}</span><p>{tr("If c changes from ")}{tr(prediction.c)}{tr(" to ")}{tr(prediction.nextC)}{tr(", what happens to the graph?")}</p><div className={s.choiceButtons}>{tr([['up', 'Every point moves up by 2.'], ['down', 'Every point moves down by 2.'], ['wide', 'The graph becomes wider.']].map(([key, label]) => <button key={key} disabled={revealed} aria-pressed={choice === key} onClick={() => setChoice(key)}>{tr(label)}</button>))}</div>{tr(!revealed ? <Button disabled={choice === null} onClick={reveal}>{tr("Reveal the new graph ")}<Eye size={15} /></Button> : <div className={s.modelAnswer} role="status"><span>{tr(choice === 'up' ? 'PREDICTION CONFIRMED' : 'AN IDEA TO REVISIT')}</span><p>{tr("Adding 2 to c adds 2 to y for every x. The shape and horizontal position stay the same; the curve moves up by 2.")}</p></div>)}</div>)}<details className={v.valueTable}><summary>{tr("Accessible table of values")}</summary><table><thead><tr><th>{tr("x")}</th>{tr([-2, -1, 0, 1, 2].map(x => <th key={x}>{tr(x)}</th>))}</tr></thead><tbody><tr><th>{tr("y")}</th>{tr([-2, -1, 0, 1, 2].map(x => <td key={x}>{tr(round(quadraticValue(a, b, c, x)))}</td>))}</tr></tbody></table></details><a className={s.sourceLink} href="https://openstax.org/books/algebra-and-trigonometry-2e/pages/5-1-quadratic-functions" target="_blank" rel="noopener noreferrer">{tr("Explore quadratic functions with OpenStax ")}<ArrowUpRight size={13} /></a></div>;
}
