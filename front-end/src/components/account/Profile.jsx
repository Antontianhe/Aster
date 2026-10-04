import React, { useState } from 'react';
import { Check, UserRound, SlidersHorizontal, Heart, Palette } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { useT } from '../../i18n.jsx';
import { dayKey } from '../../study.js';
import { ProfilePortrait } from '../buddy/CharacterAvatar.jsx';
import CharacterCreator from '../buddy/CharacterCreator.jsx';
import BuddyGarden from '../buddy/BuddyGarden.jsx';
import { profileAge, normalizeProfile } from '../../profile.js';
import s from './Profile.module.css';

export default function Profile({settings}) {
  const tr=useT(), {prefs,setPrefs,route,navigate,notify}=useApp();
  const tab=route.query.get('tab')==='info'?'info':'customize';
  const [section,setSection]=useState('avatar');
  const [draft,setDraft]=useState(()=>normalizeProfile(prefs.profile)), [saved,setSaved]=useState(false);
  const age=profileAge(draft.dateOfBirth,dayKey());
  function field(key,value){setSaved(false);setDraft(p=>({...p,[key]:value}))}
  function save(event){event.preventDefault();const profile=normalizeProfile(draft);setPrefs(p=>({...p,profile,birthday:profile.dateOfBirth.slice(5)}));setSaved(true);notify(tr('Profile saved.'))}
  return <div className={s.page}>
    <header className={s.profileHeader}><div className={s.headerPortrait}><ProfilePortrait prefs={prefs}/></div><div><span>{tr('YOUR SPACE')}</span><h1>{prefs.name}</h1><p>{tr('You and your buddy. Always together.')}</p></div></header>
    <nav className={s.tabs} aria-label={tr('Profile sections')}>
      <a href="#/profile" aria-current={tab==='customize'?'page':undefined}><SlidersHorizontal size={18}/>{tr('Customize & settings')}</a>
      <a href="#/profile?tab=info" aria-current={tab==='info'?'page':undefined}><UserRound size={18}/>{tr('Information')}</a>
    </nav>
    {tab==='customize'?<>
      <div className={s.customSections} aria-label={tr('Customization options')}>{[['avatar','My avatar',UserRound],['buddy','My buddy',Heart],['settings','Workspace settings',Palette]].map(([id,label,Icon])=><button key={id} aria-pressed={section===id} onClick={()=>setSection(id)}><Icon size={17}/>{tr(label)}</button>)}</div>
      {section==='avatar'?<CharacterCreator/>:section==='buddy'?<BuddyGarden embedded/>:settings}
    </>:<div className={s.layout}>
      <aside><div className={s.portrait}><ProfilePortrait prefs={prefs}/></div><h2>{prefs.name}</h2><button onClick={()=>navigate('profile')}>{tr('Customize us')}</button><p>{tr('These details are not shown in the student lounge. Contact details here do not change your sign-in or verify an email or phone number.')}</p></aside>
      <form onSubmit={save} className={s.form}>
        <h2>{tr('Personal information')}</h2><div className={s.grid}>
          {[['fullName','Full name','text','name'],['email','Email address','email','email'],['phone','Telephone number','tel','tel']].map(([key,label,type,complete])=><label key={key}>{tr(label)}<input type={type} autoComplete={complete} maxLength={key==='email'?254:100} value={draft[key]} onChange={e=>field(key,e.target.value)}/></label>)}
          <label>{tr('Birthday')}<input type="date" autoComplete="bday" min="1900-01-01" max={dayKey()} value={draft.dateOfBirth} onChange={e=>field('dateOfBirth',e.target.value)}/></label>
          <label>{tr('Age')}<output>{age===null?'—':age}</output><small>{tr('Calculated from your birthday.')}</small></label>
        </div>
        <h2>{tr('School information')}</h2><div className={s.grid}>{[['school','School'],['grade','Grade / year'],['className','Class / form']].map(([key,label])=><label key={key}>{tr(label)}<input value={draft[key]} maxLength={100} onChange={e=>field(key,e.target.value)}/></label>)}</div>
        <label className={s.check}><input type="checkbox" checked={prefs.birthdayCelebration!==false} onChange={e=>setPrefs(p=>({...p,birthdayCelebration:e.target.checked}))}/>{tr('Show a birthday celebration in my Today scene')}</label>
        <div className={s.actions}><button type="submit">{tr('Save profile')}</button>{saved&&<span role="status"><Check size={15}/>{tr('Profile saved.')}</span>}</div>
      </form>
    </div>}
  </div>;
}
