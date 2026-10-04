import React,{useEffect,useRef,useState} from 'react';
import {ArrowRight,Check,Coins,Gift,Grab,Sparkles} from 'lucide-react';
import {useApp} from '../../context.jsx';
import {useT} from '../../i18n.jsx';
import {dayKey} from '../../study.js';
import {CLAW_PRIZES} from '../../activityRewards.js';
import {normalizeCharacter} from '../../character.js';
import {CharacterAvatar} from '../buddy/CharacterAvatar.jsx';
import s from './Activities.module.css';

export default function DailyClaw(){
 const tr=useT(),{prefs,transact,notify,playSound}=useApp(),[day,setDay]=useState(dayKey()),[position,setPosition]=useState(50),[grabbing,setGrabbing]=useState(false),[revealed,setRevealed]=useState(false),timer=useRef();
 const used=prefs.claw?.day===day,prize=used?CLAW_PRIZES.find(p=>p.id===prefs.claw.prize):null;
 const calm=prefs.reduceMotion||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 useEffect(()=>{const tick=setInterval(()=>setDay(dayKey()),1000);return()=>{clearInterval(tick);clearTimeout(timer.current)}},[]);
 function grab(){
   if(grabbing)return;const random=crypto.getRandomValues(new Uint32Array(1))[0]%CLAW_PRIZES.length;
   const result=transact('claw',random);if(result.error){notify(tr(result.error));return;}
   setRevealed(false);setGrabbing(true);playSound('click');
   timer.current=setTimeout(()=>{setGrabbing(false);setRevealed(true);playSound('reward')},calm?100:3200);
 }
 const slot=id=>id==='starlight'?'effect':'accessory';
 return <div className={s.page} data-activity="claw"><header className={s.hero}><div><span className={s.eyebrow}><Gift size={18}/>{tr('A LITTLE DAILY SURPRISE')}</span><h1>{tr('Something good is waiting.')}</h1><p>{tr('One free play each day. A new look, or a boost for your next learning session.')}</p><div className={s.chips}><span>{tr('Always a prize')}</span><span>{tr('No coins required')}</span></div></div><div className={s.giftArt} aria-hidden="true"><Gift size={80}/><Sparkles size={30}/></div></header>
 <div className={s.clawLayout}><section className={s.machineWrap}><div className={s.machine} data-grabbing={grabbing} data-calm={calm} style={{'--claw-x':position+'%'}}><header><span>ASTER</span><strong>{tr('DAILY DROP')}</strong><i/></header><div className={s.glass} aria-label={tr('Daily prize claw machine')} role="img"><div className={s.rail}/><div className={s.clawAssembly}><div className={s.cable}/><svg viewBox="0 0 100 100" className={s.clawHead} aria-hidden="true"><path d="M50 0v28M35 32 15 57l10 30m40-55 20 25-10 30M50 32v50" fill="none" stroke="#a3bed3" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/><circle cx="50" cy="30" r="15" fill="#507eb8"/><circle cx="50" cy="30" r="6" fill="#e4f8ff"/></svg>{grabbing&&<span className={s.captured}><Gift size={27}/></span>}</div><span className={s.glassShine}/><div className={s.capsules}>{Array.from({length:9},(_,i)=><span key={i} style={{'--i':i,'--capsule-x':(i%5)*19+'%','--capsule-y':Math.floor(i/5)*53+3+'px','--capsule-color':['#99cce9','#b6a8e5','#e8bb91','#93d0bf'][i%4]}}>{i%3===0?<Sparkles size={23}/>:i%3===1?<Gift size={23}/>:<Coins size={23}/>}</span>)}</div></div><div className={s.machineConsole}><label>{tr('Move the claw')}<input type="range" aria-label={tr('Claw position')} min="18" max="82" value={position} disabled={used||grabbing} onChange={e=>setPosition(Number(e.target.value))}/></label><button disabled={used||grabbing} onClick={grab}><Grab size={20}/>{tr(grabbing?'Picking your prize…':used?'Played today':'Drop claw')}</button></div><div className={s.machineFoot}><span/><div>{tr('FREE DAILY PLAY')}</div><span/></div></div><p className={s.fine}>{tr('Claw position is for fun. Each of the four rewards has an equal chance. An already-owned cosmetic becomes a double-coin boost. Resets at midnight in Europe/Berlin.')}</p></section>
 <aside className={s.prizeShelf}><span className={s.eyebrow}>{tr('THE PRIZE SHELF')}</span><h2>{tr('A little more you.')}</h2><p>{tr('Cosmetics go straight to your avatar wardrobe. A coin boost lasts for the rest of the day.')}</p><div className={s.prizes}>{CLAW_PRIZES.map(item=><article key={item.id}>{item.id==='double'?<div className={s.boostIcon}>2×<Coins size={25}/></div>:<CharacterAvatar value={{...normalizeCharacter(prefs.character),owned:[...(prefs.character?.owned||[]),item.id],[slot(item.id)]:item.id}}/>}<div><h3>{tr(item.name)}</h3><small>25% · {tr(item.id==='double'?'Today only':'Keep forever')}</small></div></article>)}</div>
 {prize&&!grabbing&&<section className={s.prizeResult} role="status" data-revealed={revealed}><span><Check size={17}/>{tr('Your prize is saved')}</span><h2>{tr(prize.name)}</h2><p>{tr(prize.detail)}</p><a href={prize.id==='double'?'#/math-game':'#/profile'}>{tr(prize.id==='double'?'Play a maths round':'Open my wardrobe')}<ArrowRight size={16}/></a><small>{tr('Your next free play is tomorrow.')}</small></section>}
 </aside></div></div>;
}
