import { useT } from "../../i18n.jsx";
import React, { useEffect, useRef } from 'react';
import styles from './Aurora.module.css';

// Canvas avoids hundreds of animated DOM nodes. Stop on completion, reduced motion,
// hidden tabs, unmount and viewport changes; cap pixel density and frame delta.
export function RewardBurst({
  event,
  calm = false
}) {
  const tr = useT();
  const ref = useRef(null);
  useEffect(() => {
    if (!event || calm || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = ref.current,
      ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0,
      particles = [],
      last = 0,
      age = 0,
      stopped = false;
    const w = innerWidth,
      h = innerHeight,
      dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    try {
      canvas.showPopover();
    } catch {}
    const colors = ['#9b7bff', '#4de8ff', '#ff73c2', '#ffbd59', '#77ffb4'];
    for (let i = 0; i < (event.tier ? 130 : 85); i++) particles.push({
      x: w * (i % 2 ? .15 : .85),
      y: h * .6,
      vx: (Math.random() - .5) * 520,
      vy: -250 - Math.random() * 500,
      r: Math.random() * Math.PI,
      size: 4 + Math.random() * 5,
      spin: (Math.random() - .5) * 7,
      color: colors[i % colors.length],
      star: i % 6 === 0
    });
    function stop() {
      stopped = true;
      cancelAnimationFrame(frame);
      ctx.clearRect(0, 0, w, h);
      try {
        canvas.hidePopover();
      } catch {}
    }
    function draw(time) {
      if (stopped) return;
      const dt = last ? Math.min((time - last) / 1000, .035) : .016;
      last = time;
      age += dt;
      ctx.clearRect(0, 0, w, h);
      particles = particles.filter(p => p.y < h + 30);
      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 420 * dt;
        p.r += p.spin * dt;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, Math.min(1, 4.5 - age));
        ctx.fillStyle = p.color;
        if (p.star) {
          ctx.beginPath();
          for (let k = 0; k < 10; k++) {
            const a = k * Math.PI / 5 - Math.PI / 2,
              r = k % 2 ? p.size * .45 : p.size;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();
        } else ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .65);
        ctx.restore();
      }
      if (age < 4.5 && particles.length) frame = requestAnimationFrame(draw);else stop();
    }
    const visibility = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('resize', stop);
    frame = requestAnimationFrame(draw);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('resize', stop);
    };
  }, [event, calm]);
  return <canvas ref={ref} popover="manual" className={styles.particles} aria-hidden="true" />;
}
