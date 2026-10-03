import React,{createContext,useCallback,useContext,useEffect,useMemo,useState} from 'react';
import {Languages} from 'lucide-react';
import {TRANSLATIONS} from './translations.js';
import {revisionTranslations} from './revisionTranslations.js';
import {essentialsTranslations} from './essentialsTranslations.js';
import {todayTranslations} from './todayTranslations.js';

export const LANGUAGES=[{id:'en',name:'English',locale:'en-GB'},{id:'de',name:'Deutsch',locale:'de-DE'},{id:'zh',name:'简体中文',locale:'zh-CN'}];
const LanguageContext=createContext({language:'en',setLanguage:()=>{}});
const STORAGE_KEY='aster-interface-language-v1';
export function translate(value,language='en'){
 if(Array.isArray(value))return value.map(item=>translate(item,language));
 if(typeof value!=='string'||language==='en')return value;
 const words=TRANSLATIONS[language]||{};
 const trimmed=value.trim(),found=todayTranslations[language]?.[trimmed]||essentialsTranslations[language]?.[trimmed]||revisionTranslations[language]?.[trimmed]||words[trimmed];
 if(found)return value.replace(trimmed,found);
 const count=/^(Saved|Reading) \((\d+)\)$/.exec(trimmed);if(count)return (words[count[1]]||count[1])+' ('+count[2]+')';
 return value;
}
export function LanguageProvider({children}){
 const [language,setValue]=useState(()=>{try{const stored=localStorage.getItem(STORAGE_KEY);return LANGUAGES.some(l=>l.id===stored)?stored:'en';}catch{return 'en';}});
 const setLanguage=useCallback(value=>{if(LANGUAGES.some(l=>l.id===value))setValue(value);},[]);
 useEffect(()=>{document.documentElement.lang=LANGUAGES.find(l=>l.id===language)?.locale||'en-GB';try{localStorage.setItem(STORAGE_KEY,language);}catch{}},[language]);
 const value=useMemo(()=>({language,setLanguage}),[language,setLanguage]);
 return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useLanguage(){return useContext(LanguageContext);}
export function useT(){const {language}=useLanguage();return useMemo(()=>{const t=value=>translate(value,language);t.locale=LANGUAGES.find(l=>l.id===language)?.locale||'en-GB';return t;},[language]);}
export function LanguageSelector({full=false}){
 const {language,setLanguage}=useLanguage();const tr=useT();
 return <label className={`language-selector ${full?'language-selector-full':''}`}><Languages size={17} aria-hidden="true"/><span className={full?'':'sr-only'}>{tr('Interface language')}</span><select aria-label={tr('Interface language')} value={language} onChange={e=>setLanguage(e.target.value)}>{LANGUAGES.map(item=><option key={item.id} value={item.id} lang={item.locale}>{item.name}</option>)}</select></label>;
}
