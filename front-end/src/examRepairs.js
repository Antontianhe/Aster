const clean=(value,max)=>typeof value==='string'?value.slice(0,max):'';
export function normalizeRepair(value={}) {
  const v=value&&typeof value==='object'?value:{};
  const feedback=v.feedback&&['improved','revisit','unclear'].includes(v.feedback.verdict)?{
    verdict:v.feedback.verdict,feedback:clean(v.feedback.feedback,2400),
    nextStep:clean(v.feedback.nextStep,1200),suggestedAnswer:clean(v.feedback.suggestedAnswer,3000),source:v.feedback.source==='verified-algebra'?'verified-algebra':'ai'
  }:null;
  return {id:clean(v.id,100),questionNumber:clean(v.questionNumber,50),topic:clean(v.topic,150),
    question:clean(v.question,3000),originalAnswer:clean(v.originalAnswer,3000),teacherFeedback:clean(v.teacherFeedback,2000),
    attempt:clean(v.attempt,5000),reflection:clean(v.reflection,1500),confirmed:v.confirmed===true,
    selfReviewed:v.selfReviewed===true,feedback};
}
export function repairsFor(report,makeId=()=>crypto.randomUUID()) {
  const existing=Array.isArray(report.repairs),rows=existing?report.repairs:Array.isArray(report.mistakes)?report.mistakes:[];
  return rows.slice(0,20).filter(x=>x&&typeof x==='object').map(x=>{
    const item=normalizeRepair(x);return {...item,id:item.id||makeId()};
  });
}
export function editRepair(value,changes) {
  const next=normalizeRepair({...value,...changes});
  const sourceChanged=['question','originalAnswer','teacherFeedback'].some(key=>key in changes&&changes[key]!==value[key]);
  const answerChanged='attempt' in changes&&changes.attempt!==value.attempt;
  if(sourceChanged)next.confirmed=false;
  if(sourceChanged||answerChanged){next.feedback=null;next.selfReviewed=false;}
  return next;
}
