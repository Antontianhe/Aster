import {storage} from '../../storage.js';
import { useT } from "../../i18n.jsx";
import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowRight, Route, GraduationCap, Check, BookOpen, Compass, Lightbulb, ExternalLink } from 'lucide-react';
import { PageHeading, Button } from '../UI.jsx';
import { ROADMAP, ROADMAP_KEY, ROADMAP_SOURCES, normalizeRoadmap } from '../../roadmap.js';
import { readStored } from '../../study.js';
import { useApp } from '../../context.jsx';
import s from './Workspace.module.css';
import r from './Roadmap.module.css';
export default function Roadmap() {
  const tr = useT();
  const {
    navigate,
    notify
  } = useApp();
  const [done, setDone] = useState(() => normalizeRoadmap(readStored(ROADMAP_KEY, [])));
  useEffect(() => {
    try {
      storage.setItem(ROADMAP_KEY, JSON.stringify(done));
    } catch {
      notify('Your roadmap could not be saved in this browser.');
    }
  }, [done, notify]);
  const total = ROADMAP.reduce((sum, stage) => sum + stage.milestones.length, 0);
  return <><PageHeading eyebrow={tr("YOUR NEXT CHAPTERS")} title={tr("Road to IGCSE & IB.")} description={tr("A clear view of what is ahead, with practical steps you can take now.")} /><div className={s.pageHero}><div><span className={s.kicker}>{tr("A LONG-TERM DIRECTION. ONE STEP AT A TIME.")}</span><h2>{tr("Start where you are.")}<br />{tr("Build towards what is next.")}</h2><p>{tr("Your route from Grade 8 through IGCSE and the IB Diploma. Mark your own planning milestones as you go.")}</p></div><div className={s.heroIcon}><Route size={58} /></div></div><div className={r.layout}><section className={r.timeline} aria-label={tr("Path from Grade 8 to IB")}>{tr(ROADMAP.map((stage, i) => <article className={r.stage} style={{
          '--stage-color': stage.color
        }} key={stage.id}><div className={r.marker} aria-hidden="true">{tr(i === 0 ? <Compass size={23} /> : i === 3 ? <GraduationCap size={23} /> : String(i + 1).padStart(2, '0'))}</div><div className={r.stageCard}><div className={r.stageTop}><span>{tr(stage.grade)}</span><small>{tr(stage.milestones.filter(([id]) => done.includes(id)).length)}{tr(" / ")}{tr(stage.milestones.length)}{tr(" goals")}</small></div><h2>{tr(stage.title)}</h2><span className={r.subtitle}>{tr(stage.subtitle)}</span><p>{tr(stage.description)}</p><div className={r.milestones}>{tr(stage.milestones.map(([id, title, detail]) => <label key={id} className={done.includes(id) ? r.checked : ''}><input type="checkbox" checked={done.includes(id)} onChange={() => setDone(v => v.includes(id) ? v.filter(k => k !== id) : [...v, id])} /><span className={r.checkbox} aria-hidden="true">{tr(done.includes(id) && <Check size={14} />)}</span><span><strong>{tr(title)}</strong><small>{tr(detail)}</small></span></label>))}</div>{tr(stage.source && <a href={ROADMAP_SOURCES[stage.source]} target="_blank" rel="noopener noreferrer" className={r.source}><ExternalLink size={13} />{tr(stage.source === 'isr' ? 'ISR curriculum source' : 'IB programme source')}</a>)}{tr(!stage.source && <span className={r.source}>{tr("Suggested preparation · adapted for your current study space")}</span>)}</div></article>))}</section><aside className={r.aside}><div className={`${s.panel} ${r.progressCard}`}><span className={s.kicker}>{tr("YOUR PLANNING PROGRESS")}</span><div className={r.progressRing} style={{
            '--value': `${done.length / total * 100}%`
          }}><div><strong>{tr(done.length)}<span>{tr("/")}{tr(total)}</span></strong><small>{tr("milestones")}</small></div></div><h3>{tr("Every step is yours.")}</h3><p>{tr("These are personal preparation goals, not grades, admission requirements, or a school completion record.")}</p><div className={s.progress} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done.length} aria-label={tr("Planning milestones completed")}><span style={{
              width: done.length / total * 100 + '%'
            }} /></div></div><div className={s.panel}><Lightbulb size={24} /><h3>{tr("Start with your foundations")}</h3><p>{tr("Build confidence in the subjects you are studying now.")}</p><div className={r.subjectLinks}>{tr([['maths', 'Maths', 'Reasoning & fluency'], ['english', 'English', 'Reading & evidence'], ['science', 'Science', 'Models & investigation'], ['german', 'Languages', 'Communication & recall']].map(([id, title, caption]) => <button key={id} onClick={() => navigate('subjects/' + id)}><span><strong>{tr(title)}</strong><small>{tr(caption)}</small></span><ArrowUpRight size={17} /></button>))}</div></div><div className={`${s.panel} ${r.officialLinks}`}><span className={s.kicker}>{tr("GO TO THE SOURCE")}</span><h3>{tr("Reliable starting points")}</h3>{tr([['ISR upper school', ROADMAP_SOURCES.isr], ['Cambridge IGCSE', ROADMAP_SOURCES.cambridge], ['IB Diploma Programme', ROADMAP_SOURCES.ib], ['IB course selection guidance', ROADMAP_SOURCES.selection]].map(([title, url]) => <a href={url} target="_blank" rel="noopener noreferrer" key={url}>{tr(title)}<ArrowUpRight size={15} /></a>))}<p className={s.fine}>{tr("Sources checked 20 September 2026. Programme information can change; your school confirms the details for your year.")}</p></div><Button variant="secondary" className="full" onClick={() => navigate('books')}><BookOpen size={16} />{tr("Find preparation books ")}<ArrowRight size={15} /></Button></aside></div><div className={s.notice}>{tr("ISR-confirmed: IGCSE in Grades 9–10, most students beginning IB in Grade 11, and counselling conversations from Grade 9. The checklist is general study guidance and does not certify course eligibility.")}</div></>;
}
