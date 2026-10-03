import { COURSES, dayKey, shiftDay } from './study.js';
import { taskDay, dueTimestamp } from './homework.js';

export const TASK_ESTIMATES = [0, 10, 15, 25, 45, 60, 90, 120];
export function taskStatus(task) { return task.done ? 'done' : task.status === 'doing' ? 'doing' : 'todo'; }
export function taskEstimate(task) { return TASK_ESTIMATES.includes(task.estimateMinutes) ? task.estimateMinutes : 0; }
export function validDay(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value;
}
export function changeTaskStatus(tasks, id, status) {
  if (!['todo', 'doing', 'done'].includes(status)) return tasks;
  return tasks.map(task => {
    if (task.id !== id) return task;
    const full = task.done && status !== 'done' && task.plannedFor && tasks.filter(t => t.id !== id && !t.done && t.plannedFor === task.plannedFor).length >= 3;
    return { ...task, status: status === 'doing' ? 'doing' : 'todo', done: status === 'done', ...(full ? { plannedFor: null } : {}) };
  });
}
export function choosePriority(tasks, id, today = dayKey()) {
  const task = tasks.find(t => t.id === id);
  if (!task || task.done) return tasks;
  if (task.plannedFor !== today && tasks.filter(t => !t.done && t.plannedFor === today).length >= 3) throw new Error('Choose up to three open priorities for today.');
  return tasks.map(t => t.id === id ? { ...t, plannedFor: t.plannedFor === today ? null : today } : t);
}
export function boardSummary(tasks, now = new Date()) {
  const today = dayKey(now), open = tasks.filter(t => !t.done), dates = Array.from({ length: 7 }, (_, i) => shiftDay(today, i));
  return {
    today, open: open.length, doing: open.filter(t => t.status === 'doing').length,
    overdue: open.filter(t => dueTimestamp(t) < now.getTime()).length,
    unestimated: open.filter(t => !taskEstimate(t)).length,
    priorities: tasks.filter(t => t.plannedFor === today).sort((a, b) => Number(a.done) - Number(b.done)),
    days: dates.map(day => { const due = open.filter(t => taskDay(t) === day); return { day, count: due.length, minutes: due.reduce((n, t) => n + taskEstimate(t), 0), unestimated: due.filter(t => !taskEstimate(t)).length }; }),
  };
}
export function quickTask({ title, course, due = '', estimateMinutes = 0 }, id = `local-${crypto.randomUUID()}`) {
  if (typeof title !== 'string' || !title.trim()) throw new Error('Give your task a short title.');
  if (!Object.hasOwn(COURSES, course)) throw new Error('Choose a subject.');
  if (due && !validDay(due)) throw new Error('Choose a valid due date.');
  return { id, title: title.trim().slice(0, 180), course, due: due || null, allDay: true, kind: 'Homework', details: '', priority: 'normal', remindHours: null, checklist: [], checks: [], done: false, status: 'todo', estimateMinutes: TASK_ESTIMATES.includes(estimateMinutes) ? estimateMinutes : 0, plannedFor: null, source: '', sourceStatus: 'Personal task' };
}
