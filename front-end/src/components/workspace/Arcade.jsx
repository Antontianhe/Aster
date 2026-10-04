import ActivityLinks from '../activities/ActivityLinks.jsx';
import {VideoArcade} from '../games/VideoArcade.jsx';
import {storage} from '../../storage.js';
import { useT } from "../../i18n.jsx";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Zap, Grid2X2, GitMerge, ShieldCheck, SpellCheck, ArrowDownWideNarrow, Gamepad2, ArrowUpRight, ArrowRight, Trophy, Play, Sparkles, RotateCcw } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { COURSES, readStored } from '../../study.js';
import { BUILTIN_DECKS } from '../../studySets.js';
import { GAME_MODES, ARCADE_KEY, normalizeArcade, wordCards } from '../../arcade.js';
import { PageHeading, Modal, Button } from '../UI.jsx';
import { ReviewBoundary } from '../neon/ReviewBoundary.jsx';
import { GlowCard } from '../neon/GlowCard.jsx';
import { RecallGame, MemoryGame, ConnectGame, VerificationGame, WordGame, OrderGame } from './ArcadeGames.jsx';
import s from './Workspace.module.css';
import g from './Arcade.module.css';
const ICONS = {
  Zap,
  Grid2X2,
  GitMerge,
  ShieldCheck,
  SpellCheck,
  ArrowDownWideNarrow
};
const GAMES = {
  recall: RecallGame,
  memory: MemoryGame,
  match: ConnectGame,
  verify: VerificationGame,
  words: WordGame,
  order: OrderGame
};
export default function Arcade() {
  const tr = useT();
  const {
    studySets,
    navigate,
    prefs,
    notify
  } = useApp();
  const decks = useMemo(() => [...BUILTIN_DECKS, ...studySets], [studySets]);
  const [selected, setSelected] = useState('course-music'),
    [game, setGame] = useState(null),
    [stats, setStats] = useState(() => normalizeArcade(readStored(ARCADE_KEY, {})));
  const deck = decks.find(d => d.id === selected) || decks[0];
  useEffect(() => {
    try {
      storage.setItem(ARCADE_KEY, JSON.stringify(stats));
    } catch {
      notify('Arcade records could not be saved in this browser.');
    }
  }, [stats, notify]);
  const complete = useCallback((mode, deckId, result) => setStats(v => {
    const key = mode + ':' + deckId,
      previous = v[key] || {
        plays: 0,
        best: 0
      };
    return {
      ...v,
      [key]: {
        plays: previous.plays + 1,
        best: Math.max(previous.best, Math.round(result.score / result.total * 100))
      }
    };
  }), []);
  const plays = Object.values(stats).reduce((sum, v) => sum + v.plays, 0);
  return <><PageHeading eyebrow={tr("A DIFFERENT WAY IN")} title={tr("The study arcade.")} description={tr("Short challenges that turn your course material into something you can play.")} /><ActivityLinks/><VideoArcade/><h2>{tr("Study challenges")}</h2><div className={`${s.pageHero} ${g.arcadeHero}`}><div><span className={s.kicker}>{tr("SIX WAYS TO PUT KNOWLEDGE TO WORK")}</span><h2>{tr("Switch the format.")}<br />{tr("Keep making progress.")}</h2><p>{tr("Recall, connect, decode, and reason. Every challenge has a clear finish and feedback you can use.")}</p><span className={s.pill}><Trophy size={13} />{tr(plays)}{tr(" challenges completed")}</span></div><div className={g.arcadeOrb}><Gamepad2 size={67} /><span /><i /></div></div><div className={s.toolbar}><div><h2>{tr("Choose your material")}</h2><p className={s.fine}>{tr(decks.length)}{tr(" decks · ")}{tr(decks.reduce((sum, d) => sum + d.cards.length, 0))}{tr(" recall cards · new sets become playable immediately")}</p></div><button className="text-link" onClick={() => navigate('resources')}>{tr("Add study material ")}<ArrowUpRight size={16} /></button></div><div className={g.deckPicker}><label htmlFor="arcade-deck">{tr("PLAY WITH")}</label><select id="arcade-deck" value={deck.id} onChange={e => setSelected(e.target.value)}>{tr(decks.map(d => <option key={d.id} value={d.id}>{tr(COURSES[d.subject].name)}{tr(" · ")}{tr(d.title)}{tr(d.custom ? ' · Your set' : '')}</option>))}</select><span>{tr(deck.cards.length)}{tr(" cards")}</span></div><div className={g.gameGrid}>{tr(GAME_MODES.map(mode => {
        const Icon = ICONS[mode.icon];
        const disabled = mode.id === 'words' && !wordCards(deck).length;
        const record = stats[mode.id + ':' + (mode.id === 'order' ? 'maths' : deck.id)];
        return <GlowCard key={mode.id} tilt={!prefs.reduceMotion} className={g.gameCard}><div style={{
            '--game-color': mode.color
          }} className={g.gameCardInner}><span className={g.gameIcon}><Icon size={30} /></span><span className={s.kicker}>{tr(mode.tag)}</span><h3>{tr(mode.name)}</h3><p>{tr(mode.description)}</p><div className={g.gameRecord}><span>{tr(record ? `${record.plays} plays · best ${record.best}%` : 'Ready for your first round')}</span>{tr(mode.id === 'order' && <small>{tr("Maths · independent of deck")}</small>)}</div><Button variant="secondary" disabled={disabled} onClick={() => setGame({
              mode: mode.id,
              deck: mode.id === 'order' ? BUILTIN_DECKS.find(d => d.subject === 'maths') : deck,
              key: crypto.randomUUID()
            })}><Play size={14} />{tr(disabled ? 'Choose a word-based deck' : 'Play challenge')}<ArrowRight size={16} /></Button></div></GlowCard>;
      }))}</div><div className={s.notice}><Sparkles size={20} /><span>{tr("New study sets supply fresh questions and answers to these game templates. No automatic Schoolbox ingestion or new game-code generation happens in the background. Number flow has its own maths challenges.")}</span></div>{tr(game && <ReviewBoundary key={game.key} onClose={() => setGame(null)}><ArcadeSession mode={game.mode} deck={game.deck} onClose={() => setGame(null)} onComplete={complete} onReplay={() => setGame(v => ({
        ...v,
        key: crypto.randomUUID()
      }))} /></ReviewBoundary>)}</>;
}
function ArcadeSession({
  mode,
  deck,
  onClose,
  onComplete,
  onReplay
}) {
  const tr = useT();
  const {
    recordReview
  } = useApp();
  const [result, setResult] = useState(null),
    [exit, setExit] = useState(false);
  const saved = useRef(false),
    started = useRef(Date.now());
  const definition = GAME_MODES.find(m => m.id === mode),
    Game = GAMES[mode];
  function finish(value) {
    if (saved.current) return;
    saved.current = true;
    setResult(value);
    recordReview(deck.subject, value.score, value.total, Math.max(1, Math.round((Date.now() - started.current) / 60000)), 'arcade');
    onComplete(mode, mode === 'order' ? 'maths' : deck.id, value);
  }
  return <><Modal title={tr(definition.name)} size="large" onClose={() => result ? onClose() : setExit(true)}><div className={g.session}>{tr(result ? <div className={g.result}><div className={g.resultBadge}><Trophy size={43} /></div><span className={s.kicker}>{tr("CHALLENGE COMPLETE")}</span><h2>{tr(result.score === result.total ? 'Strong finish.' : 'Good practice. Keep going.')}</h2><p>{tr(result.score)}{tr(" of ")}{tr(result.total)} {tr(result.label)}{tr(".")}</p><div className={g.resultStats}><div><strong>{tr("+")}{tr(result.score * 5)}</strong><span>{tr("XP earned")}</span></div><div><strong>{tr(Math.round(result.score / result.total * 100))}{tr("%")}</strong><span>{tr(mode === 'memory' ? 'Pairs found' : 'Challenge score')}</span></div></div><p className={g.hint}>{tr("Your game record and learning progress are saved in this browser.")}</p><div className={g.gameActions}><Button variant="secondary" onClick={onReplay}><RotateCcw size={16} />{tr("Play again")}</Button><Button onClick={onClose}>{tr("Back to arcade ")}<ArrowRight size={16} /></Button></div></div> : <><div className={g.sessionDeck}><span>{tr(COURSES[deck.subject].name)}</span><small>{tr(mode === 'order' ? 'Numbers, roots & powers' : deck.title)}</small></div><Game deck={deck} onFinish={finish} /></>)}</div></Modal>{tr(exit && <Modal title={tr("Leave this challenge?")} size="small" onClose={() => setExit(false)}><div className={s.dialogBody}><p>{tr("Your completed challenges are saved. This round will restart if you leave.")}</p><div className={s.actions}><Button variant="secondary" onClick={onClose}>{tr("Leave challenge")}</Button><Button onClick={() => setExit(false)}>{tr("Keep playing")}</Button></div></div></Modal>)}</>;
}
