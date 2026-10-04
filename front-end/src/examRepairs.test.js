import test from 'node:test';
import assert from 'node:assert/strict';
import {repairsFor,editRepair,normalizeRepair} from './examRepairs.js';
test('observed mistakes become editable correction cards, old reports remain usable',()=>{
  const [r]=repairsFor({mistakes:[{question:'Solve 2x + 3 = 11.',originalAnswer:'x = 7',teacherFeedback:'Subtract 3 first.'}]},()=> 'q1');
  assert.equal(r.id,'q1');assert.equal(r.confirmed,false);assert.equal(r.attempt,'');
  assert.deepEqual(repairsFor({weaknesses:[{topic:'Algebra'}]}),[]);
  assert.deepEqual(repairsFor({repairs:[],mistakes:[{}]}),[]);
});
test('changing source or answer invalidates stale AI approval',()=>{
  const base=normalizeRepair({question:'Solve x + 3 = 5',attempt:'x = 2',confirmed:true,selfReviewed:true,feedback:{verdict:'improved',feedback:'Correct',nextStep:'Practise',suggestedAnswer:'x = 2'}});
  const source=editRepair(base,{question:'Solve x + 3 = 9'});assert.equal(source.feedback,null);assert.equal(source.confirmed,false);assert.equal(source.selfReviewed,false);
  const answer=editRepair(base,{attempt:'x = 6'});assert.equal(answer.feedback,null);assert.equal(answer.confirmed,true);
  assert.equal(editRepair(base,{reflection:'Subtract both sides.'}).feedback.verdict,'improved');
});
test('saved repairs bound text and reject malformed feedback',()=>{
  assert.equal(normalizeRepair({feedback:{verdict:'A+'},attempt:'a'.repeat(6000)}).feedback,null);
  assert.equal(normalizeRepair({attempt:'a'.repeat(6000)}).attempt.length,5000);
  assert.equal(repairsFor({repairs:Array.from({length:30},()=>({id:'q'}))}).length,20);
});
