import React, { useEffect, useRef, useState } from 'react';
import { Check, Coins } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { useT } from '../../i18n.jsx';
import { CHARACTER_OPTIONS, CHARACTER_EXTRAS, normalizeCharacter } from '../../character.js';
import { normalizeBuddy } from '../../buddies.js';
import { CharacterAvatar, CompanionDuo } from './CharacterAvatar.jsx';
import { Button, Modal } from '../UI.jsx';
import s from './Character.module.css';

const labels={kind:'Person or monster',shape:'Body shape',eyes:'Eyes',hair:'Hair',outfit:'Outfit',feature:'Extra features'};
export default function CharacterCreator(){
  const tr=useT(),{prefs,setPrefs,coins,transact,notify,playSound}=useApp();
  const character=normalizeCharacter(prefs.character),buddy=normalizeBuddy(prefs.buddy);
  const [motion,setMotion]=useState('idle'),[purchase,setPurchase]=useState(null),[category,setCategory]=useState('kind'),timer=useRef();
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  function change(value){setPrefs(p=>({...p,character:{...normalizeCharacter(p.character),...value,created:true}}))}
  function emote(value){setMotion(value);clearTimeout(timer.current);timer.current=setTimeout(()=>setMotion('idle'),2200)}
  function buy(){const result=transact('character',purchase.id);if(result.error){notify(tr(result.error));return;}setPurchase(null);emote('dance');playSound('reward');notify(tr('Added to your wardrobe.'))}
  return <section className={s.creator} id="avatar-creator"><header className={s.creatorHeader}><div><h2>{tr('You, reimagined.')}</h2><p>{tr('A person. A monster. Completely you. Your buddy stays by your side.')}</p></div><span className={s.freeBadge}>{tr('Free avatar creator')}</span></header><div className={s.editor}><div className={s.stage}><div className={s.preview}><CompanionDuo character={character} buddy={buddy} name={prefs.name} motion={motion}/></div><div className={s.stageLabel}>{prefs.name}<span>&</span>{buddy.name}</div><div className={s.emotes}>{[['wave','Wave'],['dance','Dance'],['highfive','High five']].map(([id,label])=><button key={id} onClick={()=>emote(id)}>{tr(label)}</button>)}</div></div><div className={s.controls}>
    <div className={s.categories} aria-label={tr('Avatar categories')}>{Object.keys(CHARACTER_OPTIONS).map(key=><button key={key} aria-pressed={category===key} onClick={()=>setCategory(key)}>{tr(labels[key])}</button>)}</div>
    <fieldset><legend>{tr(labels[category])}<small>{tr('Free')}</small></legend><div className={s.visualOptions}>{CHARACTER_OPTIONS[category].map(option=><button key={option} aria-pressed={character[category]===option} onClick={()=>change({[category]:option})}><span aria-hidden="true"><CharacterAvatar value={{...character,[category]:option}}/></span><strong>{tr(option)}</strong>{character[category]===option&&<Check size={14}/>}</button>)}</div></fieldset>
    <div className={s.colorRow}>{[['skin','Skin color'],['hairColor','Hair color'],['outfitColor','Outfit color']].map(([key,label])=><label key={key}>{tr(label)}<input type="color" value={character[key]} onChange={e=>change({[key]:e.target.value})}/></label>)}</div>
    <p className={s.saved}><Check size={13}/>{tr('Your profile picture always shows you and your buddy together.')}</p><p className={s.saved}>{tr('Changes save automatically. Free choices never spend coins.')}</p>
    </div></div><header className={s.extraHead}><h3>{tr('A little extra personality')}</h3><span><Coins size={17}/>{coins}</span></header><div className={s.extras}>{CHARACTER_EXTRAS.map(item=>{const owned=character.owned.includes(item.id),equipped=character[item.slot]===item.id;return <article key={item.id} className={s.extra} style={{'--extra-color':item.color+'28'}}><div><CharacterAvatar value={{...character,owned:[...character.owned,item.id],[item.slot]:item.id}} name={tr(item.name)}/></div><h4>{tr(item.name)}</h4><p>{tr(owned?'Owned · equip any time':'Optional · earned coins only')}</p><button disabled={!owned&&coins<item.price} onClick={()=>owned?change({[item.slot]:equipped?'':item.id}):setPurchase(item)}>{owned?tr(equipped?'Remove':'Equip'):<><Coins size={12}/>{item.price} · {tr('Buy')}</>}</button></article>})}</div>{purchase&&<Modal title={tr(purchase.name)} size="small" onClose={()=>setPurchase(null)}><div className={s.purchasePreview}><CharacterAvatar value={{...character,owned:[...character.owned,purchase.id],[purchase.slot]:purchase.id}} name={tr(purchase.name)}/><p>{purchase.price} {tr('Coins')} · {tr('Keep it in your collection.')}<br/>{tr('Balance after purchase')}: {coins-purchase.price}</p><Button disabled={coins<purchase.price} onClick={buy}>{tr('Buy')} · {purchase.price} <Coins size={14}/></Button><Button variant="secondary" onClick={()=>setPurchase(null)}>{tr('Cancel')}</Button></div></Modal>}</section>;
}
