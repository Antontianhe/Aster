import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, CalendarDays, Coins, Hand, Layers3, Sparkles } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { useT } from '../../i18n.jsx';
import { normalizeBuddy } from '../../buddies.js';
import { sceneFor } from '../../celebrations.js';
import { CompanionDuo } from '../buddy/CharacterAvatar.jsx';
import s from './StudyWorld.module.css';

function PlaceArt({ kind }) {
  return <svg viewBox="0 0 180 130" aria-hidden="true" className={s.placeArt}>
    <ellipse cx="90" cy="111" rx="67" ry="13" fill="currentColor" opacity=".09"/>
    {kind === 'learn' ? <><path d="m32 102 58 17 58-17V69H32Z" fill="#adc7e2"/><path d="m23 69 67-36 67 36-67 23Z" fill="#f2e6cb"/><path d="m43 65 47-24 47 24-47 17Z" fill="#6392c1"/><path d="M51 73v29m25-21v29m28-29v29m25-37v29" stroke="#fcf7e9" strokeWidth="9"/><path d="m32 101 58 18 58-18" stroke="#7296b8" strokeWidth="5" fill="none"/><path d="M89 36V12m0 1 32 8-32 9" stroke="#7889b9" strokeWidth="3" fill="#9eaff0"/><circle cx="90" cy="63" r="7" fill="#f5d88c"/></> : kind === 'read' ? <><path d="M44 55 88 67v48l-44-13Z" fill="#698dae"/><path d="m88 67 55-16v48l-55 16Z" fill="#fff5df"/><path d="M44 55q19-13 44 6 31-28 55-10L88 67Z" fill="#fffdf2"/><path d="m52 39 42 11 49-13-49-14Z" fill="#b7a2d5"/><path d="m52 39 42 11v13L52 51Z" fill="#9074b3"/><path d="m94 50 49-13v13L94 63Z" fill="#e8dff6"/><path d="m105 75 26-8m-26 18 26-8m-26 18 26-8" stroke="#d5c7ac" strokeWidth="3"/><path d="m71 56 5 37 8-3 8 8-4-34" fill="#e0a3a5"/><path d="m32 28 4 9 10 3-10 3-4 10-3-10-10-3 10-3Z" fill="#dcac6a"/></> : kind === 'plan' ? <><path d="m49 19 85 15-3 86-85-15Z" fill="#cfaa77"/><path d="m42 22 85 15-3 78-85-15Z" fill="#fff5df"/><path d="m56 18-1 16m17-13-1 16m17-13-1 16m17-13-1 16" stroke="#7b96ac" strokeWidth="5" strokeLinecap="round"/><g strokeWidth="3" fill="none"><path d="m55 55 4 5 8-8m-13 22 4 5 8-8" stroke="#79a698"/><path d="m75 58 35 7m-35 11 35 7m-35 11 24 5" stroke="#c7bfac"/></g><path d="m139 41 8 4-25 54-10 5 1-12Z" fill="#9b8ab6"/><path d="m112 104 2-13 9 7" fill="#e0c19d"/></> : <><path d="M86 18q43-4 45 34 1 22-20 39v14H70V91Q48 77 48 53q0-33 38-35Z" fill="#efd594"/><path d="M74 100h34v13H74Z" fill="#7893b5"/><path d="m80 114 9 7 12-7" fill="#647fa4"/><path d="m81 88-8-35 16 10 14-10-8 35" fill="none" stroke="#b18b52" strokeWidth="3"/><g stroke="#c3a56b" strokeWidth="3" strokeLinecap="round"><path d="M29 45 16 40m20-12-7-11m28-6L53 1m91 48 14-2m-21-18 10-11"/></g></>}
  </svg>;
}

export function WorldScenery({ scene, ambient=false }) {
  const gradient=useId();
  const winter = ['winter','christmas'].includes(scene), spring = ['spring','blossom'].includes(scene), autumn = ['autumn','halloween'].includes(scene);
  return <><svg className={s.landscape} viewBox="0 0 1100 590" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id={gradient} x2="0" y2="1"><stop stopColor="var(--land-top)"/><stop offset="1" stopColor="var(--land-bottom)"/></linearGradient></defs>
    <circle cx="836" cy="111" r="52" fill="var(--sun)" opacity=".5"/><circle cx="836" cy="111" r="73" fill="none" stroke="var(--sun)" opacity=".18"/>
    <g fill="var(--cloud)" opacity=".55"><path d="M185 109q-22-29-42-1-31-9-38 13h97q1-18-17-12Z"/><path d="M749 181q-24-39-59-6-32-9-40 18h121q1-21-22-12Z"/><path d="M366 55q-20-23-39 0-20-9-29 13h86q-1-16-18-13Z"/></g>
    {!ambient&&<>
    <path className={s.track} d="M236 169C321 150 387 152 487 256S680 366 855 393M866 158C733 158 687 156 597 256S438 399 226 412" fill="none" stroke="var(--trail)" strokeWidth="2" strokeDasharray="3 9"/>
    <ellipse cx="550" cy="393" rx="209" ry="36" fill="var(--shadow)" opacity=".11"/>
    <path d="M371 338q8 47 57 65l122 36 138-41q41-17 44-60Z" fill="var(--island-side)"/><path d="M371 338q166-101 361 0-146 104-361 0" fill="url(#land-autumn)" style={{fill:`url(#${gradient})`}}/>
    <path d="m429 382 28 8m164 8 31-10m-104 26 26-8" stroke="var(--land-top)" strokeWidth="4" opacity=".35" strokeLinecap="round"/>
    </>}
    <path d="M0 516q160-69 303 21t357-16q195-80 440 4v65H0Z" fill="var(--hill-back)" opacity=".4"/><path d="M0 554q224-33 449 13t651-19v42H0Z" fill="var(--hill-front)" opacity=".5"/>
    {[[64,465,.9],[985,458,1.1],[315,493,.55],[768,509,.65]].map(([x,y,k],i)=><g key={x} transform={`translate(${x} ${y}) scale(${k})`}><path d="M0 41V-40" stroke="var(--bark)" strokeWidth="8" strokeLinecap="round"/>{winter ? <><path d="m0-110-42 66h20l-34 52H55L21-44h20Z" fill="var(--foliage)"/><path d="m0-110-24 37 25-6 22 6Z" fill="#f6f9ff"/></> : <><ellipse cy="-61" rx={i%2?43:33} ry="59" fill="var(--foliage)"/><ellipse cx="-18" cy="-32" rx="28" ry="36" fill="var(--foliage-light)"/><path d="M0 12v-67m0 39-14-15m14 5 15-17" fill="none" stroke="var(--bark)" strokeWidth="3"/>{spring&&<g fill="#edb1c6"><circle cx="10" cy="-89" r="8"/><circle cx="-22" cy="-54" r="9"/><circle cx="22" cy="-36" r="7"/></g>}</>}</g>)}
    {autumn&&<g fill="#d39a62"><ellipse cx="130" cy="502" rx="11" ry="4" transform="rotate(-20 130 502)"/><ellipse cx="916" cy="541" rx="9" ry="4" transform="rotate(15 916 541)"/></g>}
    {scene==='halloween'&&<g transform="translate(928 486)"><ellipse cx="0" cy="10" rx="27" ry="24" fill="#d68b54"/><ellipse cx="0" cy="10" rx="14" ry="24" fill="#e7a45f"/><path d="m-13 5 6-7 5 9m6 0 6-9 5 7m-22 9q10 13 20-1" fill="#6c4562"/><path d="m0-13 4-13" stroke="#728865" strokeWidth="6"/></g>}
    {scene==='christmas'&&<g transform="translate(907 509)"><path d="M0 0h38v34H0Z" fill="#cd7f84"/><path d="M17 0v34M0 9h38" stroke="#f3d48f" strokeWidth="5"/><path d="m17 0-8-12q-14-5-9 5l17 7 13-13q16-4 11 6Z" fill="none" stroke="#f3d48f" strokeWidth="4"/></g>}
    {scene==='lunar'&&[136,946].map(x=><g key={x} transform={`translate(${x} 12)`}><path d="M0 0v32m0 63v20" stroke="#bd9659" strokeWidth="3"/><ellipse cy="65" rx="26" ry="32" fill="#bf5962"/><ellipse cy="65" rx="13" ry="32" fill="none" stroke="#edbc72"/><path d="M-13 33h26m-26 63h26" stroke="#edbc72" strokeWidth="5"/></g>)}
    {['birthday','newyear'].includes(scene)&&<g>{[[110,130,'#ca8bc2'],[170,89,'#82b5dd'],[949,129,'#ddb878']].map(([x,y,color])=><g key={x}><path d={`M${x} ${y+20}q-14 60 5 100`} fill="none" stroke="var(--trail)"/><ellipse cx={x} cy={y} rx="19" ry="25" fill={color}/></g>)}</g>}
  </svg><div className={s.particles} aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{'--i':i}}/>)}</div></>;
}

export default function StudyWorld({ day, pending, due, onSpark }) {
  const tr=useT(),{prefs,coins,navigate}=useApp();
  const {scene,occasion,next}=sceneFor(day,prefs);
  const [motion,setMotion]=useState('idle'), timer=useRef();
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  function animate(){setMotion('idle');requestAnimationFrame(()=>setMotion('highfive'));clearTimeout(timer.current);timer.current=setTimeout(()=>setMotion('idle'),2100)}
  const places=[['learn','My subjects','subjects','northwest'],['read','Book library','books','northeast'],['plan','On your radar','board','southwest'],['spark','Daily spark',null,'southeast']];
  return <section className={s.world} data-scene={scene} aria-label={`${tr('Your study world')} · ${tr(scene)}`}>
    <WorldScenery scene={scene}/>
    <header className={s.worldHeader}><div className={s.dateMedallion}><span>{new Date(day+'T12:00:00').toLocaleDateString(tr.locale,{weekday:'short'})}</span><strong>{day.slice(8)}</strong><span>{new Date(day+'T12:00:00').toLocaleDateString(tr.locale,{month:'short'})}</span></div><h1 className="sr-only">{tr('Today')}</h1><div className={s.sceneTools}><a href="#/celebrations" className={s.occasion}><CalendarDays size={14}/>{occasion ? tr(occasion.name) : next ? `${tr(next.name)} · ${next.days} ${tr('days')}` : tr('Celebrations')}<ArrowUpRight size={13}/></a><button className={s.wallet} onClick={()=>navigate('buddy')} aria-label={`${coins} ${tr('Learning coins')}`}><Coins size={17}/>{coins}</button></div></header>
    <div className={s.terrain}>
      {places.map(([kind,label,path,position])=><button key={kind} className={`${s.place} ${s[position]}`} onClick={()=>path?navigate(path):onSpark()}><PlaceArt kind={kind}/><span>{tr(label)}<ArrowUpRight size={12}/></span>{kind==='plan'&&<small>{pending} {tr('open tasks')}</small>}{kind==='spark'&&<small>{tr('One question, every day')}</small>}</button>)}
      <div className={s.home}><button className={s.duoButton} onClick={()=>navigate('buddy')} aria-label={tr('Customize you and your buddy')}><CompanionDuo character={prefs.character} buddy={normalizeBuddy(prefs.buddy)} name={prefs.name} motion={motion}/></button><div className={s.homeLabel}><span>{prefs.name} <i>&</i> {normalizeBuddy(prefs.buddy).name}</span><button onClick={animate} aria-label={tr('High five with your buddy')} title={tr('High five with your buddy')}><Hand size={15}/></button></div></div>
    </div>
    <div className={s.worldDock}><a href="#/revision?tab=review"><Layers3 size={16}/><b>{due}</b>{tr('ready to revisit')}</a><span className={s.coordinate}>{tr(scene)} <i/> ASTER</span><a href="#/buddy"><Sparkles size={15}/>{tr('Create your avatar')}<ArrowUpRight size={13}/></a></div>
  </section>;
}
