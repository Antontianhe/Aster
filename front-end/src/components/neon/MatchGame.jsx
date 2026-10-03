import { useT } from "../../i18n.jsx";
import React, { useMemo, useRef, useState } from 'react';
import { CheckCircle2, ArrowRight, GripVertical, Link2, RotateCcw } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { COURSES, shuffled } from '../../study.js';
import { Modal, Button, Blue, SubjectTag } from '../UI.jsx';
import { requireCourse } from './validation.js';
import styles from './Aurora.module.css';
export function MatchGame({
  subject,
  onClose
}) {
  const tr = useT();
  const {
      recordReview,
      playTone
    } = useApp(),
    course = COURSES[subject];
  requireCourse(course);
  const pairs = useMemo(() => course.notes.slice(0, 3).map(([term, definition], id) => ({
    id,
    term,
    definition: definition.match(/^.*?[.!?](?:\s|$)/)?.[0].trim() || definition
  })), [course]);
  const definitions = useMemo(() => shuffled(pairs), [pairs]);
  const [selected, setSelected] = useState(null),
    [matched, setMatched] = useState([]),
    [feedback, setFeedback] = useState(null),
    [dragging, setDragging] = useState(null),
    [over, setOver] = useState(null),
    [exit, setExit] = useState(false);
  const awarded = useRef(false),
    started = useRef(Date.now());
  const done = matched.length === pairs.length;
  if (pairs.length !== 3) throw new Error('Three idea pairs are needed for this activity.');
  function match(target, source = selected) {
    if (source === null || matched.includes(source) || matched.includes(target) || !pairs.some(p => p.id === source)) return;
    const correct = source === target;
    playTone(correct);
    setOver(null);
    setDragging(null);
    setFeedback({
      correct,
      message: correct ? 'Correct match. Keep going.' : 'Not quite connected yet. Read the idea, then try another meaning.'
    });
    if (correct) {
      const next = [...matched, source];
      setMatched(next);
      setSelected(null);
      if (next.length === pairs.length && !awarded.current) {
        awarded.current = true;
        recordReview(subject, 3, 3, Math.max(1, Math.round((Date.now() - started.current) / 60000)), 'match');
      }
    }
  }
  function drop(event, id) {
    event.preventDefault();
    const raw = event.dataTransfer.getData('text/plain');
    if (!/^\d+$/.test(raw)) return;
    match(id, Number(raw));
  }
  return <><Modal title={tr(`${course.name} · connect the dots`)} size="large" className={`quiz-dialog ${feedback ? feedback.correct ? 'ambient-success' : 'ambient-error' : ''}`} onClose={() => done ? onClose() : setExit(true)}>
    {tr(done ? <div className="review-result"><Blue celebrate className="result-blue" /><span className="eyebrow">{tr("EVERYTHING IS CONNECTED.")}</span><h2>{tr("All concepts matched.")}</h2><p>{tr("You matched every concept with its meaning.")}</p><div className="result-metrics"><div><strong>{tr("3")}<small>{tr(" / 3")}</small></strong><span>{tr("Pairs matched")}</span></div><div><strong>{tr("+15")}</strong><span>{tr("Learning XP")}</span></div><div><strong>{tr("+10")}</strong><span>{tr("Gems earned")}</span></div></div><Button className="full" onClick={onClose}>{tr("Back to your dashboard ")}<ArrowRight size={16} /></Button></div> : <>
      <div className={styles.matchIntro}><SubjectTag id={subject} /><span>{tr(matched.length)}{tr(" / 3 connected")}</span><h2>{tr("Connect concepts with their meanings.")}</h2><p>{tr("Drag a concept onto its meaning. Or select a concept, then select its match.")}</p></div>
      <div className={styles.matchBoard}><div className={styles.matchTerms}><span className={styles.matchLabel}>{tr("THE IDEA")}</span>{tr(pairs.map(pair => <button key={pair.id} draggable={!matched.includes(pair.id)} disabled={matched.includes(pair.id)} aria-pressed={selected === pair.id} className={`${styles.matchTerm} ${selected === pair.id ? styles.selectedTerm : ''} ${matched.includes(pair.id) ? styles.matched : ''} ${dragging === pair.id ? styles.dragging : ''}`} onClick={() => {
              setSelected(pair.id);
              setFeedback(null);
            }} onDragStart={e => {
              e.dataTransfer.setData('text/plain', String(pair.id));
              e.dataTransfer.effectAllowed = 'move';
              setSelected(pair.id);
              setDragging(pair.id);
            }} onDragEnd={() => {
              setDragging(null);
              setOver(null);
            }}><GripVertical size={17} /><strong>{tr(pair.term)}</strong>{tr(matched.includes(pair.id) ? <CheckCircle2 size={18} /> : <Link2 size={16} />)}</button>))}</div>
      <div className={styles.matchDefinitions}><span className={styles.matchLabel}>{tr("THE MEANING")}</span>{tr(definitions.map(pair => <button key={pair.id} disabled={matched.includes(pair.id)} aria-label={tr(`Match meaning: ${pair.definition}`)} className={`${styles.matchDefinition} ${matched.includes(pair.id) ? styles.matched : ''} ${over === pair.id ? styles.dropTarget : ''}`} onClick={() => match(pair.id)} onDragOver={e => {
              if (!matched.includes(pair.id)) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setOver(pair.id);
              }
            }} onDragLeave={() => setOver(null)} onDrop={e => drop(e, pair.id)}>{tr(pair.definition)}{tr(matched.includes(pair.id) && <CheckCircle2 size={18} />)}</button>))}</div></div>
      <footer className={`quiz-feedback ${feedback ? feedback.correct ? 'success' : 'learn' : ''}`}><div role="status" aria-live="polite"><h3>{tr(feedback ? feedback.correct ? 'Correct match.' : 'Try another match.' : selected !== null ? `Match “${pairs[selected].term}”` : 'Pick an idea to begin.')}</h3><p>{tr(feedback?.message || 'Use Tab and Enter to make matches with a keyboard.')}</p></div>{tr(selected !== null && <Button variant="secondary" onClick={() => {
            setSelected(null);
            setFeedback(null);
          }}><RotateCcw size={16} />{tr("Clear selection")}</Button>)}</footer>
    </>)}
  </Modal>{tr(exit && <Modal title={tr("Leave this activity?")} onClose={() => setExit(false)} size="small"><div className="dialog-content"><p>{tr("This unfinished match activity will start over. Completed progress stays saved.")}</p><div className="dialog-actions"><Button variant="secondary" onClick={onClose}>{tr("Leave activity")}</Button><Button onClick={() => setExit(false)}>{tr("Keep connecting")}</Button></div></div></Modal>)}</>;
}
