import React,{useMemo,useState} from 'react';
import {ArrowRight,BookOpen,Layers3,Target} from 'lucide-react';
import {COURSES,makeQuiz} from '../study.js';
import {practiceCoverage} from '../questionBank.js';
import {useApp} from '../context.jsx';
import {useT} from '../i18n.jsx';
import {Button} from './UI.jsx';
import s from './PracticeSetup.module.css';

export default function PracticeSetup({subject,onStart}){
 const tr=useT(),{learning}=useApp(),bank=COURSES[subject].questions;
 const attempts=(learning?.attempts||[]).filter(a=>a.subject===subject);
 const[topic,setTopic]=useState('all'),[level,setLevel]=useState('all'),[limit,setLimit]=useState(10),[mode,setMode]=useState('fresh');
 const topics=useMemo(()=>[...new Set(bank.map(q=>q.topic))], [bank]);
 const coverage=practiceCoverage(bank,attempts),latest=new Map(attempts.map(a=>[a.question,a]));
 const available=bank.filter(q=>(topic==='all'||q.topic===topic)&&(level==='all'||q.level===level)&&(mode!=='mistakes'||latest.get(q.q)?.correct===false)).length;
 return <section className={s.setup}><span className={s.eyebrow}>{tr('YOUR NEXT PRACTICE SESSION')}</span><h2>{tr('A little focus. A lot to explore.')}</h2><p>{tr('Choose your pace. Each answer includes an explanation.')}</p><div className={s.stats}><div><BookOpen size={19}/><strong>{coverage.total}</strong><span>{tr('questions in this subject')}</span></div><div><Target size={19}/><strong>{coverage.seen}</strong><span>{tr('checked in saved history')}</span></div><div><Layers3 size={19}/><strong>{topics.length}</strong><span>{tr('topics to explore')}</span></div></div><div className={s.fields}><label>{tr('Topic')}<select value={topic} onChange={e=>setTopic(e.target.value)}><option value="all">{tr('All topics')}</option>{topics.map(t=><option key={t}>{tr(t)}</option>)}</select></label><label>{tr('Question style')}<select value={level} onChange={e=>setLevel(e.target.value)}><option value="all">{tr('Recall & application')}</option><option value="foundation">{tr('Foundation recall')}</option><option value="applied">{tr('Apply your understanding')}</option></select></label><label>{tr('Question selection')}<select value={mode} onChange={e=>setMode(e.target.value)}><option value="fresh">{tr('New questions first')}</option><option value="mixed">{tr('Mix everything')}</option><option value="mistakes">{tr('Revisit missed questions')}</option></select></label><label>{tr('Session length')}<select value={limit} onChange={e=>setLimit(Number(e.target.value))}>{[5,10,20,30].map(n=><option key={n} value={n}>{n} {tr('questions')}</option>)}</select></label></div><div className={s.start}><span role="status">{available?`${Math.min(limit,available)} ${tr(Math.min(limit,available)===1?'question this session':'questions this session')} · ${available} ${tr(available===1?'matching question':'matching questions')}`:tr('No matching questions. Try a different topic or selection.')}</span><Button disabled={!available} onClick={()=>onStart(makeQuiz(subject,{limit,topic,level,mode,attempts}))}>{tr('Start practice')}<ArrowRight size={17}/></Button></div><p className={s.note}>{tr('New questions are prioritised using your saved answer history. Related recall prompts are spread across sessions. Original Aster practice extends beyond your current classroom unit; it is not an official examination bank.')}</p></section>;
}
