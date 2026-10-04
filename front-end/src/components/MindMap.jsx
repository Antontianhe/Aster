import { useT } from "../i18n.jsx";
import { KnowledgeProgress } from './lab/KnowledgeProgress.jsx';
import React, { useState } from 'react';
import { Network, ChevronRight, BookOpen, ArrowUpRight } from 'lucide-react';
import { COURSES } from '../study.js';
import { External, Empty } from './UI.jsx';
import s from './workspace/Workspace.module.css';
export function MindMap({
  subject
}) {
  const tr = useT();
  const course = COURSES[subject];
  const [selected, setSelected] = useState(0);
  if (!course?.notes.length) return <Empty title={tr("Map your next topic")} icon={Network}>{tr("This class does not have revision notes in the current snapshot. Open the class resources for your teacher’s material.")}</Empty>;
  const note = course.notes[selected] || course.notes[0];
  return <section className={s.mindSection}><div className={s.sectionHead}><div><span className={s.kicker}>{tr("THE BIG PICTURE")}</span><h2>{tr("See how the topic fits together.")}</h2><p>{tr("Select a branch to explore its key idea. This map organizes Learnify’s course revision notes.")}</p></div></div><div className={s.mindLayout}><div className={s.mindCanvas}><div className={s.mindRoot}><Network size={25} /><span>{tr("UNIT")}</span><h3>{tr(course.title)}</h3></div><span className={s.branchLabel}>{tr("includes these concepts")}</span><div className={s.mindBranches} aria-label={tr("Course concept branches")}>{tr(course.notes.map(([title], i) => <button key={title} className={`${s.mindBranch} ${selected === i ? s.selected : ''}`} aria-pressed={selected === i} onClick={() => setSelected(i)}><span>{tr(String(i + 1).padStart(2, '0'))}</span><strong>{tr(title)}</strong><ChevronRight size={16} /></button>))}</div></div><article className={`${s.panel} ${s.mindDetail}`} aria-live="polite"><BookOpen size={25} /><span className={s.kicker}>{tr("CONCEPT ")}{tr(selected + 1)}{tr(" · KEY IDEAS")}</span><h3>{tr(note[0])}</h3><ul>{tr(note[1].split(/(?<=[.!?])\s+(?=[A-Z])/).map((text, i) => <li key={i}>{tr(text)}</li>))}</ul><External href={course.unitSource || course.source}>{tr("View original course material ")}<ArrowUpRight size={15} /></External><p className={s.fine}>{tr("The branch relationship means “part of this unit,” not a prerequisite or causal claim.")}</p></article></div><details className={s.outline}><summary>{tr("Text outline of the map")}</summary><h3>{tr(course.title)}</h3><ul>{tr(course.notes.map(([title, text]) => <li key={title}><strong>{tr(title)}</strong><p>{tr(text)}</p></li>))}</ul></details><KnowledgeProgress subject={subject} /></section>;
}
