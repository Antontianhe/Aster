import React,{useEffect,useState} from 'react';
import {api} from '../auth.jsx';
import {useT} from '../i18n.jsx';
import s from './AIChoice.module.css';
export function useAIChoice(){
 const[status,setStatus]=useState(null),[provider,setProvider]=useState('local'),[consent,setConsent]=useState(false);
 useEffect(()=>{let live=true;const check=()=>api('/ai/status').then(v=>{if(live)setStatus(v)}).catch(()=>{if(live)setStatus({ready:false})});check();const timer=setInterval(check,20000);return()=>{live=false;clearInterval(timer)}},[]);
 return{status,provider,consent,setProvider(v){setProvider(v);setConsent(false)},setConsent,ready:provider==='openai'?!!status?.cloud?.ready&&consent:!!status?.ready,payload:{provider,cloudConsent:provider==='openai'&&consent}};
}
export default function AIChoice({choice,disabled=false,exam=false}){const tr=useT();return <div className={s.choice}><label>{tr('AI model')}<select disabled={disabled} value={choice.provider} onChange={e=>choice.setProvider(e.target.value)}><option value="local">{tr('Local · Qwen 3.5')}</option><option value="openai" disabled={!choice.status?.cloud?.ready}>OpenAI · GPT-6 Astra{choice.status?.cloud?.ready?'':' — '+tr('Not configured')}</option></select></label>{choice.provider==='openai'?<label className={s.consent}><input type="checkbox" disabled={disabled} checked={choice.consent} onChange={e=>choice.setConsent(e.target.checked)}/><span>{tr(exam?'Send my submitted exam images, text, and selected focus areas to OpenAI for this review.':'Send my messages, recent conversation, and selected course notes to OpenAI for this conversation.')} {tr('API usage is billed separately. AI can make mistakes.')}</span></label>:<small>{tr('Local processing on this computer. OpenAI stays off until a key is configured on the server.')} <a href="#/contact">{tr('Setup help')}</a></small>}</div>}
