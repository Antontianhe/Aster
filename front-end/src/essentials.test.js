import test from 'node:test';
import assert from 'node:assert/strict';
import { quickTask, choosePriority, changeTaskStatus, boardSummary, validDay } from './taskBoard.js';
import { parseBackup, planImport, undoImport, writeImport, BACKUP_SECTIONS, IMPORT_RECEIPT_KEY } from './backup.js';
import { HOMEWORK_KEY } from './homework.js';
import { SAMPLE_SET } from './studySets.js';

const task = (id = 'local-a', patch = {}) => ({ ...quickTask({ title: 'Check expanding brackets', course: 'maths', due: '2026-09-24', estimateMinutes: 25 }, id), ...patch });
const backup = patch => JSON.stringify({ app: 'Aster', version: 4, ...patch });
const note = (id = 'note-a', patch = {}) => ({ id, subject: 'maths', title: 'Factorising', cue: 'What is the common factor?', notes: 'Look at every term.', summary: 'Factor all terms.', updatedAt: '2026-09-24T09:00:00Z', ...patch });

test('task status remains shared with homework completion and does not mutate input', () => {
  const tasks = [task()]; const doing = changeTaskStatus(tasks, 'local-a', 'doing');
  assert.equal(doing[0].status, 'doing'); assert.equal(doing[0].done, false); assert.equal(tasks[0].status, 'todo');
  const done = changeTaskStatus(doing, 'local-a', 'done'); assert.equal(done[0].done, true);
  assert.equal(changeTaskStatus(done, 'local-a', 'todo')[0].done, false);
  assert.equal(changeTaskStatus(tasks, 'local-a', 'invented'), tasks);
});
test('today priorities cap at three open tasks, completed tasks release a slot, new days start clear', () => {
  let tasks = [0, 1, 2, 3].map(i => task('local-' + i));
  for (let i = 0; i < 3; i++) tasks = choosePriority(tasks, 'local-' + i, '2026-09-24');
  assert.throws(() => choosePriority(tasks, 'local-3', '2026-09-24'), /three/);
  tasks = changeTaskStatus(tasks, 'local-0', 'done'); tasks = choosePriority(tasks, 'local-3', '2026-09-24');
  assert.equal(tasks.filter(t => !t.done && t.plannedFor === '2026-09-24').length, 3);
  const reopened = changeTaskStatus(tasks, 'local-0', 'todo');
  assert.equal(reopened[0].plannedFor, null);
  assert.equal(reopened.filter(t => !t.done && t.plannedFor === '2026-09-24').length, 3);
  assert.equal(boardSummary(tasks, new Date('2026-09-25T12:00:00Z')).priorities.length, 0);
  assert.equal(choosePriority(tasks, 'local-3', '2026-09-24')[3].plannedFor, null);
});
test('workload totals ignore completed tasks and respect Berlin all-day deadlines', () => {
  const data = [task(), task('local-b', { done: true }), task('local-c', { due: null, estimateMinutes: 0 }), task('local-d', { due: '2026-09-23', status: 'doing' })];
  const view = boardSummary(data, new Date('2026-09-24T21:59:00Z'));
  assert.equal(view.today, '2026-09-24'); assert.equal(view.open, 3); assert.equal(view.overdue, 1);
  assert.equal(view.days[0].minutes, 25); assert.equal(view.days[0].count, 1); assert.equal(view.unestimated, 1); assert.equal(view.doing, 1);
  assert.equal(boardSummary(data, new Date('2026-09-24T22:01:00Z')).overdue, 2);
});
test('quick capture rejects invalid calendar dates and inherited subject names', () => {
  for (const day of ['2026-02-30', '2026-13-01', '2026-2-01', null]) assert.equal(validDay(day), false);
  assert.equal(validDay('2028-02-29'), true);
  assert.throws(() => quickTask({ title: ' ', course: 'maths' }), /title/);
  assert.throws(() => quickTask({ title: 'x', course: '__proto__' }), /subject/);
  assert.throws(() => quickTask({ title: 'x', course: 'maths', due: '2026-02-30' }), /date/);
});
test('backup parser rejects unsupported files and malformed sections without accepting account settings', () => {
  for (const raw of ['{', '{}', backup({ version: 999 }), backup({ homework: {} }), 'x'.repeat(5000001)]) assert.throws(() => parseBackup(raw));
  const parsed = parseBackup(backup({ homework: [task()], prefs: { proPreview: true }, coins: 9999 }));
  assert.deepEqual(Object.keys(parsed.sections), BACKUP_SECTIONS.map(s => s.id)); assert.equal(parsed.sections.homework.length, 1);
});
test('backup parser skips invalid rows and repeated identities, strips unsafe URLs and extra fields', () => {
  const parsed = parseBackup(backup({ homework: [task(), task(), task('bad', { course: 'constructor' }), task('local-b', { source: 'javascript:alert(1)', extra: 'ignored' })], studySets: [{ ...SAMPLE_SET, id: 'set-example' }], notebook: [note('x', { subject: '__proto__' })] }));
  assert.equal(parsed.sections.homework.length, 2); assert.equal(parsed.skipped.homework, 2); assert.equal(parsed.skipped.notebook, 1);
  assert.equal(parsed.sections.homework[1].source, ''); assert.equal(parsed.sections.homework[1].extra, undefined); assert.equal(parsed.sections.studySets.length, 1);
});
test('import skips identical content, preserves conflicting current versions, and copies on request', async () => {
  const existing = [task()], parsed = parseBackup(backup({ homework: [task('local-a', { title: 'Older version' }), task('local-other')] }));
  const kept = await planImport(parsed, { homework: existing }, ['homework']);
  assert.equal(kept.added, 0); assert.equal(kept.rows[0].conflicts, 1); assert.equal(kept.rows[0].duplicates, 1); assert.equal(existing[0].title, 'Check expanding brackets');
  const copied = await planImport(parsed, { homework: existing }, ['homework'], 'copies', () => 'local-copy');
  assert.equal(copied.added, 1); assert.equal(copied.updates.homework[1].id, 'local-copy'); assert.equal(copied.updates.homework[0], existing[0]);
  assert.equal(copied.receipt.items.homework[0].signature.length, 64);
});
test('school tasks with unknown source IDs become recoverable personal tasks and do not take priority slots', async () => {
  const parsed = parseBackup(backup({ homework: [task('unrecognised-school', { plannedFor: '2026-09-24' })] }));
  const plan = await planImport(parsed, {}, ['homework'], 'keep', () => 'local-recovered');
  assert.equal(plan.updates.homework[0].id, 'local-recovered'); assert.equal(plan.updates.homework[0].plannedFor, null);
});
test('repeat imports are idempotent and unrelated sections stay untouched', async () => {
  const parsed = parseBackup(backup({ homework: [task()], notebook: [note()] }));
  const first = await planImport(parsed, {}, ['homework']); assert.equal(first.updates.notebook, undefined);
  const second = await planImport(parsed, first.updates, ['homework']); assert.equal(second.added, 0); assert.equal(second.updates.homework.length, 1);
});
test('undo removes only imported items that remain unchanged, preserving edits and pre-existing work', async () => {
  const original = note('original'), parsed = parseBackup(backup({ notebook: [note('import-a'), note('import-b', { title: 'B' })] }));
  const plan = await planImport(parsed, { notebook: [original] }, ['notebook']);
  // Same content as the pre-existing note is skipped. Only B was imported.
  assert.equal(plan.added, 1);
  const undone = await undoImport(plan.updates, plan.receipt); assert.equal(undone.removed, 1); assert.equal(undone.updates.notebook[0], original);
  const edited = { notebook: plan.updates.notebook.map(n => n.id === 'import-b' ? { ...n, notes: 'My changes' } : n) };
  const protectedUndo = await undoImport(edited, plan.receipt); assert.equal(protectedUndo.kept, 1); assert.equal(protectedUndo.removed, 0);
});
test('import limits fail before changing current work', async () => {
  const parsed = parseBackup(backup({ notebook: [note('new', { title: 'New' })] }));
  const full = Array.from({ length: 60 }, (_, i) => note(String(i), { title: String(i) }));
  await assert.rejects(planImport(parsed, { notebook: full }, ['notebook']), /Too many/); assert.equal(full.length, 60);
});
test('storage transaction rolls back all sections and receipt if a write fails', () => {
  const saved = new Map([[HOMEWORK_KEY, 'old tasks'], [IMPORT_RECEIPT_KEY, 'old receipt']]); let writes = 0;
  const store = { getItem: key => saved.get(key) ?? null, removeItem: key => saved.delete(key), setItem: (key, value) => { if (++writes === 2) throw new Error('quota'); saved.set(key, value); } };
  assert.throws(() => writeImport({ homework: [task()], notebook: [note()] }, store, { items: {} }), /could not be saved/);
  assert.equal(saved.get(HOMEWORK_KEY), 'old tasks'); assert.equal(saved.get(IMPORT_RECEIPT_KEY), 'old receipt'); assert.equal(saved.size, 2);
});
