import { useT } from "../i18n.jsx";
import React, { useRef, useState } from 'react';
import { Upload, Download, Layers3, Trash2, ArrowUpRight } from 'lucide-react';
import { useApp } from '../context.jsx';
import { COURSES } from '../study.js';
import { validateStudySet, SAMPLE_SET } from '../studySets.js';
import { Flashcards } from './StudyTools.jsx';
import { ReviewBoundary } from './neon/ReviewBoundary.jsx';
import { Button, External } from './UI.jsx';
import s from './workspace/Workspace.module.css';
export function StudySets() {
  const tr = useT();
  const {
    studySets,
    setStudySets,
    notify,
    navigate
  } = useApp();
  const input = useRef(null);
  const [error, setError] = useState(''),
    [deck, setDeck] = useState(null);
  async function importSet(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      if (file.size > 500000) throw new Error('Keep the file below 500 KB.');
      if (studySets.length >= 30) throw new Error('You have 30 study sets. Remove one before adding another.');
      const data = validateStudySet(JSON.parse(await file.text()));
      data.id = `set-${crypto.randomUUID()}`;
      setStudySets(v => [...v, data]);
      notify(`Added ${data.title}. It is ready for flashcards and the arcade.`);
    } catch (err) {
      setError(err instanceof SyntaxError ? 'This file is not valid JSON. Download the example to see the format.' : err.message);
    }
  }
  function example() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(SAMPLE_SET, null, 2)], {
      type: 'application/json'
    }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aster-study-set-example.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function remove(item) {
    setStudySets(v => v.filter(d => d.id !== item.id));
    notify('Study set removed.', {
      label: 'Undo',
      run: () => setStudySets(v => v.some(d => d.id === item.id) ? v : [...v, item])
    });
  }
  return <section className={s.studySets}><div className={s.sectionHead}><div><span className={s.kicker}>{tr("YOUR MATERIAL, MORE WAYS TO LEARN")}</span><h2>{tr("Personal study sets")}</h2><p>{tr("Add a question-and-answer deck. Flashcards and arcade challenges adapt to its content.")}</p></div><Button onClick={() => input.current?.click()}><Upload size={16} />{tr("Import a study set")}</Button></div><input ref={input} type="file" accept="application/json,.json" hidden onChange={importSet} /><div className={s.notice}><span>{tr("JSON · 4–200 cards per set · stored in this browser. Check answers and sources before importing. Reusing a deck creates new challenges within existing game formats.")}</span><button onClick={example}><Download size={16} />{tr("Example format")}</button></div>{tr(error && <p role="alert" className={s.error}>{tr(error)}</p>)}<div className={s.deckGrid}>{tr(studySets.map(item => <article className={s.panel} key={item.id}><span className={s.kicker}>{tr(COURSES[item.subject].name)}{tr(" · ")}{tr(item.cards.length)}{tr(" cards")}</span><h3>{tr(item.title)}</h3><p>{tr(item.source ? 'Source linked · user-added content' : 'User-added content · source not provided')}</p><div className={s.actions}><Button variant="secondary" onClick={() => setDeck(item)}><Layers3 size={16} />{tr("Review")}</Button><button className="icon-button" aria-label={tr(`Remove ${item.title}`)} onClick={() => remove(item)}><Trash2 size={17} /></button>{tr(item.source && <External href={item.source} aria-label={tr(`Source for ${item.title}`)} />)}</div></article>))}</div>{tr(!studySets.length && <p className={s.muted}>{tr("Your course decks are already in the arcade. Add your own material here to expand them.")}</p>)}<button className="text-link" onClick={() => navigate('arcade')}>{tr("Explore the arcade ")}<ArrowUpRight size={15} /></button>{tr(deck && <ReviewBoundary onClose={() => setDeck(null)}><Flashcards subject={deck.subject} deck={deck} onClose={() => setDeck(null)} /></ReviewBoundary>)}</section>;
}
