import {BuddyAvatar} from './buddy/BuddyAvatar.jsx';
import {normalizeBuddy} from '../buddies.js';
import { useT } from "../i18n.jsx";
import React, { useEffect, useRef, useState } from 'react';
import { X, ArrowUpRight, Check, ChevronLeft, ChevronRight, CalendarDays, Bell, Pencil, ExternalLink, Pin, BookOpen, Music2, Calculator, Monitor, FlaskConical, Languages, Globe2, MessageCircle, Drama, Palette, Activity, Compass, School, Plus, Sparkles, Clock3, ArrowRight, Bookmark, FileText, Trash2, AlertCircle } from 'lucide-react';
import { COURSES, SUBJECT_META, calendarDays, dayKey } from '../study.js';
import { dueLabel, dueTimestamp, reminderLabel, berlinInput, berlinDateTimeToISO } from '../homework.js';
import { useApp } from '../context.jsx';
const ICONS = {
  Music2,
  Calculator,
  Monitor,
  FlaskConical,
  BookOpen,
  Languages,
  Globe2,
  MessageCircle,
  Drama,
  Palette,
  Activity,
  Compass,
  School
};
export function SubjectIcon({
  id,
  size = 22,
  ...props
}) {
  const tr = useT();
  const Icon = ICONS[COURSES[id]?.icon] || BookOpen;
  return <Icon size={size} {...props} />;
}
export function ColorIcon({
  id,
  size = 23,
  className = ''
}) {
  const tr = useT();
  return <span className={`color-icon tone-${SUBJECT_META[id]?.color || 'blue'} ${className}`}><SubjectIcon id={id} size={size} /></span>;
}
export function SubjectTag({
  id
}) {
  const tr = useT();
  return <span className={`subject-tag tone-${SUBJECT_META[id]?.color || 'blue'}`}><SubjectIcon id={id} size={13} />{tr(COURSES[id]?.name || 'Personal')}</span>;
}
export function External({
  href,
  children,
  className = '',
  ...props
}) {
  const tr = useT();
  return <a className={`external ${className}`} href={href} target="_blank" rel="noreferrer" {...props}>{tr(children)}<ArrowUpRight size={15} /></a>;
}
export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}) {
  const tr = useT();
  return <button className={`button button-${variant} ${className}`} {...props}>{tr(children)}</button>;
}
export function Empty({
  title,
  children,
  action,
  icon: Icon = Sparkles
}) {
  const tr = useT();
  return <div className="empty"><span className="empty-symbol"><Icon size={29} /></span><h3>{tr(title)}</h3><p>{tr(children)}</p>{tr(action)}</div>;
}
export function Progress({
  value,
  label,
  className = ''
}) {
  const tr = useT();
  return <div className={`progress-bar ${className}`} role="progressbar" aria-label={tr(label)} aria-valuenow={Math.max(0, Math.min(100, value))} aria-valuemin={0} aria-valuemax={100}><span style={{
      width: `${Math.max(0, Math.min(100, value))}%`
    }} /></div>;
}
export function SectionHeader({
  eyebrow,
  title,
  description,
  action
}) {
  const tr = useT();
  return <div className="section-heading"><div>{tr(eyebrow && <span className="eyebrow">{tr(eyebrow)}</span>)}<h2>{tr(title)}</h2>{tr(description && <p>{tr(description)}</p>)}</div>{tr(action)}</div>;
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action
}) {
  const tr = useT();
  return <header className="page-heading"><div><span className="eyebrow">{tr(eyebrow)}</span><h1>{tr(title)}</h1><p>{tr(description)}</p></div>{tr(action)}</header>;
}
export function Modal({
  title,
  children,
  onClose,
  size = 'medium',
  className = ''
}) {
  const tr = useT();
  const dialogRef = useRef();
  const pointerStartedOutside = useRef(false);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previous;
    };
  }, []);
  return <dialog ref={dialogRef} aria-label={tr(title)} className={`dialog dialog-${size} ${className}`} onCancel={e => {
    e.preventDefault();
    onClose();
  }} onPointerDown={e => {
    pointerStartedOutside.current = e.target === dialogRef.current;
  }} onClick={e => {
    if (e.target === dialogRef.current && pointerStartedOutside.current) onClose();
  }}><div className="dialog-header"><h2>{tr(title)}</h2><button className="icon-button" aria-label={tr("Close dialog")} onClick={onClose}><X size={21} /></button></div>{tr(children)}</dialog>;
}
export function Blue({
  pose = 'read',
  interactive = false,
  celebrate = false,
  className = '',
  onGreet
}) {
  const tr = useT();
  const {prefs}=useApp();
  const buddy=prefs?.buddy?normalizeBuddy(prefs.buddy):null;
  const [waving, setWaving] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  function greet() {
    setWaving(true);
    onGreet?.();
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setWaving(false), 2400);
  }
  if(buddy)return <button className={`blue-mascot ${className}`} onClick={greet} aria-label={buddy.name}><BuddyAvatar {...buddy} excited={waving||celebrate}/></button>;
  const content = <><span className={`blue-character ${waving ? 'is-waving' : ''} ${celebrate ? 'is-celebrating' : ''}`}>
    <img className="blue-still" src={pose === 'read' ? '/assets/blue-reading.png' : '/assets/blue-dinosaur.png'} alt={tr(interactive ? '' : 'Blue, your blue dinosaur study companion')} draggable="false" />
    {tr(interactive && <span className="blue-wave" aria-hidden="true" />)}
  </span>{tr(celebrate && <span className="celebration-bits" aria-hidden="true">{tr(Array.from({
        length: 10
      }, (_, i) => <i key={i} style={{
        '--i': i
      }} />))}</span>)}</>;
  return interactive ? <button className={`blue-mascot ${className}`} onClick={greet} aria-label={tr("Say hi to Blue")}>{tr(content)}</button> : <div className={`blue-mascot ${className}`}>{tr(content)}</div>;
}
export function MiniCalendar({
  selected,
  onSelect,
  month,
  onMonth,
  markers = {},
  large = false
}) {
  const tr = useT();
  const dates = calendarDays(month.year, month.month),
    nowKey = dayKey();
  const label = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric'
  }).format(new Date(month.year, month.month, 1));
  function changeMonth(offset) {
    const d = new Date(month.year, month.month + offset, 1);
    onMonth({
      year: d.getFullYear(),
      month: d.getMonth()
    });
  }
  function moveFocus(e, index) {
    const offset = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7
    }[e.key];
    if (offset !== undefined) {
      e.preventDefault();
      const next = e.currentTarget.parentElement.querySelectorAll('button')[index + offset];
      next?.focus();
    }
  }
  return <div className={`calendar ${large ? 'calendar-large' : ''}`}><div className="calendar-title"><h3>{tr(label)}</h3><div><button type="button" className="icon-button" aria-label={tr("Previous month")} onClick={() => changeMonth(-1)}><ChevronLeft size={18} /></button><button type="button" className="icon-button" aria-label={tr("Next month")} onClick={() => changeMonth(1)}><ChevronRight size={18} /></button></div></div><div className="calendar-weekdays" aria-hidden="true">{tr(['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{tr(d)}</span>))}</div><div className="calendar-days" aria-label={tr(label)}>{tr(dates.map((day, i) => <button type="button" key={day.key} className={`${day.inMonth ? '' : 'outside'} ${day.key === selected ? 'selected' : ''} ${day.key === nowKey ? 'today' : ''}`} aria-label={tr(new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'full'
      }).format(day.date) + (markers[day.key]?.length ? `, ${markers[day.key].length} tasks` : ''))} aria-pressed={day.key === selected} aria-current={day.key === nowKey ? 'date' : undefined} onClick={() => onSelect(day.key)} onKeyDown={e => moveFocus(e, i)}><span>{tr(day.date.getDate())}</span>{tr(markers[day.key]?.length > 0 && <span className="calendar-dots">{tr(markers[day.key].slice(0, 3).map((t, j) => <i key={j} className={`tone-${SUBJECT_META[t.course]?.color || 'blue'}`} />))}</span>)}</button>))}</div></div>;
}
export function SubjectCard({
  id,
  compact = false
}) {
  const tr = useT();
  const {
    navigate,
    prefs,
    setPrefs,
    progress
  } = useApp();
  const course = COURSES[id],
    meta = SUBJECT_META[id],
    isPinned = prefs.pinned.includes(id);
  function togglePin() {
    setPrefs(p => ({
      ...p,
      pinned: isPinned ? p.pinned.filter(s => s !== id) : [...p.pinned, id]
    }));
  }
  return <article className={`subject-card tone-${meta.color} ${compact ? 'compact' : ''}`}><button className="subject-open" onClick={() => navigate(`subjects/${id}`)} aria-label={tr(`Open ${course.name}`)}><ColorIcon id={id} size={27} /><span className="subject-card-ghost" aria-hidden="true"><SubjectIcon id={id} size={101} /></span><span className="subject-card-code">{tr(course.code)}</span><h3>{tr(course.name)}</h3><p>{tr(course.title)}</p><span className="subject-card-footer"><span>{tr(course.resources.length)}{tr(" resources")}{tr(course.questions.length > 0 ? ' · Quick review' : '')}</span><ArrowRight size={18} /></span></button>{tr(!compact && <button className={`pin-button ${isPinned ? 'pinned' : ''}`} aria-label={tr(`${isPinned ? 'Unpin' : 'Pin'} ${course.name}`)} aria-pressed={isPinned} onClick={togglePin}><Pin size={16} fill={isPinned ? 'currentColor' : 'none'} /></button>)}</article>;
}
export function TaskRow({
  task,
  compact = false
}) {
  const tr = useT();
  const {
    toggleTask,
    setDialog,
    now
  } = useApp();
  const overdue = !task.done && task.due && dueTimestamp(task) < now;
  return <div className={`task-row ${task.done ? 'task-done' : ''} ${compact ? 'compact' : ''}`}><button className="task-check" role="checkbox" aria-checked={task.done} aria-label={tr(`Mark ${task.title} ${task.done ? 'incomplete' : 'done'}`)} onClick={() => toggleTask(task.id)}>{tr(task.done && <Check size={14} strokeWidth={3} />)}</button><ColorIcon id={task.course} size={19} /><button className="task-title-button" onClick={() => setDialog({
      type: 'task-detail',
      id: task.id
    })}><strong>{tr(task.title)}</strong><span>{tr(COURSES[task.course].name)}<i /> {tr(task.kind)}{tr(task.checklist?.length > 0 && <><i />{tr(task.checks?.length || 0)}{tr("/")}{tr(task.checklist.length)}{tr(" steps")}</>)}</span></button><div className="task-row-end">{tr(task.priority === 'high' && !task.done && <span className="priority-dot" title={tr("High priority")} />)}<span className={`due-tag ${overdue ? 'late' : !task.due ? 'uncertain' : ''}`}><CalendarDays size={13} />{tr(dueLabel(task.due, new Date(now), task.allDay))}</span>{tr(!compact && <button className="icon-button" aria-label={tr(`Edit ${task.title}`)} onClick={() => setDialog({
        type: 'task-edit',
        id: task.id
      })}><Pencil size={16} /></button>)}</div></div>;
}
export function ResourceRow({
  resource
}) {
  const tr = useT();
  const {
    bookmarks,
    toggleBookmark
  } = useApp();
  const saved = bookmarks.includes(resource.id);
  return <article className="resource-row"><ColorIcon id={resource.subject} size={22} /><a href={resource.url} target="_blank" rel="noreferrer" className="resource-main"><h3>{tr(resource.title)}</h3><p>{tr(COURSES[resource.subject].name)}<i />{tr(resource.type)}</p></a><button className={`icon-button bookmark-button ${saved ? 'is-saved' : ''}`} aria-label={tr(`${saved ? 'Unsave' : 'Save'} ${resource.title}`)} aria-pressed={saved} onClick={() => toggleBookmark(resource.id)}><Bookmark size={18} fill={saved ? 'currentColor' : 'none'} /></button><a className="icon-button" href={resource.url} target="_blank" rel="noreferrer" aria-label={tr(`Open ${resource.title} in Schoolbox`)}><ArrowUpRight size={19} /></a></article>;
}
export function TaskEditor({
  item,
  defaultDate = '',
  onClose
}) {
  const tr = useT();
  const {
    saveTask,
    removeTask
  } = useApp();
  const [kind, setKind] = useState(item?.kind || 'Homework');
  const [title, setTitle] = useState(item?.title || ''),
    [course, setCourse] = useState(item?.course || 'maths'),
    [date, setDate] = useState(berlinInput(item?.due).slice(0, 10) || defaultDate),
    [time, setTime] = useState(item?.allDay ? '' : berlinInput(item?.due).slice(11) || ''),
    [allDay, setAllDay] = useState(item?.allDay ?? true),
    [notes, setNotes] = useState(item?.details || ''),
    [reminder, setReminder] = useState(item?.remindHours == null ? 'off' : String(item.remindHours)),
    [priority, setPriority] = useState(item?.priority || 'normal'),
    [checklist, setChecklist] = useState(item?.checklist?.join('\n') || ''),
    [error, setError] = useState('');
  function submit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Give your task a short title.');
      return;
    }
    if (!date && reminder !== 'off') {
      setError('Choose a date before adding a reminder.');
      return;
    }
    let due = null;
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !berlinDateTimeToISO(`${date}T12:00`)) {
        setError('Enter a valid date as YYYY-MM-DD or choose one from the calendar.');
        return;
      }
      if (allDay) due = date;else {
        due = berlinDateTimeToISO(`${date}T${time}`);
        if (!due) {
          setError('Choose a valid date and time in Europe/Berlin.');
          return;
        }
      }
    }
    const steps = checklist.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 20);
    saveTask({
      ...item,
      id: item?.id || `local-${crypto.randomUUID()}`,
      title: title.trim(),
      course,
      due,
      allDay,
      details: notes.trim(),
      remindHours: reminder === 'off' ? null : Number(reminder),
      priority,
      kind,
      done: item?.done || false,
      checklist: steps,
      checks: steps.map((s, i) => item?.checklist?.indexOf(s) >= 0 && item?.checks?.includes(item.checklist.indexOf(s)) ? i : -1).filter(i => i >= 0),
      source: item?.source || null,
      sourceStatus: item?.sourceStatus || 'Added by you'
    });
  }
  return <Modal title={tr(item?.id ? 'Edit task or event' : 'Add task or event')} onClose={onClose}><form className="task-form" onSubmit={submit}><p className="form-intro">{tr("Add the details you need to get started.")}</p><label>{tr("Task title")}<input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder={tr("What do you need to do?")} maxLength={140} required /></label><div className="form-grid"><label>{tr("Subject")}<select value={course} onChange={e => setCourse(e.target.value)}>{tr(Object.entries(COURSES).map(([id, c]) => <option value={id} key={id}>{tr(c.name)}</option>))}</select></label><label>{tr("Type")}<select value={kind} onChange={e => setKind(e.target.value)}>{tr([...new Set(['Homework', 'Assessment', 'Revision', 'Personal plan', item?.kind].filter(Boolean))].map(k => <option key={k} value={k}>{tr(k)}</option>))}</select></label></div><div className="form-grid"><label>{tr("Priority")}<select value={priority} onChange={e => setPriority(e.target.value)}><option value="normal">{tr("Normal")}</option><option value="high">{tr("High priority")}</option><option value="low">{tr("Low priority")}</option></select></label><DateField value={date} onChange={setDate} /></div><div className="form-grid"><label>{tr("Reminder")}<select value={reminder} onChange={e => setReminder(e.target.value)}><option value="off">{tr("No reminder")}</option>{tr(!allDay && <option value="1">{tr("1 hour before")}</option>)}<option value="24">{tr("1 day before")}</option><option value="48">{tr("2 days before")}</option><option value="0">{tr(allDay ? 'On the day' : 'At the due time')}</option></select></label></div><label className="checkbox-label"><input type="checkbox" checked={allDay} onChange={e => {
          setAllDay(e.target.checked);
          if (e.target.checked && reminder === '1') setReminder('24');
        }} />{tr("Date only · no exact time")}</label>{tr(!allDay && <label>{tr("Due time")}<input type="time" value={time} onChange={e => setTime(e.target.value)} required={Boolean(date)} /></label>)}<p className="field-help">{tr("Times use Europe/Berlin. Date-only reminders arrive at 09:00. Leave the date blank if it needs confirming.")}</p><label>{tr("Notes")}<textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} maxLength={5000} placeholder={tr("Instructions, pages, or useful details")} /></label><details className="form-details"><summary>{tr("Break it into smaller steps ")}<Plus size={16} /></summary><label>{tr("One step per line")}<textarea value={checklist} onChange={e => setChecklist(e.target.value)} rows={3} maxLength={2000} placeholder={tr('Read the instructions\nFinish the first section\nCheck my answers')} /></label></details>{tr(item?.source && <p className="field-help"><School size={14} />{tr(" Edits stay here; your Schoolbox assignment is unchanged.")}</p>)}{tr(error && <p className="form-error" role="alert"><AlertCircle size={17} />{tr(error)}</p>)}<div className="form-footer">{tr(item?.id?.startsWith('local-') && <button type="button" className="icon-button delete-button" aria-label={tr("Delete personal task")} onClick={() => removeTask(item.id)}><Trash2 size={19} /></button>)}<Button variant="secondary" type="button" onClick={onClose}>{tr("Cancel")}</Button><Button type="submit"><Check size={17} />{tr("Save task")}</Button></div></form></Modal>;
}
export function DateField({
  value,
  onChange,
  label = "Due date"
}) {
  const tr = useT();
  const [open, setOpen] = useState(false);
  const initial = value || dayKey();
  const [month, setMonth] = useState({
    year: Number(initial.slice(0, 4)),
    month: Number(initial.slice(5, 7)) - 1
  });
  return <div className="date-field"><label>{tr(label)}<span className="date-input-wrap"><input type="text" aria-label={tr(label)} inputMode="numeric" value={value} onChange={e => onChange(e.target.value)} placeholder={tr("YYYY-MM-DD")} maxLength={10} /><button type="button" className="icon-button" aria-label={tr("Choose due date")} aria-expanded={open} onClick={() => setOpen(v => !v)}><CalendarDays size={19} /></button></span></label>{tr(open && <div className="date-field-calendar"><MiniCalendar selected={value} onSelect={key => {
        onChange(key);
        setOpen(false);
      }} month={month} onMonth={setMonth} /><button type="button" className="text-link" onClick={() => {
        onChange('');
        setOpen(false);
      }}>{tr("Clear date")}</button></div>)}</div>;
}
