import test from 'node:test';import assert from 'node:assert/strict';
import {makeFact,markFact,summariseFacts} from './mathSprint.js';
test('all table and division questions have exact integral answers',()=>{
 for(let table=2;table<=12;table++)for(let n=0;n<12;n++)for(const mode of ['multiply','divide']){
  let calls=0;const q=makeFact([table],mode,()=>calls++===0?0:(n+.1)/12);
  assert.equal(q.answer,mode==='multiply'?table*(n+1):n+1);assert.equal(markFact(q,String(q.answer)),true);assert.equal(markFact(q,String(q.answer+1)),false);
 }
 assert.throws(()=>makeFact([0,13]),/Choose/);
});
test('answers must be complete numeric values, not expression prefixes',()=>{
 const q={answer:12};for(const v of ['12abc','12+3','','12.0','Infinity'])assert.equal(markFact(q,v),false);assert.equal(markFact(q,' 12 '),true);
});
test('summary keeps only missed questions for targeted repetition',()=>{
 const rows=[{prompt:'2 × 3',answer:6,given:'6',correct:true},{prompt:'12 ÷ 3',answer:4,given:'5',correct:false}];
 assert.deepEqual(summariseFacts(rows),{correct:1,total:2,accuracy:50,mistakes:[rows[1]]});assert.equal(summariseFacts([]).accuracy,0);
});
