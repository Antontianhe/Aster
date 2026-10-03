import { useT } from "../../i18n.jsx";
import React, { memo, useId, useRef, useState } from 'react';
import { BookOpen, Brain, GitMerge, Layers3, Flag, Check, Lock, Sparkles, ArrowUpRight, Zap, Star } from 'lucide-react';
import { lessonUnlocked } from '../../progression.js';
import { requireCourse, requireFunction } from './validation.js';
import styles from './Aurora.module.css';
const STAGES = Object.freeze([{
  title: 'Review key concepts',
  kind: 'Flashcards',
  hint: 'Turn over every card and find your starting point.',
  Icon: BookOpen,
  color: 'cyan',
  x: 47,
  y: 64,
  reward: 'Unlock quick recall'
}, {
  title: 'Check your understanding',
  kind: 'Quick recall',
  hint: 'Choose a question set. Score at least 60% to unlock the next stop.',
  Icon: Brain,
  color: 'violet',
  x: 68,
  y: 216,
  reward: '5 XP · 2 coins per correct answer'
}, {
  title: 'Match concepts',
  kind: 'Match the pairs',
  hint: 'Drag an idea to its meaning, or tap to make a match.',
  Icon: GitMerge,
  color: 'sunset',
  x: 53,
  y: 369,
  reward: '5 XP · 2 coins per correct pair'
}, {
  title: 'Consolidate your learning',
  kind: 'Flashcards',
  hint: 'Revisit the ideas. Explain each one in your own words.',
  Icon: Layers3,
  color: 'mint',
  x: 30,
  y: 522,
  reward: 'Unlock the checkpoint'
}, {
  title: 'Unit checkpoint',
  kind: 'Final checkpoint',
  hint: 'Bring it all together. A score of at least 60% completes this path.',
  Icon: Flag,
  color: 'pink',
  x: 48,
  y: 676,
  reward: '5 XP · 2 coins per correct answer'
}]);
const LessonNode = memo(function LessonNode({
  stage,
  index,
  done,
  locked,
  current,
  onStart,
  previous
}) {
  const tr = useT();
  const [tip, setTip] = useState(false),
    timer = useRef(null),
    longPress = useRef(false),
    id = useId();
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const {
    Icon
  } = stage;
  function beginPress(event) {
    if (event.pointerType === 'mouse') return;
    longPress.current = false;
    timer.current = setTimeout(() => {
      longPress.current = true;
      setTip(true);
    }, 450);
  }
  function endPress() {
    clearTimeout(timer.current);
  }
  function activate() {
    if (longPress.current) {
      longPress.current = false;
      return;
    }
    if (locked) {
      setTip(v => !v);
      return;
    }
    onStart(index);
  }
  return <div className={`${styles.lesson} ${styles[stage.color]} ${locked ? styles.locked : ''} ${current ? styles.current : ''}`} style={{
    left: `${stage.x}%`,
    top: stage.y
  }} onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)} onFocus={() => setTip(true)} onBlur={e => {
    if (!e.currentTarget.contains(e.relatedTarget)) setTip(false);
  }} onKeyDown={e => {
    if (e.key === 'Escape') setTip(false);
  }}>
    {tr(current && <span className={styles.startLabel}><Sparkles size={12} />{tr(" YOUR NEXT STEP")}</span>)}
    <button className={styles.orb} aria-label={tr(`${stage.title}, ${stage.kind}${locked ? ', locked' : done ? ', completed' : ', available'}`)} aria-describedby={tip ? id : undefined} aria-disabled={locked} onClick={activate} onPointerDown={beginPress} onPointerUp={endPress} onPointerCancel={endPress} onPointerLeave={endPress}>
      <span className={styles.orbSurface}><Icon size={31} strokeWidth={2.4} /></span>
      {tr(done ? <span className={styles.nodeCheck}><Check size={15} /></span> : locked ? <span className={styles.nodeLock}><Lock size={12} /></span> : <span className={styles.orbShine} />)}
    </button>
    <div className={styles.nodeCaption}><strong>{tr(stage.title)}</strong><span>{tr(stage.kind)}</span></div>
    {tr(tip && <div id={id} role="tooltip" className={`${styles.nodeTooltip} ${stage.x > 55 ? styles.tipLeft : ''}`}><span>{tr(locked ? 'NEXT UP' : done ? 'COMPLETED' : 'YOUR NEXT SESSION')}</span><strong>{tr(stage.title)}</strong><p>{tr(locked ? `Complete “${previous}” to unlock this lesson.` : stage.hint)}</p><small><Zap size={13} />{tr(stage.reward)}</small></div>)}
  </div>;
});
export const MainTree = memo(function MainTree({
  course,
  completed,
  onStart,
  onResources
}) {
  const tr = useT();
  requireCourse(course);
  requireFunction(onStart, 'onStart');
  requireFunction(onResources, 'onResources');
  if (!Array.isArray(completed) || !completed.every(i => Number.isInteger(i) && i >= 0 && i < 5)) throw new TypeError('Invalid path completion');
  const gradientId = useId(),
    next = STAGES.findIndex((_, i) => !completed.includes(i));
  return <section className={styles.treeCard} aria-label={tr(`${course.name} learning path`)}>
    <div className={styles.treeHeading}><div><span className={styles.kicker}><i />{tr(" YOUR REVISION PATH")}</span><h2>{tr(course.title)}</h2><p>{tr("Build understanding, one session at a time.")}</p></div><span className={styles.pathCount}>{tr(completed.length)}<small>{tr(" / 5")}<br />{tr("STOPS")}</small></span></div>
    <div className={styles.treeScene}>
      <svg className={styles.pathSvg} viewBox="0 0 100 760" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#37dcf8" /><stop offset=".3" stopColor="#ab73ff" /><stop offset=".55" stopColor="#ffab71" /><stop offset=".75" stopColor="#64efb3" /><stop offset="1" stopColor="#ed87f2" /></linearGradient></defs><path className={styles.pathGlow} d="M47 64 C47 144 68 136 68 216 S70 305 53 369 S24 436 30 522 S27 617 48 676" stroke={`url(#${gradientId})`} /><path className={styles.pathLine} d="M47 64 C47 144 68 136 68 216 S70 305 53 369 S24 436 30 522 S27 617 48 676" stroke={`url(#${gradientId})`} /></svg>
      <span className={`${styles.spaceStar} ${styles.starA}`} aria-hidden="true">{tr("✦")}</span><span className={`${styles.spaceStar} ${styles.starB}`} aria-hidden="true">{tr("✧")}</span><span className={`${styles.spaceStar} ${styles.starC}`} aria-hidden="true">{tr("✦")}</span>
      <span className={styles.orbitPlanet} aria-hidden="true" /><span className={styles.miniPlanet} aria-hidden="true" />
      <div className={styles.pathNote}><Star size={16} /><p>{tr("Understanding builds")}<br /><strong>{tr("with consistent practice.")}</strong></p></div>
      {tr(STAGES.map((stage, index) => <LessonNode key={stage.kind + index} stage={stage} index={index} done={completed.includes(index)} locked={!lessonUnlocked(completed, index)} current={index === next} onStart={onStart} previous={STAGES[index - 1]?.title} />))}
    </div>
    <footer className={styles.treeFooter}><span><span className={styles.liveDot} />{tr(" Progress at your own pace.")}</span><button onClick={onResources}>{tr("Class materials ")}<ArrowUpRight size={15} /></button></footer>
  </section>;
});
