import React,{useEffect,useRef,useState} from 'react';
import {Plus,Save,Sparkles,CheckCircle2,PencilLine,Trash2,RotateCcw} from 'lucide-react';
import {useT,useLanguage} from '../../i18n.jsx';
import {api} from '../../auth.jsx';
import {COURSES} from '../../study.js';
import {editRepair,normalizeRepair} from '../../examRepairs.js';
import {Button} from '../UI.jsx';
import TutorText from '../TutorText.jsx';
import s from './ExamRepairs.module.css';

export default function ExamRepairs({report,onChange,onSave,choice,disabled,onBusy}) {
  const tr=useT(),{language}=useLanguage();
  const [pending,setPending]=useState(''),[error,setError]=useState(''),[remove,setRemove]=useState('');
  const abort=useRef(),alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;abort.current?.abort()}},[]);
  const rows=report.repairs||[],locked=disabled||!!pending,reviewed=rows.filter(r=>r.feedback?.verdict==='improved'||r.selfReviewed).length;
  function update(id,changes){onChange({...report,repairs:rows.map(r=>r.id===id?editRepair(r,changes):r)})}
  function add(){onChange({...report,repairs:[...rows,normalizeRepair({id:crypto.randomUUID()})]})}
  async function feedback(item){
    if(locked)return;setPending(item.id);onBusy(true);setError('');abort.current=new AbortController();
    try{
      const result=await api('/exam-coach/repair','POST',{subject:COURSES[report.subject]?.name||'General study',language,
        question:item.question,originalAnswer:item.originalAnswer,teacherFeedback:item.teacherFeedback,attempt:item.attempt,
        confirmed:item.confirmed,...choice.payload},abort.current.signal);
      if(!alive.current)return;
      const next={...report,repairs:rows.map(r=>r.id===item.id?normalizeRepair({...r,feedback:result}):r)};
      onChange(next);onSave(next,true);
    }catch(e){if(alive.current&&e.name!=='AbortError')setError(e.message)}
    finally{if(alive.current){setPending('');onBusy(false)}}
  }
  return <section className={s.notebook} aria-labelledby="repair-title">
    <header className={s.heading}><div><span><PencilLine size={15}/>{tr('YOUR CORRECTION NOTEBOOK')}</span><h2 id="repair-title">{tr('Make your next answer better.')}</h2><p>{tr('Check the original question, try it again in your own words, then compare your reasoning.')}</p></div><div className={s.counter}><strong>{reviewed}<small>/{rows.length}</small></strong><span>{tr('reviewed')}</span></div></header>
    <div className={s.actions}><Button variant="secondary" disabled={locked||rows.length>=20} onClick={add}><Plus size={15}/>{tr('Add a missed question')}</Button><Button variant="secondary" disabled={locked} onClick={()=>onSave(report)}><Save size={15}/>{tr('Save corrections')}</Button></div>
    {!rows.length&&<div className={s.empty}><PencilLine size={27}/><h3>{tr('Choose a question you want to fix.')}</h3><p>{tr('No clearly marked mistakes were extracted. Add a question yourself using your exam and your teacher’s feedback.')}</p></div>}
    {rows.map((item,i)=><article className={s.card} key={item.id}>
      <header className={s.cardHead}><span className={s.number}>{String(i+1).padStart(2,'0')}</span><h3>{item.topic||tr('Question to revisit')}{item.questionNumber?' · '+item.questionNumber:''}</h3><span className={s.status} data-status={item.feedback?.verdict||'draft'}>{tr(item.feedback?.verdict==='improved'?(item.feedback.source==='verified-algebra'?'Value checked':'AI: improved'):item.feedback?.verdict==='revisit'?(item.feedback.source==='verified-algebra'?'Try again':'AI: try again'):item.feedback?.verdict==='unclear'?(item.feedback.source==='verified-algebra'?'Needs a final value':'AI: needs context'):item.selfReviewed?'Self-reviewed':'Draft')}</span><button disabled={locked} aria-label={tr('Remove correction')+' '+(i+1)} onClick={()=>setRemove(item.id)}><Trash2 size={15}/></button></header>
      {remove===item.id&&<div className={s.remove}><p>{tr('Remove this question and its saved working?')}</p><button onClick={()=>{onChange({...report,repairs:rows.filter(r=>r.id!==item.id)});setRemove('')}}>{tr('Remove')}</button><button onClick={()=>setRemove('')}>{tr('Keep it')}</button></div>}
      <div className={s.columns}>
        <section className={s.original}><span className={s.label}>{tr('01 · THE ORIGINAL')}</span>
          <label>{tr('Question from your exam')}<textarea rows={4} maxLength={3000} disabled={locked} value={item.question} onChange={e=>update(item.id,{question:e.target.value})} placeholder={tr('Copy the exact question, including any values or diagram details.')}/></label>
          <label>{tr('Your original answer')}<textarea rows={3} maxLength={3000} disabled={locked} value={item.originalAnswer} onChange={e=>update(item.id,{originalAnswer:e.target.value})}/></label>
          <label>{tr('Teacher feedback (if provided)')}<textarea rows={2} maxLength={2000} disabled={locked} value={item.teacherFeedback} onChange={e=>update(item.id,{teacherFeedback:e.target.value})}/></label>
          <label className={s.confirm}><input type="checkbox" disabled={locked} checked={item.confirmed} onChange={e=>update(item.id,{confirmed:e.target.checked})}/>{tr('I checked these details against my exam.')}</label>
        </section>
        <section className={s.attempt}><span className={s.label}>{tr('02 · YOUR NEW ATTEMPT')}</span>
          <label>{tr('Rewrite your answer and show your working')}<textarea rows={8} maxLength={5000} disabled={locked} value={item.attempt} onChange={e=>update(item.id,{attempt:e.target.value})} placeholder={tr('Start again from the question. Explain each step, not just the final answer.')}/></label>
          <Button disabled={locked||!choice.ready||!item.confirmed||item.question.trim().length<5||!item.attempt.trim()} onClick={()=>feedback(item)}><Sparkles size={15}/>{tr(pending===item.id?'Reviewing your new answer…':'Get feedback on my correction')}</Button>
          {pending===item.id&&<button className={s.cancel} onClick={()=>abort.current?.abort()}>{tr('Cancel review')}</button>}
          {!choice.ready&&<p className={s.hint}>{tr('AI feedback is unavailable until your selected model is ready. You can still write and save corrections.')}</p>}
          <label className={s.confirm}><input type="checkbox" disabled={locked||!item.attempt.trim()||!item.confirmed} checked={item.selfReviewed} onChange={e=>update(item.id,{selfReviewed:e.target.checked})}/>{tr('I checked my new answer with my teacher or mark scheme.')}</label>
        </section>
      </div>
      {item.feedback&&<div className={s.feedback} data-verdict={item.feedback.verdict} role="status"><h4>{item.feedback.verdict==='improved'?<CheckCircle2 size={18}/>:<RotateCcw size={18}/>} {tr('03 · FEEDBACK ON YOUR NEW ANSWER')}</h4><TutorText text={item.feedback.feedback}/><p><strong>{tr('Next step')}: </strong>{item.feedback.nextStep}</p><details><summary>{tr('Compare with a suggested solution')}</summary><TutorText text={item.feedback.suggestedAnswer}/></details><small>{tr(item.feedback.source==='verified-algebra'?'Verified arithmetic for this linear equation. Written reasoning still needs review; this is not an official mark.':'AI feedback is a study aid, not your teacher’s mark. Check important steps against your course materials.')}</small></div>}
      <label className={s.reflection}>{tr('What will you do differently next time?')}<textarea rows={2} maxLength={1500} disabled={locked} value={item.reflection} onChange={e=>update(item.id,{reflection:e.target.value})} placeholder={tr('For example: subtract the constant from both sides before dividing.')}/></label>
    </article>)}
    {error&&<p role="alert" className={s.error}>{error}</p>}
    {rows.length>0&&<Button variant="secondary" disabled={locked} onClick={()=>onSave(report)}><Save size={15}/>{tr('Save corrections')}</Button>}
    <p className={s.hint}>{tr('Save corrections to keep your drafts. AI feedback saves automatically. Original photos stay only in this open session.')}</p>
  </section>;
}
