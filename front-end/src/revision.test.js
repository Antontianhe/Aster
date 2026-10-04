import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSES, makeQuiz } from './study.js';
import { normalizeLearning } from './learning.js';
import { questionKey, scheduleAttempt, normalizeSchedule, seedSchedule, revisionQueue, revisionAnalytics, normalizeNotebook, notebookMarkdown, reportCsv, QUESTION_INDEX } from './revision.js';

const first = COURSES.maths.questions[0], second = COURSES.maths.questions[1];
const attempt = (changes = {}) => ({ subject: 'maths', question: first.q, questionId: first.id, correct: true, confidence: 3, at: '2026-09-01T10:00:00Z', ...changes });

test('review timing prioritises incorrect, hinted and unsure answers without extending same-day repeats', () => {
  const key = questionKey(attempt());
  for (const changes of [{ correct: false }, { confidence: 1 }, { hintUsed: true }]) {
    const card = scheduleAttempt({}, attempt(changes))[key];
    assert.equal(card.interval, 1); assert.equal(card.dueAt, '2026-09-02T10:00:00.000Z');
  }
  let cards = scheduleAttempt({}, attempt());
  assert.equal(cards[key].interval, 3);
  cards = scheduleAttempt(cards, attempt({ at: '2026-09-01T11:00:00Z' }));
  assert.equal(cards[key].interval, 3);
  cards = scheduleAttempt(cards, attempt({ at: '2026-09-04T11:00:00Z' }));
  assert.equal(cards[key].interval, 6);
  cards = scheduleAttempt(cards, attempt({ correct: false, at: '2026-09-10T11:00:00Z' }));
  assert.equal(cards[key].interval, 1); assert.equal(cards[key].streak, 0);
  assert.equal(cards[key].seen, 4); assert.equal(cards[key].correctCount, 3);
});

test('schedule bounds intervals and ignores old or invalid attempts', () => {
  let cards = {};
  for (let i = 0; i < 15; i++) cards = scheduleAttempt(cards, attempt({ at: new Date(Date.UTC(2026, 8, i + 1, 10)).toISOString() }));
  assert.equal(cards[questionKey(attempt())].interval, 30);
  assert.equal(scheduleAttempt(cards, attempt()), cards);
  assert.equal(scheduleAttempt(cards, attempt({ at: 'bad date' })), cards);
  assert.equal(scheduleAttempt(cards, attempt({ subject: 'missing' })), cards);
  assert.equal(scheduleAttempt(cards, attempt({ questionId: 'missing', question: 'unknown question' })), cards);
});

test('older answer history migrates by text and schedules survive storage normalization', () => {
  const old = attempt({ questionId: undefined, id: 'old' }), newer = attempt({ id: 'new', correct: false, at: '2026-09-05T10:00:00Z' });
  const cards = seedSchedule([newer, old]);
  assert.equal(cards[questionKey(old)].seen, 2);
  assert.equal(cards[questionKey(old)].correct, false);
  assert.deepEqual(normalizeSchedule(JSON.parse(JSON.stringify(cards))), cards);
  assert.deepEqual(normalizeSchedule({ bogus: { lastAt: 'today' } }), {});
  assert.deepEqual(normalizeSchedule(null), {});
  assert.equal(normalizeLearning({ attempts: [newer] }).attempts[0].questionId, first.id);
});

test('review queue respects due time, subject, support and search filters', () => {
  const cards = seedSchedule([attempt(), attempt({ questionId: second.id, question: second.q, correct: false })]);
  const now = Date.parse('2026-09-03T10:00:00Z');
  assert.equal(revisionQueue(cards, { now }).length, 1);
  assert.equal(revisionQueue(cards, { now, subject: 'science' }).length, 0);
  assert.equal(revisionQueue(cards, { now, filter: 'all' }).length, 2);
  assert.equal(revisionQueue(cards, { now, filter: 'support' }).length, 1);
  assert.equal(revisionQueue(cards, { now, query: 'unfindable phrase' }).length, 0);
  assert.equal(revisionQueue(cards, { now, query: second.q }).length, 1);
  assert.equal(revisionQueue(cards, { now: Date.parse('2026-09-02T10:00:00Z') }).length, 1);
});

test('targeted quiz contains only the requested subject questions, without duplicate rewards', () => {
  const quiz = makeQuiz('maths', { selectedQuestions: [second.id, second.id, first.id, 'bad', COURSES.science.questions[0].id] });
  assert.deepEqual(quiz.map(q => q.id), [second.id, first.id]);
  assert.ok(quiz.every(q => q.choices.filter(c => c.correct).length === 1));
  const long = makeQuiz('maths', { selectedQuestions: COURSES.maths.questions.slice(0, 40).map(q => q.id) });
  assert.equal(long.length, 30);
});

test('analytics keeps unattempted subjects empty and compares weighted recent accuracy', () => {
  const now = new Date('2026-09-24T12:00:00Z');
  const answers = [attempt({ at: '2026-09-12T12:00:00Z', correct: false }), attempt({ at: '2026-09-24T10:00:00Z' }), attempt({ at: '2026-09-23T10:00:00Z', correct: false }), attempt({ at: '2026-09-23T11:00:00Z' }), attempt({ at: '2026-09-25T10:00:00Z' })];
  const result = revisionAnalytics(answers, [{ kind: 'focus', minutes: 12, finishedAt: '2026-09-24T10:00:00Z' }, { kind: 'review', minutes: 5, finishedAt: '2026-09-24T10:00:00Z' }], seedSchedule(answers.slice(0, 4)), now);
  assert.equal(result.week.total, 3); assert.equal(result.week.accuracy, 67); assert.equal(result.previous.accuracy, 0);
  assert.equal(result.week.minutes, 12); assert.equal(result.subjects.find(s => s.subject === 'science').accuracy, null);
  assert.equal(result.days.length, 28); assert.equal(result.days.at(-1).day, '2026-09-24');
  assert.equal(result.confidence[2].total, 4);
  assert.equal(revisionAnalytics([], [], {}, now).week.accuracy, null);
});

test('day boundaries and repeated reviews use Berlin time across midnight and DST', () => {
  const now = new Date('2026-10-25T23:10:00Z');
  const a = attempt({ at: '2026-10-25T23:00:00Z' });
  const result = revisionAnalytics([a], [], {}, now);
  assert.equal(result.days.at(-1).day, '2026-10-26'); assert.equal(result.days.at(-1).attempts, 1);
  const key = questionKey(a);
  const cards = scheduleAttempt(scheduleAttempt({}, attempt({ at: '2026-09-01T22:30:00Z' })), attempt({ at: '2026-09-02T01:00:00Z' }));
  assert.equal(cards[key].interval, 3);
});

test('notebook rejects corrupt shapes, limits storage and preserves recoverable archives', () => {
  assert.deepEqual(normalizeNotebook({}), []);
  const n = { id: 'one', subject: 'maths', title: 'Algebra', notes: 'x'.repeat(4000), summary: 'A useful idea', archived: true, updatedAt: '2026-09-24T10:00:00Z' };
  const notes = normalizeNotebook([null, n, n]);
  assert.equal(notes.length, 1); assert.equal(notes[0].notes.length, 3500); assert.equal(notes[0].archived, true);
  assert.match(notebookMarkdown(notes), /# Algebra/); assert.match(notebookMarkdown(notes), /A useful idea/);
  assert.equal(normalizeNotebook(Array.from({ length: 80 }, (_, i) => ({ ...n, id: String(i) }))).length, 60);
});

test('report exports actual counts and every current question has a unique scheduling key', () => {
  assert.equal(Object.keys(QUESTION_INDEX).length, Object.values(COURSES).reduce((n, c) => n + c.questions.length, 0));
  const report = reportCsv(revisionAnalytics([attempt()], [], seedSchedule([attempt()]), new Date('2026-09-24T12:00:00Z')));
  assert.equal(report.split('\r\n').length, 14); assert.match(report, /"1","1","100","1","267"/);
});
test('subject revision insights exclude other subjects and unassigned focus sessions', () => {
  const science=COURSES.science.questions[0],answers=[attempt({correct:false}),attempt({subject:'science',question:science.q,questionId:science.id,correct:false})];
  const sessions=[{kind:'focus',minutes:20,finishedAt:'2026-09-01T10:00:00Z'},{kind:'focus',subject:'maths',minutes:12,finishedAt:'2026-09-01T10:00:00Z'}];
  const result=revisionAnalytics(answers,sessions,seedSchedule(answers),new Date('2026-09-03T12:00:00Z'),'maths');
  assert.equal(result.week.total,1);assert.equal(result.week.minutes,12);assert.equal(result.due,1);
  assert.deepEqual(result.subjects.map(s=>s.subject),['maths']);assert.ok(result.topics.every(t=>t.subject==='maths'));
});
