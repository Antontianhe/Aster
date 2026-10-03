import { useT } from "../../i18n.jsx";
import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';
import { shiftDay, localDayDate, COURSES, SUBJECT_META } from '../../study.js';
import { berlinInput } from '../../homework.js';
import { useApp } from '../../context.jsx';
import s from './Planner.module.css';
export function weekStart(key) {
  const day = localDayDate(key).getDay();
  return shiftDay(key, -((day + 6) % 7));
}
export function WeekPlanner({
  selected,
  onSelect,
  markers,
  today
}) {
  const tr = useT();
  const {
    setDialog
  } = useApp();
  const start = weekStart(selected),
    days = Array.from({
      length: 7
    }, (_, i) => shiftDay(start, i));
  const format = key => new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short'
  }).format(localDayDate(key));
  return <section className={s.week}><div className={s.weekHeader}><button className="icon-button" aria-label={tr("Previous week")} onClick={() => onSelect(shiftDay(selected, -7))}><ChevronLeft size={19} /></button><h2>{tr(format(start))}{tr(" – ")}{tr(format(days[6]))}<small>{tr(start.slice(0, 4))}</small></h2><button className="icon-button" aria-label={tr("Next week")} onClick={() => onSelect(shiftDay(selected, 7))}><ChevronRight size={19} /></button></div><div className={s.weekScroll}><div className={s.weekGrid}>{tr(days.map(day => <section key={day} className={`${s.day} ${selected === day ? s.selected : ''} ${today === day ? s.today : ''}`}><button className={s.dayHeading} onClick={() => onSelect(day)} aria-pressed={selected === day} aria-label={tr(`Select ${day}`)}><span>{tr(new Intl.DateTimeFormat('en-GB', {
                weekday: 'short'
              }).format(localDayDate(day)))}</span><strong>{tr(localDayDate(day).getDate())}</strong>{tr(today === day && <small>{tr("Today")}</small>)}</button><div className={s.dayItems}>{tr((markers[day] || []).map(task => <button className={`${s.event} ${task.done ? s.done : ''}`} key={task.id} style={{
              '--event-color': {
                violet: '#bd9aff',
                blue: '#80baf3',
                mint: '#79d9b1',
                peach: '#edb186',
                rose: '#e896b6',
                butter: '#dfcc87'
              }[SUBJECT_META[task.course]?.color] || '#aba9e9'
            }} onClick={() => setDialog({
              type: 'task-detail',
              id: task.id
            })}><span>{tr(task.allDay ? 'All day' : berlinInput(task.due).slice(11))}{tr(task.done && <Check size={11} />)}</span><strong>{tr(task.title)}</strong><small>{tr(task.kind || 'Homework')}{tr(" · ")}{tr(COURSES[task.course].name)}</small></button>))}</div><button className={s.add} aria-label={tr(`Add an event on ${day}`)} onClick={() => setDialog({
            type: 'task-edit',
            date: day
          })}><Plus size={16} /><span>{tr("Add")}</span></button></section>))}</div></div><p className={s.weekHint}>{tr("Europe/Berlin · tap an event for details · scroll horizontally on smaller screens")}</p></section>;
}
