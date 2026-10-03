import { useT } from "../../i18n.jsx";
import React, { memo, useId } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { requireFunction, requireText } from './validation.js';
import styles from './Aurora.module.css';
export const FlashcardFace = memo(function FlashcardFace({
  title,
  explanation,
  flipped,
  onFlip
}) {
  const tr = useT();
  const id = useId();
  requireText(title, 'Flashcard title');
  requireText(explanation, 'Flashcard explanation');
  requireFunction(onFlip, 'onFlip');
  if (typeof flipped !== 'boolean') throw new TypeError('Flipped must be a boolean');
  return <button className={`${styles.flipCard} ${flipped ? styles.isFlipped : ''}`} aria-label={tr(flipped ? 'Show the question' : 'Reveal the answer')} aria-describedby={id + (flipped ? '-meaning' : '-title')} onClick={onFlip}>
    <span className={styles.flipInner}>
      <span className={`${styles.flipFace} ${styles.flipFront}`} aria-hidden={flipped}><Sparkles size={27} /><span className={styles.kicker}>{tr("ACTIVE RECALL")}</span><strong id={id + '-title'}>{tr(title)}</strong><small><RotateCcw size={15} />{tr("Tap to turn it over")}</small></span>
      <span className={`${styles.flipFace} ${styles.flipBack}`} aria-hidden={!flipped}><span className={styles.kicker}>{tr("ANSWER & EXPLANATION")}</span><span id={id + '-meaning'} className={styles.flipExplanation}>{tr(explanation)}</span><small><RotateCcw size={15} />{tr("Tap to turn back")}</small></span>
    </span>
  </button>;
});
