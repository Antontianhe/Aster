import { COURSES, SUBJECT_ORDER, dayKey, shiftDay } from './study.js';

export const REVISION_KEY = 'aster-review-schedule-v1';
export const NOTEBOOK_KEY = 'aster-revision-notebook-v1';
const DAY = 86400000;
export const QUESTION_INDEX = Object.fromEntries(SUBJECT_ORDER.flatMap(subject =>
  COURSES[subject].questions.map(question => [`${subject}:${question.id}`, { subject, question }])));
const byText = new Map(Object.entries(QUESTION_INDEX).map(([key, item]) => [`${item.subject}:${item.question.q}`, key]));
const integer = (value, max = 100000) => Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : 0;

export function questionKey(attempt) {
  const direct = `${attempt.subject}:${attempt.questionId}`;
  return QUESTION_INDEX[direct] ? direct : byText.get(`${attempt.subject}:${attempt.question}`);
}

export function normalizeSchedule(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, card]) =>
    QUESTION_INDEX[key] && card && Number.isFinite(Date.parse(card.lastAt)) && Number.isFinite(Date.parse(card.dueAt))
  ).map(([key, card]) => [key, {
    lastAt: card.lastAt, dueAt: card.dueAt,
    interval: integer(card.interval, 30), streak: integer(card.streak, 100),
    seen: integer(card.seen), correctCount: Math.min(integer(card.seen), integer(card.correctCount)),
    correct: card.correct === true, confidence: [1, 2, 3].includes(card.confidence) ? card.confidence : 1,
    hintUsed: card.hintUsed === true,
  }]));
}

export function scheduleAttempt(schedule, attempt) {
  const key = questionKey(attempt), at = Date.parse(attempt.at);
  if (!key || !Number.isFinite(at)) return schedule;
  const prior = schedule[key];
  if (prior && at <= Date.parse(prior.lastAt)) return schedule;
  // A repeat on the same day can repair an error, but cannot inflate the interval.
  const sameDay = prior && dayKey(new Date(prior.lastAt)) === dayKey(new Date(at));
  const confident = attempt.correct && attempt.confidence >= 2 && !attempt.hintUsed;
  const interval = !attempt.correct || !confident ? 1 : sameDay && prior.correct ?
    Math.max(1, prior.interval) : Math.min(30, prior?.correct ? Math.max(3, prior.interval * 2) : 3);
  const next = {
    lastAt: new Date(at).toISOString(), dueAt: new Date(at + interval * DAY).toISOString(), interval,
    streak: confident ? (sameDay ? prior?.streak || 1 : (prior?.streak || 0) + 1) : 0,
    seen: (prior?.seen || 0) + 1, correctCount: (prior?.correctCount || 0) + Number(attempt.correct === true),
    correct: attempt.correct === true, confidence: attempt.confidence || 1, hintUsed: attempt.hintUsed === true,
  };
  return { ...schedule, [key]: next };
}

export function seedSchedule(attempts = []) {
  return [...attempts].sort((a, b) => Date.parse(a.at) - Date.parse(b.at)).reduce(scheduleAttempt, {});
}

export function revisionQueue(schedule, { subject = 'all', filter = 'due', query = '', now = Date.now() } = {}) {
  const text = query.trim().toLowerCase();
  return Object.entries(schedule).flatMap(([key, card]) => {
    const item = QUESTION_INDEX[key];
    if (!item || (subject !== 'all' && subject !== item.subject)) return [];
    const due = Date.parse(card.dueAt) <= now;
    const needsSupport = !card.correct || card.confidence === 1 || card.hintUsed;
    if (filter === 'due' && !due || filter === 'support' && !needsSupport) return [];
    if (text && !`${item.question.q} ${item.question.topic} ${COURSES[item.subject].name}`.toLowerCase().includes(text)) return [];
    return [{ ...item, ...card, key, due, needsSupport }];
  }).sort((a, b) => Number(b.due) - Number(a.due) || Number(a.correct) - Number(b.correct) || Date.parse(a.dueAt) - Date.parse(b.dueAt));
}

export function revisionAnalytics(attempts = [], sessions = [], schedule = {}, now = new Date(), subject) {
  if (subject) {
    attempts = attempts.filter(a => a.subject === subject);
    sessions = sessions.filter(s => s.subject === subject);
    schedule = Object.fromEntries(Object.entries(schedule).filter(([key]) => QUESTION_INDEX[key]?.subject === subject));
  }
  const today = dayKey(now), start = shiftDay(today, -27), priorStart = shiftDay(today, -13), weekStart = shiftDay(today, -6);
  const days = Array.from({ length: 28 }, (_, index) => ({ day: shiftDay(start, index), attempts: 0, correct: 0, minutes: 0 }));
  const byDay = new Map(days.map(day => [day.day, day]));
  const valid = attempts.filter(a => Number.isFinite(Date.parse(a.at)) && Date.parse(a.at) <= now.getTime() && COURSES[a.subject]);
  for (const a of valid) {
    const row = byDay.get(dayKey(new Date(a.at)));
    if (row) { row.attempts++; row.correct += Number(a.correct); }
  }
  for (const session of sessions) {
    if (session.kind !== 'focus' || !Number.isFinite(Date.parse(session.finishedAt)) || Date.parse(session.finishedAt) > now.getTime()) continue;
    const row = byDay.get(dayKey(new Date(session.finishedAt)));
    if (row) row.minutes += Number.isFinite(session.minutes) ? Math.max(0, session.minutes) : 0;
  }
  const week = days.filter(d => d.day >= weekStart), previous = days.filter(d => d.day >= priorStart && d.day < weekStart);
  const summarise = rows => { const total = rows.reduce((n, d) => n + d.attempts, 0), correct = rows.reduce((n, d) => n + d.correct, 0); return { total, correct, accuracy: total ? Math.round(100 * correct / total) : null, minutes: rows.reduce((n, d) => n + d.minutes, 0), activeDays: rows.filter(d => d.attempts || d.minutes).length }; };
  const subjects = SUBJECT_ORDER.filter(id => !subject || id === subject).map(subject => {
    const answers = valid.filter(a => a.subject === subject), seen = Object.keys(schedule).filter(key => QUESTION_INDEX[key]?.subject === subject).length;
    return { subject, total: answers.length, correct: answers.filter(a => a.correct).length, seen, bank: COURSES[subject].questions.length, accuracy: answers.length ? Math.round(100 * answers.filter(a => a.correct).length / answers.length) : null };
  });
  const topics = new Map();
  for (const [key, card] of Object.entries(schedule)) {
    const item = QUESTION_INDEX[key]; if (!item) continue;
    const id = `${item.subject}:${item.question.topic}`;
    const row = topics.get(id) || { id, subject: item.subject, topic: item.question.topic, seen: 0, support: 0, questionIds: [] };
    row.seen++;
    if (!card.correct || card.confidence === 1 || card.hintUsed) { row.support++; row.questionIds.push(item.question.id); }
    topics.set(id, row);
  }
  const recent = valid.filter(a => dayKey(new Date(a.at)) >= start);
  return {
    days, week: summarise(week), previous: summarise(previous), subjects,
    topics: [...topics.values()].filter(t => t.support).sort((a, b) => b.support - a.support),
    confidence: [1, 2, 3].map(level => { const answers = recent.filter(a => a.confidence === level); return { level, total: answers.length, correct: answers.filter(a => a.correct).length }; }),
    due: revisionQueue(schedule, { now: now.getTime() }).length,
  };
}

export function normalizeNotebook(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const text = (v, max) => typeof v === 'string' ? v.slice(0, max) : '';
  return value.filter(n => n && typeof n.id === 'string' && !seen.has(n.id) && seen.add(n.id)).slice(0, 60).map(n => ({
    id: text(n.id, 80), subject: COURSES[n.subject] ? n.subject : 'maths',
    title: text(n.title, 120), cue: text(n.cue, 700), notes: text(n.notes, 3500), summary: text(n.summary, 700),
    pinned: n.pinned === true, archived: n.archived === true,
    updatedAt: Number.isFinite(Date.parse(n.updatedAt)) ? n.updatedAt : new Date(0).toISOString(),
  }));
}

export function notebookMarkdown(notes) {
  return notes.map(n => `# ${n.title || 'Untitled note'}\n\nSubject: ${COURSES[n.subject]?.name || n.subject}\n\n## Recall prompt\n${n.cue}\n\n## Notes\n${n.notes}\n\n## In my own words\n${n.summary}`).join('\n\n---\n\n');
}

export function reportCsv(analytics) {
  const cell = value => '"' + String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"';
  return [['Subject', 'Answers in saved history', 'Correct answers', 'Accuracy %', 'Questions practised', 'Questions available'],
    ...analytics.subjects.map(s => [COURSES[s.subject].name, s.total, s.correct, s.accuracy ?? '', s.seen, s.bank])
  ].map(row => row.map(cell).join(',')).join('\r\n');
}
