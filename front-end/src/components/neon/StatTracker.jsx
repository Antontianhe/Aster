import {useApp} from '../../context.jsx';
import {normalizeBuddy} from '../../buddies.js';
import { useT } from "../../i18n.jsx";
import React, { memo, useId, useMemo } from 'react';
import { Flame, Gem, Star, Trophy, ArrowUpRight, Check, Sparkles, Orbit, Target } from 'lucide-react';
import { COURSES, activeStreak, dayKey, shiftDay } from '../../study.js';
import { tierProgress } from '../../progression.js';
import { GlowCard } from './GlowCard.jsx';
import { SubjectIcon } from '../UI.jsx';
import { requireFinite } from './validation.js';
import styles from './Aurora.module.css';
export default memo(function StatTracker({
  progress,
  now,
  onSubject,
  onPractice
}) {
  const tr = useT();
  const {coins}=useApp();
  requireFinite(progress.xp, 'progress.xp');
  requireFinite(progress.gems, 'progress.gems');
  const id = useId(),
    tier = tierProgress(progress.xp),
    today = dayKey(new Date(now));
  const days = useMemo(() => Array.from({
    length: 7
  }, (_, i) => shiftDay(today, i - 6)), [today]);
  const leaders = useMemo(() => Object.entries(COURSES).filter(([, c]) => c.questions.length).map(([id, c]) => ({
    id,
    name: c.name,
    count: progress.attempts[id] || 0,
    best: progress.bestScores[id] || 0
  })).sort((a, b) => b.count - a.count || b.best - a.best).slice(0, 3), [progress.attempts, progress.bestScores]);
  const streak = activeStreak(progress, new Date(now));
  return <aside className={styles.rail} aria-label={tr("Study highlights; swipe to explore on small screens")}>
    <GlowCard color="violet" className={styles.levelCard} tilt label={tr("Your level and learning rewards")}><div className={styles.cardEyebrow}><span>{tr("YOUR PROGRESS")}</span><Sparkles size={16} /></div><div className={styles.levelIdentity}><span className={styles.achievementBadge}><Orbit size={32} /><i /></span><div><small>{tr("LEVEL ")}{tr(1 + Math.floor(progress.xp / 100))}</small><h3>{tr(tier.current.name)}</h3></div></div><div className={styles.xpMeta}><span><ZapIcon /> {tr(progress.xp)}{tr(" XP")}</span><small>{tr(tier.next ? `${tier.remaining} to next tier` : 'Highest tier reached')}</small></div><div className={styles.xpTrack} role="progressbar" aria-label={tr("Progress to next tier")} aria-valuenow={Math.round(tier.percent)} aria-valuemin={0} aria-valuemax={100}><i style={{
          width: `${Math.max(2, tier.percent)}%`
        }} /></div><div className={styles.currencyLine}><span key={coins} className={styles.currencyValue}><Gem size={20} /><strong>{tr(coins)}</strong><small>{tr("Coins")}</small></span><span><Star size={15} />{tr("Keep progressing")}</span></div></GlowCard>
    <GlowCard color="sunset" className={styles.streakCard} label={tr("Your study streak")}><div className={styles.cardEyebrow}><span>{tr("YOUR STUDY STREAK")}</span><Flame size={16} /></div><div className={styles.streakCenter}><svg className={styles.streakFlame} width="54" height="65" viewBox="0 0 24 28" aria-hidden="true"><defs><linearGradient id={id} x1="0" y1="0" x2=".7" y2="1"><stop stopColor="#ff66de" /><stop offset=".45" stopColor="#ff8a48" /><stop offset="1" stopColor="#ffea81" /></linearGradient></defs><path fill={`url(#${id})`} d="M13 0c1 7-5 8-3 13 2-1 4-3 4-6 6 4 10 10 7 15-2 4-6 6-10 6C4 28 0 24 1 18c0-4 3-8 7-11-1 5 0 7 2 7C7 7 14 6 13 0Z" /><path fill="#fff1a7" d="M13 15c0 4-4 4-3 7 1 3 6 3 6 0 1-2-1-5-3-7Z" /></svg><div><strong>{tr(streak)}<span>{tr("day")}{tr(streak === 1 ? '' : 's')}</span></strong><p>{tr(streak ? 'Consistency is adding up.' : 'Start a new streak today.')}</p></div></div><div className={styles.streakDays}>{tr(days.map(day => <div key={day}><span>{tr(new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', {
              weekday: 'narrow'
            }))}</span><span className={progress.studyDays.includes(day) ? styles.activeDay : day === today ? styles.todayDay : ''}>{tr(progress.studyDays.includes(day) ? <Check size={13} /> : day === today ? <i /> : null)}</span></div>))}</div><p className={styles.streakFootnote}>{tr("Complete a review to keep your streak.")}</p></GlowCard>
    <GlowCard color="cyan" className={styles.leaderboard} label={tr("Your subject leaderboard")}><div className={styles.cardEyebrow}><span>{tr("YOUR SUBJECT LEADERBOARD")}</span><Trophy size={17} /></div><h3>{tr("Your most-practised subjects.")}</h3><p>{tr("Your subjects, ranked by completed reviews.")}</p><div className={styles.rankings}>{tr(leaders.map((subject, i) => <button key={subject.id} onClick={() => onSubject(subject.id)}><span className={styles.rank}>{tr(i + 1)}</span><span className={styles.rankIcon}><SubjectIcon id={subject.id} size={18} /></span><span><strong>{tr(subject.name)}</strong><small>{tr(subject.count)}{tr(" reviews · ")}{tr(subject.best)}{tr("% best")}</small></span>{tr(i === 0 ? <Trophy size={15} /> : <ArrowUpRight size={14} />)}</button>))}</div><button className={styles.railLink} onClick={onPractice}>{tr("Start a review ")}<ArrowUpRight size={14} /></button></GlowCard>
    <GlowCard color="mint" className={styles.dailyQuest} label={tr("Your daily review quest")}><span className={styles.questSymbol}><Target size={23} /></span><div><h3>{tr("Today's target")}</h3><p>{tr(progress.activityDate === today && progress.todaySessions > 0 ? 'Target reached. Review complete.' : 'Complete one review session.')}</p></div>{tr(progress.activityDate === today && progress.todaySessions > 0 ? <Check size={20} /> : <button aria-label={tr("Start your daily review")} onClick={onPractice}><ArrowUpRight size={19} /></button>)}</GlowCard>
  </aside>;
});
function ZapIcon() {
  const tr = useT();
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m13 2-9 12h7l-1 8 10-13h-7z" /></svg>;
}
