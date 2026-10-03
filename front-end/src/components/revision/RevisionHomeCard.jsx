import React, { useMemo } from 'react';
import { ArrowRight, CalendarClock, ChartNoAxesCombined, NotebookPen } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { useT } from '../../i18n.jsx';
import { revisionQueue } from '../../revision.js';
import s from './Revision.module.css';

export default function RevisionHomeCard({ className = '' }) {
  const tr = useT(), { revisionSchedule, now, navigate } = useApp();
  const due = useMemo(() => revisionQueue(revisionSchedule, { now }).length, [revisionSchedule, now]);
  return <section className={`${s.homeCard} ${className}`}><div><span className={s.kicker}>{tr('YOUR NEXT SMALL STEP')}</span><h2>{tr('Keep the ideas that click.')}</h2><p>{due ? `${due} ${tr(due===1?'question ready to revisit':'questions ready to revisit')}` : tr('A review queue, clear insights, and a notebook for your own explanations.')}</p></div><div>{[['review', 'Review queue', CalendarClock], ['insights', 'Study insights', ChartNoAxesCombined], ['notebook', 'Study notebook', NotebookPen]].map(([tab, label, Icon]) => <button key={tab} onClick={() => navigate(`revision?tab=${tab}`)}><Icon size={19}/><span>{tr(label)}</span><ArrowRight size={16}/></button>)}</div></section>;
}
