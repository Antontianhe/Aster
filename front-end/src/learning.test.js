import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeLearning,confidenceSummary,previousAttempt,createStudyPlan,quadraticValue,quadraticFeatures,bossScore} from './learning.js';
import {BOSSES} from './labData.js';

test('confidence distinguishes lucky uncertainty from confident misconceptions',()=>{
 assert.deepEqual(confidenceSummary([{correct:true,confidence:1},{correct:false,confidence:3},{correct:true,confidence:3},{correct:false,confidence:1}]),{total:4,correct:2,unsureCorrect:1,confidentWrong:1});
});
test('learning records tolerate corrupt storage and retain bounded valid attempts',()=>{
 const valid={id:'a',subject:'maths',question:'One question',at:'2026-09-20T10:00:00Z',correct:true,confidence:99,diagnosis:'unknown',reasoning:'x'.repeat(2000)};
 assert.deepEqual(normalizeLearning(null),{attempts:[],sessions:[]});
 const result=normalizeLearning({attempts:[null,{...valid,subject:'bad'},valid],sessions:[{id:'s',kind:'unknown',title:'bad',at:valid.at}]});
 assert.equal(result.attempts.length,1);assert.equal(result.attempts[0].confidence,1);assert.equal(result.attempts[0].reasoning.length,1600);assert.equal(result.attempts[0].diagnosis,'');assert.equal(result.sessions.length,0);
 assert.equal(normalizeLearning({attempts:Array.from({length:510},(_,i)=>({...valid,id:String(i)}))}).attempts[0].id,'10');
});
test('personal comparisons use an earlier attempt of the same question and subject',()=>{
 const base={question:'Same wording',subject:'maths'};
 const entries=[{...base,id:'a',at:'2026-09-19T10:00:00Z'},{...base,id:'b',subject:'science',at:'2026-09-20T10:00:00Z'},{...base,id:'c',at:'2026-09-20T12:00:00Z'},{...base,id:'d',at:'2026-09-21T10:00:00Z'}];
 assert.equal(previousAttempt(entries,entries[2]).id,'a');assert.equal(previousAttempt(entries,entries[0]),null);
});
test('time-boxed plans fit every supported budget and adapt to low energy',()=>{
 for(let minutes=5;minutes<=60;minutes++)for(const energy of ['low','steady','high']){const plan=createStudyPlan(minutes,energy,'maths');assert.equal(plan.steps.reduce((n,s)=>n+s.minutes,0),minutes);assert.ok(plan.steps.every(s=>s.minutes>0));}
 assert.equal(createStudyPlan(0,'low','maths').minutes,12);assert.equal(createStudyPlan(100,'high','maths').minutes,60);assert.equal(createStudyPlan(12,'low','maths').steps[1].action,'notes');
});
test('quadratic playground covers roots, translations and degenerate linear cases',()=>{
 assert.deepEqual(quadraticFeatures(1,-2,-3),{type:'quadratic',vertex:[1,-4],roots:[-1,3]});
 assert.deepEqual(quadraticFeatures(1,0,1).roots,[]);assert.equal(quadraticFeatures(1,2,1).roots.length,1);
 assert.deepEqual(quadraticFeatures(0,2,-4),{type:'linear',vertex:null,roots:[2]});assert.equal(quadraticFeatures(0,0,2).type,'constant');
 for(const x of [-3,0,2])assert.equal(quadraticValue(2,-1,5,x)-quadraticValue(2,-1,3,x),2);
});
test('boss scoring never awards blank numeric answers and separates writing',()=>{
 const population=BOSSES.find(b=>b.id==='population');
 assert.equal(bossScore(population,{}),0);assert.equal(bossScore(population,{0:'500',1:'1,800',2:population.questions[2].answer}),3);
 assert.equal(bossScore({questions:[{answer:0}]},{0:''}),0);assert.equal(bossScore({questions:[{answer:0}]},{0:'0'}),1);
 assert.equal(bossScore(population,{0:'500 people',1:'NaN',2:-1}),0);
});
