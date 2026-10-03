import React, { useEffect, useRef, useState } from 'react';
import { ArchiveRestore, CheckCircle2, Download, FileJson, ShieldCheck, Undo2, Upload } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { useT } from '../../i18n.jsx';
import { useAuth } from '../../auth.jsx';
import { readStored } from '../../study.js';
import { storage } from '../../storage.js';
import { cleanHTML } from '../../studio.js';
import { BACKUP_SECTIONS, IMPORT_RECEIPT_KEY, parseBackup, planImport, undoImport, writeImport } from '../../backup.js';
import { PageHeading, Button } from '../UI.jsx';
import s from './Essentials.module.css';

export default function BackupRecovery() {
  const tr = useT(), { user, sync } = useAuth();
  const { homework, studySets, setHomework, setStudySets, exportBackup } = useApp();
  const [parsed, setParsed] = useState(null), [name, setName] = useState(''), [selected, setSelected] = useState([]), [mode, setMode] = useState('keep');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [result, setResult] = useState(null), [receipt, setReceipt] = useState(() => readStored(IMPORT_RECEIPT_KEY, null));
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  function current() { return Object.fromEntries(BACKUP_SECTIONS.map(section => [section.id, section.id === 'homework' ? homework : section.id === 'studySets' ? studySets : readStored(section.key, [])])); }
  function commit(updates, nextReceipt) {
    writeImport(updates, storage, nextReceipt);
    if (updates.homework) setHomework(updates.homework);
    if (updates.studySets) setStudySets(updates.studySets);
    setReceipt(nextReceipt);
  }
  async function choose(e) {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file || lock.current) return;
    lock.current = true; setBusy(true); setError(''); setParsed(null); setResult(null);
    try {
      if (file.size > 5000000) throw new Error('Choose an Aster backup smaller than 5 MB.');
      const data = parseBackup(await file.text());
      data.sections.writing = data.sections.writing.map(doc => ({ ...doc, html: cleanHTML(doc.html) }));
      setParsed(data); setName(file.name); setSelected(BACKUP_SECTIONS.filter(section => data.sections[section.id].length).map(section => section.id));
    } catch (err) { setError(err.message); }
    finally { lock.current = false; setBusy(false); }
  }
  async function importWork() {
    if (!parsed || !selected.length || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const plan = await planImport(parsed, current(), selected, mode);
      if (!mounted.current) return;
      if (plan.added) commit(plan.updates, plan.receipt);
      setResult({ type: 'import', ...plan }); setParsed(null);
    } catch (err) { setError(err.message); }
    finally { lock.current = false; setBusy(false); }
  }
  async function undo() {
    if (!receipt || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { const plan = await undoImport(current(), receipt); if (!mounted.current) return; commit(plan.updates, null); setResult({ type: 'undo', ...plan }); }
    catch (err) { setError(err.message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className={s.root}>
    <PageHeading eyebrow={tr('YOUR WORK, IN YOUR HANDS')} title={tr('Backup & recovery')} description={tr('Keep a copy. Bring work back. Carry on with confidence.')}/>
    <div className={s.storageStatus}><ShieldCheck size={21}/><span><strong>{tr(user ? 'Account workspace' : 'Browser workspace')}</strong><small>{tr(user ? sync === 'saved' ? 'Your account is up to date.' : sync === 'error' ? 'Account sync needs attention. Download a backup.' : 'Changes are syncing to your local account.' : 'Guest work lives in this browser. Keep a backup before clearing browser data.')}</small></span></div>
    <div className={s.recoveryGrid}>
      <section className={s.recoveryCard}><span className={s.featureIcon}><Download size={24}/></span><span className={s.kicker}>{tr('01 · KEEP A COPY')}</span><h2>{tr('Take your work with you.')}</h2><p>{tr('Download your study workspace, including progress, preferences, tasks, notes, and writing.')}</p><Button disabled={busy} onClick={exportBackup}><Download size={17}/>{tr('Download a backup')}</Button><small>{tr('Keep the file private. It can contain personal school information.')}</small></section>
      <section className={s.recoveryCard}><span className={s.featureIcon}><ArchiveRestore size={24}/></span><span className={s.kicker}>{tr('02 · BRING WORK BACK')}</span><h2>{tr('Recover without replacing.')} </h2><p>{tr('Import tasks, study notes, writing projects, and study sets. Your existing work stays here.')}</p><label className={s.upload}><Upload size={17}/>{tr(busy ? 'Working…' : 'Choose a backup')}<input type="file" accept=".json,application/json" onChange={choose} disabled={busy} aria-label={tr('Choose an Aster backup file')}/></label><small>{tr('Aster JSON · up to 5 MB. Review the contents before importing.')}</small></section>
    </div>
    <p className={s.footnote}>{tr('Import restores these four kinds of work only. Progress, coins, membership, passwords, school connections, and privacy choices are not imported.')}</p>
    {error && <p className={s.error} role="alert">{tr(error)}</p>}
    {parsed && <section className={s.importPreview} aria-labelledby="import-heading"><header><FileJson size={23}/><div><h2 id="import-heading">{tr('Review your import')}</h2><p>{name}</p></div></header><div className={s.sectionChoices}>{BACKUP_SECTIONS.map(section => <label key={section.id}><input type="checkbox" disabled={busy || !parsed.sections[section.id].length} checked={selected.includes(section.id)} onChange={e => setSelected(v => e.target.checked ? [...v, section.id] : v.filter(id => id !== section.id))}/><span><strong>{tr(section.label)}</strong><small>{parsed.sections[section.id].length} {tr('ready to import')}{parsed.skipped[section.id] > 0 && ` · ${parsed.skipped[section.id]} ${tr('invalid or duplicate items skipped')}`}</small></span></label>)}</div><fieldset disabled={busy} className={s.conflicts}><legend>{tr('If an older version has the same identity')}</legend><label><input type="radio" name="import-mode" checked={mode === 'keep'} onChange={() => setMode('keep')}/><span>{tr('Keep my current version')}<small>{tr('Skip conflicting items. Recommended.')}</small></span></label><label><input type="radio" name="import-mode" checked={mode === 'copies'} onChange={() => setMode('copies')}/><span>{tr('Add a separate copy')}<small>{tr('Keep both versions so I can compare them.')}</small></span></label></fieldset><p>{tr('Identical content is skipped automatically. Imported tasks do not change today’s priorities.')}</p><Button disabled={busy || !selected.length} onClick={importWork}><ArchiveRestore size={17}/>{tr(busy ? 'Working…' : 'Import selected work')}</Button></section>}
    {result && <section className={s.success} role="status"><CheckCircle2 size={23}/><div><h2>{tr(result.type === 'import' ? result.added ? 'Your work is back.' : 'Your workspace is already up to date.' : 'Import undone.')}</h2>{result.type === 'import' ? <ul>{result.rows.map(row => <li key={row.id}><strong>{tr(BACKUP_SECTIONS.find(section => section.id === row.id).label)}</strong>: {row.added} {tr('added')} · {row.duplicates} {tr('duplicates skipped')} · {row.conflicts} {tr('conflicts kept')}</li>)}</ul> : <p>{result.removed} {tr('imported items removed')} · {result.kept} {tr('edited items kept')}</p>}</div></section>}
    {receipt?.items && <section className={s.undoPanel}><div><h2>{tr('Undo the last import')}</h2><p>{tr('Only unchanged items from the last import will be removed. Anything you edited will stay.')}</p></div><Button variant="secondary" onClick={undo} disabled={busy}><Undo2 size={17}/>{tr('Undo last import')}</Button></section>}
    <div className={s.backupLinks}><a href="#/data">{tr('Privacy & your data')}</a><a href="#/settings">{tr('Preferences')}</a></div>
  </div>;
}
