import { useT } from "../../i18n.jsx";
import React from 'react';
import styles from './Aurora.module.css';
export function NeonSkeleton() {
  const tr = useT();
  return <aside className={styles.rail} role="status" aria-label={tr("Loading study statistics")} aria-busy="true">{tr([0, 1, 2].map(n => <div key={n} className={styles.skeleton}><span /><span /><span /><span /></div>))}<span className={styles.srOnly}>{tr("Loading your progress…")}</span></aside>;
}
