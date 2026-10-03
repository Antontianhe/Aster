import test from 'node:test';
import assert from 'node:assert/strict';
import {COURSES,makeQuiz} from './study.js';
import {EXTRA_QUESTIONS,selectPractice,practiceCoverage} from './questionBank.js';

test('every subject has a substantial, valid bank with unique prompts and explanations',()=>{
 const all=Object.values(COURSES).flatMap(c=>c.questions);assert.ok(all.length>=1000);assert.equal(new Set(all.map(q=>q.id)).size,all.length);
 for(const[id,c]of Object.entries(COURSES)){
  assert.ok(c.questions.length>=50,id);assert.equal(new Set(c.questions.map(q=>q.q)).size,c.questions.length,id);
  for(const q of c.questions){assert.equal(q.options.length,4,q.id);assert.equal(new Set(q.options.map(s=>s.toLowerCase().trim())).size,4,q.id);assert.ok(q.options.every(s=>typeof s==='string'&&s.trim()),q.id);assert.ok(q.a>=0&&q.a<4,q.id);assert.ok(q.why.length>20,q.id);assert.ok(q.topic&&q.sourceLabel,q.id)}
 }
});
test('math distractors do not contain equivalent fractions or equivalent algebraic expressions',()=>{
 for(const q of EXTRA_QUESTIONS.maths){if(q.id.includes('fraction-')||q.id.includes('probability-')){const values=q.options.map(v=>{const[a,b]=v.split('/').map(Number);return a/b});assert.equal(new Set(values).size,4,q.id)}
  if(/-(indices|divide|power|expand|collect)-/.test(q.id)){
   const evaluate=(value,x)=>{const m=value.match(/^(\d*)x(?:\^(\d+)|²)?(?: \+ (\d+))?$/);assert.ok(m,value);return Number(m[1]||1)*x**Number(m[2]||(value.includes('²')?2:1))+Number(m[3]||0)};
   for(let i=1;i<4;i++)assert.ok([2,3,5].some(x=>evaluate(q.options[i],x)!==evaluate(q.options[0],x)),q.id);
  }
 }
});
test('short sessions honour filters, bounds, latest mistakes and unseen-question priority',()=>{
 const bank=COURSES.science.questions,first=bank[0],second=bank[1];
 const attempts=[{question:first.q,correct:false},{question:first.q,correct:true},{question:second.q,correct:false}];
 assert.deepEqual(selectPractice(bank,{mode:'mistakes',attempts}).map(q=>q.q),[second.q]);
 const session=selectPractice(bank,{topic:'Physics',level:'applied',limit:30});assert.ok(session.length>0);assert.ok(session.every(q=>q.topic==='Physics'&&q.level==='applied'));
 assert.equal(selectPractice(bank,{limit:999}).length,30);assert.equal(selectPractice(bank,{topic:'not-a-topic'}).length,0);
 const fresh=selectPractice(bank,{limit:10,attempts});assert.ok(fresh.every(q=>!attempts.some(a=>a.question===q.q)));
 assert.deepEqual(practiceCoverage(bank,attempts),{total:bank.length,seen:2,missed:1});
});
test('sessions avoid paired versions where possible and targeted retries find the exact question',()=>{
 const bank=COURSES.computing.questions;
 const session=selectPractice(bank,{limit:20});assert.equal(new Set(session.map(q=>q.concept||q.id)).size,20);
 const last=bank.at(-1),retry=makeQuiz('computing',{selectedQuestion:last.q});assert.equal(retry.length,1);assert.equal(retry[0].q,last.q);assert.equal(retry[0].choices.filter(c=>c.correct).length,1);
 const unseenPair=bank.filter(q=>q.concept===bank[5].concept);const attempts=bank.filter(q=>!unseenPair.includes(q)).map(q=>({question:q.q,correct:true}));const fresh=selectPractice(bank,{limit:5,attempts});assert.ok(unseenPair.every(q=>fresh.slice(0,2).includes(q)));
});
