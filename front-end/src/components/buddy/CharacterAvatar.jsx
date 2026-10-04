import React, { memo, useId } from 'react';
import { normalizeCharacter } from '../../character.js';
import { normalizeBuddy } from '../../buddies.js';
import { BuddyAvatar } from './BuddyAvatar.jsx';
import s from './Character.module.css';

export const CharacterAvatar = memo(function CharacterAvatar({ value, name = 'Your avatar', motion = 'idle' }) {
  const c = normalizeCharacter(value), id = useId().replace(/:/g, '');
  const monster = c.kind === 'monster', width = c.shape === 'slim' ? 76 : c.shape === 'square' ? 112 : 102;
  return <svg className={s.character} data-motion={motion} viewBox="0 0 240 280" role="img" aria-label={name}>
    <defs><linearGradient id={`${id}-skin`} x2=".9" y2="1"><stop stopColor={c.skin}/><stop offset="1" stopColor={c.skin}/></linearGradient><linearGradient id={`${id}-cloth`} x2="1" y2="1"><stop stopColor={c.outfitColor}/><stop offset="1" stopColor={c.outfitColor} stopOpacity=".75"/></linearGradient><linearGradient id={`${id}-wing`}><stop stopColor="#64dbde" stopOpacity=".7"/><stop offset="1" stopColor="#bc9cf6" stopOpacity=".4"/></linearGradient></defs>
    <ellipse cx="120" cy="256" rx="61" ry="10" fill="#153153" opacity=".13"/>
    <g className={s.figure}>
      {c.effect === 'wings' && <g className={s.wings} fill={`url(#${id}-wing)`} stroke="#cffcff" strokeWidth="2"><path d="M90 155Q5 48 20 161Q20 213 86 203Z"/><path d="M150 155Q235 48 220 161Q220 213 154 203Z"/><path d="m27 108 57 70m130-70-58 70" fill="none"/></g>}
      {c.effect === 'orbit' && <g className={s.orbit}><ellipse cx="120" cy="153" rx="105" ry="46" transform="rotate(-22 120 153)" fill="none" stroke="#ad96ee" strokeWidth="3" strokeDasharray="3 8"/><circle cx="25" cy="183" r="8" fill="#ffe499"/><path d="m206 92 4 10 11 4-11 4-4 11-4-11-10-4 10-4Z" fill="#c7c1ff"/></g>}
      <rect x="87" y="217" width="24" height="32" rx="10" fill="#34445f"/><rect x="131" y="217" width="24" height="32" rx="10" fill="#34445f"/><path d="M87 241h24v12H78q-6-13 9-12m44 0h24q18 0 13 12h-37Z" fill="#f4f2ef" stroke="#64758b" strokeWidth="2"/>
      <g className={s.leftArm}><path d="M79 160q-30 7-27 47" fill="none" stroke={c.outfitColor} strokeWidth="22" strokeLinecap="round"/><circle cx="52" cy="209" r="12" fill={c.skin}/></g>
      <g className={s.rightArm}><path d="M164 160q28 10 24 44" fill="none" stroke={c.outfitColor} strokeWidth="22" strokeLinecap="round"/><circle cx="188" cy="208" r="12" fill={c.skin}/></g>
      <rect x={120-width/2} y="140" width={width} height="91" rx={c.shape === 'square' ? 19 : 36} fill={`url(#${id}-cloth)`}/>
      <path d="M106 139v-14h28v14q-14 18-28 0" fill={c.skin}/>
      {c.outfit === 'hoodie' && <><path d="m89 148 31 20 31-20" fill="none" stroke="#ffffff70" strokeWidth="8"/><path d="m110 161-3 21m23-21 3 21m-29 20h32" stroke="#fff9" strokeWidth="3" strokeLinecap="round"/><path d="M94 202h52l-8 16h-37Z" fill="#0001"/></>}
      {c.outfit === 'overalls' && <><path d="M93 149v35h54v-35m-54 28h54v50H93Z" fill="#3b577b" stroke="#263e5d" strokeWidth="2"/><circle cx="99" cy="183" r="3" fill="#ffd78e"/><circle cx="141" cy="183" r="3" fill="#ffd78e"/><path d="M108 194h24v16h-24Z" fill="#ffffff26"/></>}
      {c.outfit === 'blazer' && <><path d="m101 143 19 25 20-25-9 87h-22Z" fill="#f7f0df"/><path d="m95 146-8 23 17 11-5 8 21 29-5-50Zm50 0 8 23-17 11 5 8-21 29 5-50Z" fill="#0002"/><circle cx="120" cy="209" r="3" fill="#394458"/></>}
      {c.outfit === 'tee' && <path d="m120 169 5 13 14 1-11 9 4 14-12-8-12 8 4-14-11-9 14-1Z" fill="#fff9"/>}
      {c.hair === 'long' && <rect x="54" y="57" width="132" height="108" rx="51" fill={c.hairColor}/>}
      {c.feature === 'horns' && <><path d="M67 63Q48 14 76 34L91 60M148 59l19-25q22-22 5 32" fill="#f7d9ac" stroke="#d0a176" strokeWidth="2"/></>}
      {c.feature === 'antennae' && <g stroke={c.skin} strokeWidth="7" strokeLinecap="round"><path d="m94 58-13-28m65 28 14-28"/><circle cx="79" cy="25" r="8" fill={c.outfitColor}/><circle cx="162" cy="25" r="8" fill={c.outfitColor}/></g>}
      {monster?<g fill={c.skin}><path d="M63 85 28 65q-8 45 39 51ZM177 85l35-20q8 45-39 51Z"/><path d="m43 83 17 13m137-13-17 13" stroke="#fff" strokeOpacity=".3" strokeWidth="4" strokeLinecap="round"/></g>:<><circle cx="59" cy="99" r="11" fill={c.skin}/><circle cx="181" cy="99" r="11" fill={c.skin}/></>}
      <rect x="57" y="49" width="126" height="107" rx={monster ? c.shape === 'square' ? 27 : 49 : 49} fill={`url(#${id}-skin)`}/>
      {c.effect === 'starlight' && <g fill="#e8f6ff" stroke="#d2ecff" strokeWidth=".6"><path d="m74 77 4-7 3 7 7 2-7 3-3 7-4-7-6-3Zm80 59 3-6 3 6 6 2-6 3-3 6-3-6-6-3Z"/><circle cx="164" cy="80" r="2.5"/><circle cx="71" cy="108" r="2"/><circle cx="152" cy="70" r="1.5"/><path d="m164 80-12-10m-74 9-7 29" fill="none"/></g>}
      <path d="M70 67q16-16 39-13" stroke="#fff" strokeOpacity=".17" strokeWidth="8" strokeLinecap="round" fill="none"/>
      {c.hair !== 'none' && (c.hair === 'curly' ? <g fill={c.hairColor}>{[[64,65,16],[77,47,19],[101,40,21],[127,38,20],[152,45,22],[173,62,17]].map(([cx,cy,r])=><circle key={cx} cx={cx} cy={cy} r={r}/>)}</g> : <path d="M56 87Q44 31 112 32q82-8 73 57l-16-23q-37 8-61-13-12 22-52 34Z" fill={c.hairColor}/>)}
      <g className={s.eyes} fill="#273347">
        {c.eyes === 'cyclops' ? <><ellipse cx="120" cy="101" rx="24" ry="23" fill="#fff"/><circle cx="123" cy="103" r="11"/><circle cx="126" cy="98" r="3" fill="#fff"/></> : c.eyes === 'sleepy' ? <g fill="none" stroke="#273347" strokeWidth="5" strokeLinecap="round"><path d="M84 99q9 10 18 0m36 0q9 10 18 0"/></g> : c.eyes === 'stars' ? <><path d="m94 88 4 9 10 1-8 7 3 10-9-6-9 6 3-10-8-7 10-1Zm52 0 4 9 10 1-8 7 3 10-9-6-9 6 3-10-8-7 10-1Z"/></> : <><ellipse cx="94" cy="103" rx="7" ry="10"/><ellipse cx="146" cy="103" rx="7" ry="10"/><circle cx="97" cy="100" r="2.5" fill="#fff"/><circle cx="149" cy="100" r="2.5" fill="#fff"/></>}
      </g>
      <ellipse cx="79" cy="120" rx="10" ry="5" fill="#e79698" opacity=".45"/><ellipse cx="161" cy="120" rx="10" ry="5" fill="#e79698" opacity=".45"/>
      <path d="M108 125q12 12 24 0" fill="none" stroke="#623d43" strokeWidth="4" strokeLinecap="round"/>
      {monster && <path d="m126 129 4 8 5-11" fill="#fff"/>}
      {c.accessory === 'headphones' && <g stroke="#544c91" strokeWidth="8" fill="#b6a8f2"><path d="M52 104V89q0-57 68-57t68 57v15" fill="none"/><rect x="44" y="91" width="18" height="34" rx="8"/><rect x="178" y="91" width="18" height="34" rx="8"/></g>}
      {c.accessory === 'crown' && <g><path d="m83 43-4-29 24 15 17-27 18 27 23-15-5 29Z" fill="#f0cd72" stroke="#bb9858" strokeWidth="2"/><path d="m120 20 6 8-6 8-6-8Z" fill="#97dcf0"/></g>}
    </g>
  </svg>;
});

export function ProfilePortrait({ prefs }) {
  return <div className={s.portraitDuo}><CompanionDuo character={normalizeCharacter(prefs.character)} buddy={normalizeBuddy(prefs.buddy)} name={prefs.name}/></div>;
}

export function CompanionDuo({ character, buddy, name, motion = 'idle' }) {
  return <div className={s.duo} data-emote={motion}><div className={s.you}><CharacterAvatar value={character} name={name} motion={motion}/></div><div className={s.companion}><BuddyAvatar {...buddy} excited={motion !== 'idle'}/></div><span className={s.duoSpark} aria-hidden="true">✦</span></div>;
}
