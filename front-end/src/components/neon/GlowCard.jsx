import { useT } from "../../i18n.jsx";
import React, { memo, useEffect, useRef } from 'react';
import styles from './Aurora.module.css';
export const GlowCard = memo(function GlowCard({
  children,
  className = '',
  color = 'violet',
  tilt = false,
  label
}) {
  const tr = useT();
  const card = useRef(null),
    frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  function move(event) {
    if (!tilt || event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'calm') return;
    const {
      left,
      top,
      width,
      height
    } = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - left) / width - .5,
      y = (event.clientY - top) / height - .5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      if (!card.current) return;
      card.current.style.setProperty('--tilt-x', `${-y * 8}deg`);
      card.current.style.setProperty('--tilt-y', `${x * 8}deg`);
      card.current.style.setProperty('--shine-x', `${(x + .5) * 100}%`);
      card.current.style.setProperty('--shine-y', `${(y + .5) * 100}%`);
    });
  }
  function reset() {
    cancelAnimationFrame(frame.current);
    card.current?.style.setProperty('--tilt-x', '0deg');
    card.current?.style.setProperty('--tilt-y', '0deg');
  }
  return <section ref={card} aria-label={tr(label)} className={`${styles.glowCard} ${styles[color] || ''} ${tilt ? styles.tilt : ''} ${className}`} onPointerMove={move} onPointerLeave={reset}>{tr(children)}</section>;
});
