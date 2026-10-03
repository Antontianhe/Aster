import {CURRICULUM,UNITS} from './curriculum.js';
export const EXAMS_KEY='aster-mock-exams-v1';
export function berlinDay(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function dayBefore(day){if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day))||new Date(day+'T12:00:00Z').toISOString().slice(0,10)!==day)throw new Error('Choose a valid exam date.');const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);}
export function validateExam(input){
 const title=typeof input.title==='string'?input.title.trim().slice(0,120):'';if(!title)throw new Error('Give your exam a title.');
 const date=String(input.date||'');dayBefore(date);if(date<'2020-01-01'||date>'2040-12-31')throw new Error('Choose an exam year between 2020 and 2040.');
 const source=typeof input.source==='string'?input.source.trim().slice(0,120):'';
 const topics=Array.isArray(input.topics)?[...new Set(input.topics)].slice(0,40).filter(id=>UNITS[id]):[];
 const course=CURRICULUM.find(c=>c.id===input.course);
 if(topics.length&&(!course||topics.some(id=>!course.units.includes(id))))throw new Error('Choose topics from the selected subject.');
 const cards=Array.isArray(input.cards)?input.cards.slice(0,40).map(c=>{const q=String(c?.question||'').trim().slice(0,800),a=String(c?.answer||'').trim().slice(0,1500);if(!q||!a)throw new Error('Each study card needs a question and answer.');return{question:q,answer:a,explanation:String(c.explanation||'').slice(0,1500)};}):[];
 if(!topics.length&&!cards.length)throw new Error('Select at least one topic or a study set.');
 if(topics.length&&cards.length)throw new Error('Choose one study-list source for each exam.');
 const minutes=Number(input.minutes);if(!Number.isInteger(minutes)||minutes<5||minutes>180)throw new Error('Choose a duration from 5 to 180 minutes.');
 return{title,date,source:source||course?.name||'My study set',course:course?.id||'',topics,cards,minutes};
}
export function buildMock(plan){
 const p=validateExam(plan),questions=[];
 for(const id of p.topics){const u=UNITS[id];questions.push({id:id+'-check',topic:u.title,type:'choice',question:u.q,options:u.options,answer:u.a,explanation:u.why,marks:1});questions.push({id:id+'-explain',topic:u.title,type:'written',question:'Explain '+u.title.toLowerCase()+'. Use a specific example to support your explanation.',answer:u.concept+'\n\nExample: '+u.example,criteria:['Explain the main concept accurately.','Use a relevant example and connect it to the explanation.'],marks:2});}
 for(const[c,i]of p.cards.map((c,i)=>[c,i]))questions.push({id:'card-'+i,topic:p.source,type:'written',question:c.question,answer:c.answer+(c.explanation?'\n\n'+c.explanation:''),criteria:['Give an accurate answer matching the key idea.','Explain your reasoning or include a relevant detail.'],marks:2});
 return{version:1,questions,totalMarks:questions.reduce((n,q)=>n+q.marks,0),source:p.source,createdAt:new Date().toISOString()};
}
export function markMock(blueprint,answers={}){let correct=0,objective=0,answered=0,written=0;const review=[];for(const q of blueprint.questions){const v=answers[q.id];if(q.type==='choice'){objective++;if(v===q.answer)correct++;else review.push(q.topic);if(Number.isInteger(v)&&v>=0&&v<q.options.length)answered++;}else{written++;if(typeof v==='string'&&v.trim())answered++;}}return{correct,objective,written,answered,total:blueprint.questions.length,review:[...new Set(review)]};}
export function normalizeExams(value){if(!Array.isArray(value))return[];return value.slice(0,100).flatMap(v=>{try{const plan=validateExam(v);if(typeof v.id!=='string')return[];return[{...v,...plan}];}catch{return[];}});}
