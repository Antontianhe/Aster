import { COURSES } from './study.js';
import { HOMEWORK_KEY, SEED_HOMEWORK } from './homework.js';
import { NOTEBOOK_KEY, normalizeNotebook } from './revision.js';
import { STUDIO_KEY, normalizeDocuments } from './studio.js';
import { STUDY_SETS_KEY, validateStudySet, safeSource } from './studySets.js';
import { validDay, taskEstimate } from './taskBoard.js';

export const IMPORT_RECEIPT_KEY = 'aster-last-import-v1';
export const BACKUP_SECTIONS = [
  { id: 'homework', key: HOMEWORK_KEY, label: 'Tasks', limit: 500 },
  { id: 'notebook', key: NOTEBOOK_KEY, label: 'Study notes', limit: 60 },
  { id: 'writing', key: STUDIO_KEY, label: 'Writing projects', limit: 20 },
  { id: 'studySets', key: STUDY_SETS_KEY, label: 'Study sets', limit: 30 },
];
const sourceIds = new Set(SEED_HOMEWORK.map(t => t.id));
const text = (v, max) => typeof v === 'string' ? v.slice(0, max) : '';
function importedTask(t) {
  if (!t || typeof t.id !== 'string' || !t.id || typeof t.title !== 'string' || !t.title.trim() || !Object.hasOwn(COURSES, t.course)) throw new Error('Invalid task');
  const due = t.due || null;
  if (due && (typeof due !== 'string' || !Number.isFinite(Date.parse(due)) || (t.allDay && !validDay(due)))) throw new Error('Invalid task date');
  const checklist = Array.isArray(t.checklist) ? t.checklist.filter(x => typeof x === 'string').slice(0, 20).map(x => x.slice(0, 300)) : [];
  return {
    id: t.id.slice(0, 100), title: t.title.trim().slice(0, 180), course: t.course, due,
    allDay: t.allDay === true, kind: text(t.kind, 50) || 'Homework', details: text(t.details, 5000),
    priority: ['high', 'normal', 'low'].includes(t.priority) ? t.priority : 'normal',
    remindHours: [0, 1, 24, 48].includes(t.remindHours) ? t.remindHours : null,
    checklist, checks: Array.isArray(t.checks) ? [...new Set(t.checks.filter(i => Number.isInteger(i) && i >= 0 && i < checklist.length))] : [],
    done: t.done === true, status: t.status === 'doing' ? 'doing' : 'todo', estimateMinutes: taskEstimate(t),
    plannedFor: validDay(t.plannedFor) ? t.plannedFor : null, source: safeSource(t.source), sourceStatus: 'Imported backup',
  };
}
export function normalizeImportItem(section, item) {
  if (!item || typeof item.id !== 'string' || !item.id.trim() || item.id.length > 100) throw new Error('Missing item identity');
  if (section === 'homework') return importedTask(item);
  if (section === 'notebook') {
    if (!Object.hasOwn(COURSES, item.subject)) throw new Error('Unknown note subject');
    return normalizeNotebook([item])[0];
  }
  if (section === 'studySets') {
    if (!Object.hasOwn(COURSES, item.subject)) throw new Error('Unknown set subject');
    if (!/^set-[a-zA-Z0-9-]+$/.test(item.id)) throw new Error('Invalid study set identity');
    return validateStudySet(item);
  }
  if (section === 'writing') {
    const doc = normalizeDocuments([item])[0];
    if (!doc || (doc.type === 'slides' && !doc.slides.length)) throw new Error('Empty or invalid writing project');
    return { id: item.id, type: doc.type, title: doc.title, html: doc.html, slides: doc.slides, theme: doc.theme, updatedAt: Number.isFinite(Date.parse(doc.updatedAt)) ? doc.updatedAt : new Date(0).toISOString() };
  }
  throw new Error('Unsupported section');
}
export function parseBackup(raw) {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > 5000000) throw new Error('Choose an Aster backup smaller than 5 MB.');
  let value; try { value = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON. Choose an Aster backup.'); }
  if (!value || value.app !== 'Aster' || ![4, 5].includes(value.version)) throw new Error('Choose a supported Aster workspace backup (version 4 or 5).');
  const sections = {}, skipped = {};
  for (const section of BACKUP_SECTIONS) {
    const rows = value[section.id];
    if (rows !== undefined && !Array.isArray(rows)) throw new Error('A backup section has an invalid format.');
    const seen = new Set(); skipped[section.id] = 0; sections[section.id] = [];
    for (const row of (rows || []).slice(0, 1000)) {
      try {
        const item = normalizeImportItem(section.id, row);
        if (!item || seen.has(item.id)) throw new Error('Duplicate identity');
        seen.add(item.id); sections[section.id].push(item);
      } catch { skipped[section.id]++; }
    }
    skipped[section.id] += Math.max(0, (rows?.length || 0) - 1000);
  }
  return { sections, skipped, exportedAt: Number.isFinite(Date.parse(value.exportedAt)) ? value.exportedAt : null };
}

// Compare learning content, ignoring identities and display/save metadata.
export function contentSignature(item) {
  const ignored = new Set(['id', 'updatedAt', 'sourceStatus', 'pinned', 'archived', 'plannedFor']);
  const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().filter(k => !ignored.has(k)).map(k => [k, canonical(value[k])])) : value;
  return JSON.stringify(canonical(item));
}
function freshId(section) { return `${section === 'homework' ? 'local-' : section === 'studySets' ? 'set-' : ''}${crypto.randomUUID()}`; }
async function fingerprint(item) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(item)));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
export async function planImport(parsed, current, selected, mode = 'keep', idFactory = freshId) {
  const updates = {}, rows = [], receipt = { at: new Date().toISOString(), items: {} };
  for (const section of BACKUP_SECTIONS.filter(s => selected.includes(s.id))) {
    const existing = current[section.id] || [], next = [...existing], ids = new Set(existing.map(x => x.id));
    const signatures = new Set(existing.map(x => { try { return contentSignature(normalizeImportItem(section.id, x)); } catch { return contentSignature(x); } }));
    let duplicates = 0, conflicts = 0, added = 0;
    receipt.items[section.id] = [];
    for (const original of parsed.sections[section.id] || []) {
      if (signatures.has(contentSignature(original))) { duplicates++; continue; }
      const conflict = ids.has(original.id);
      if (conflict && mode !== 'copies') { conflicts++; continue; }
      const clone = { ...original };
      if (conflict || section.id === 'homework' && !clone.id.startsWith('local-') && !sourceIds.has(clone.id)) clone.id = idFactory(section.id);
      // Imported priorities should not silently fill today's plan.
      if (section.id === 'homework') clone.plannedFor = null;
      next.push(clone); ids.add(clone.id); signatures.add(contentSignature(clone)); added++;
      receipt.items[section.id].push({ id: clone.id, signature: await fingerprint(clone) });
    }
    if (next.length > section.limit) throw new Error(`Too many items in ${section.label}. Choose fewer sections or make space first.`);
    if (JSON.stringify(next).length > 450000) throw new Error(`The ${section.label} section is too large to save. Export a smaller backup.`);
    updates[section.id] = next; rows.push({ id: section.id, added, duplicates, conflicts });
  }
  return { updates, rows, receipt, added: rows.reduce((n, row) => n + row.added, 0) };
}
export async function undoImport(current, receipt) {
  const updates = {}; let removed = 0, kept = 0;
  for (const section of BACKUP_SECTIONS) {
    const entries = receipt?.items?.[section.id]; if (!Array.isArray(entries)) continue;
    const signatures = new Map(entries.map(entry => [entry.id, entry.signature]));
    updates[section.id] = [];
    for (const item of current[section.id] || []) {
      if (!signatures.has(item.id)) { updates[section.id].push(item); continue; }
      if (await fingerprint(item) !== signatures.get(item.id)) { kept++; updates[section.id].push(item); }
      else removed++;
    }
  }
  return { updates, removed, kept };
}
export function writeImport(updates, store, receipt) {
  const entries = BACKUP_SECTIONS.filter(s => updates[s.id]).map(s => [s.key, JSON.stringify(updates[s.id])]);
  if (receipt !== undefined) entries.push([IMPORT_RECEIPT_KEY, JSON.stringify(receipt)]);
  const before = entries.map(([key]) => [key, store.getItem(key)]);
  try { for (const [key, value] of entries) store.setItem(key, value); }
  catch (error) {
    for (const [key, value] of before) { try { value === null ? store.removeItem(key) : store.setItem(key, value); } catch {} }
    throw new Error('The import could not be saved. Export your current work and check browser storage space.');
  }
}
