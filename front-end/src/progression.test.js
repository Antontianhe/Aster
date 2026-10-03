import test from 'node:test';
import assert from 'node:assert/strict';
import {tierFor,tierProgress,lessonUnlocked,completePathStage,progressReducer} from './progression.js';
import {normalizeProgress,finishReview,makeQuiz,COURSES} from './study.js';

test('tier thresholds and meters remain correct at every boundary',()=>{
  assert.equal(tierFor(99).name,'Ignite');
  assert.equal(tierFor(100).name,'Momentum');
  assert.equal(tierProgress(175).percent,50);
  assert.equal(tierProgress(250).percent,0);
  assert.equal(tierProgress(1000).percent,100);
  assert.equal(tierProgress(1200).next,undefined);
});
test('path unlocks are sequential, persistent and idempotent',()=>{
  let state=normalizeProgress(null);
  assert.equal(lessonUnlocked([],0),true);
  assert.equal(lessonUnlocked([],1),false);
  assert.equal(completePathStage(state,'music',4),state);
  state=completePathStage(state,'music',0);
  assert.equal(lessonUnlocked(state.paths.music,1),true);
  assert.equal(lessonUnlocked(state.paths.music,2),false);
  assert.equal(completePathStage(state,'music',0),state);
  for(let i=1;i<5;i++)state=completePathStage(state,'music',i);
  assert.deepEqual(state.paths.music,[0,1,2,3,4]);
  assert.equal(completePathStage(state,'music',5),state);
  assert.deepEqual(normalizeProgress(JSON.parse(JSON.stringify(state))).paths.music,[0,1,2,3,4]);
});
test('storage migration preserves old totals without inventing new completed lessons',()=>{
  const state=normalizeProgress({xp:165,gems:470,sessions:4,course:'music',completed:{music:2}});
  assert.equal(state.xp,165);assert.equal(state.gems,470);assert.deepEqual(state.paths,{});
  const corrupt=normalizeProgress({paths:{music:[0,0,3,-1,8,'1'],unknown:[0]},xp:-5,gems:NaN});
  assert.deepEqual(corrupt.paths,{music:[0,3]});assert.equal(corrupt.xp,0);assert.equal(corrupt.gems,0);
});
test('review rewards and daily streaks update once per recorded review',()=>{
  let state=finishReview(normalizeProgress(null),'music',4,5,new Date('2026-09-20T12:00:00Z'));
  assert.equal(state.xp,20);assert.equal(state.gems,8);assert.equal(state.streak,1);
  state=finishReview(state,'music',5,5,new Date('2026-09-20T13:00:00Z'));
  assert.equal(state.xp,45);assert.equal(state.streak,1);assert.equal(state.todaySessions,2);
  state=finishReview(state,'science',3,5,new Date('2026-09-21T12:00:00Z'));
  assert.equal(state.streak,2);assert.equal(state.todayXP,15);assert.equal(state.bestScores.music,100);
  assert.equal(state.attempts.music,2);assert.equal(state.attempts.science,1);
});
test('shuffling retains exactly one correct answer in every subject',()=>{
  for(const [id,course] of Object.entries(COURSES)){
    for(const question of makeQuiz(id)){
      assert.equal(question.choices.filter(c=>c.correct).length,1);
      const original=course.questions.find(q=>q.q===question.q);
      assert.equal(question.choices.find(c=>c.correct).text,original.options[original.a]);
    }
  }
});
test('central reducer handles functional updates and lesson completion without mutation',()=>{
  const previous=normalizeProgress(null);
  const next=progressReducer(previous,{type:'update',update:p=>({...p,xp:p.xp+25})});
  assert.equal(previous.xp,0);assert.equal(next.xp,25);
  const completed=progressReducer(next,{type:'complete-stage',subject:'maths',stage:0});
  assert.deepEqual(next.paths,{});assert.deepEqual(completed.paths.maths,[0]);
  assert.equal(progressReducer(completed,{type:'unknown'}),completed);
});
