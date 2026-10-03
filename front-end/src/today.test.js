import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyQuestion, savedDailyChoice } from './today.js';
import { COURSES } from './study.js';

test('daily question is stable, rotates subjects, and always has a valid answer', () => {
  const subjects = new Set();
  for (let day = 1; day <= 28; day++) {
    const date = `2026-10-${String(day).padStart(2, '0')}`;
    const first = dailyQuestion(date, COURSES);
    assert.deepEqual(first, dailyQuestion(date, COURSES));
    assert.ok(first.question.options[first.question.a]);
    assert.ok(first.question.why);
    subjects.add(first.subject);
  }
  assert.equal(subjects.size, 4);
});

test('missing or unsuitable questions produce a graceful empty state', () => {
  assert.equal(dailyQuestion('2026-10-03', {}), null);
  assert.equal(dailyQuestion('not-a-date', COURSES), null);
  assert.equal(dailyQuestion('2026-10-03', { maths: { questions: [{ id: 'bad', q: 'Question', options: ['a'], a: 4 }] } }), null);
});

test('a saved answer belongs only to that date and question', () => {
  const { question } = dailyQuestion('2026-10-03', COURSES);
  const saved = { day: '2026-10-03', id: question.id, choice: 0 };
  assert.equal(savedDailyChoice(saved, saved.day, question), 0);
  assert.equal(savedDailyChoice(saved, '2026-10-04', question), null);
  assert.equal(savedDailyChoice({ ...saved, id: 'other' }, saved.day, question), null);
  assert.equal(savedDailyChoice({ ...saved, choice: -1 }, saved.day, question), null);
  assert.equal(savedDailyChoice({ ...saved, choice: 99 }, saved.day, question), null);
});
