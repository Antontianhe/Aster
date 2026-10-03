import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCalendar, isReminderDue, loadHomework, sortHomework, dueLabel, reminderKey, SEED_HOMEWORK, berlinDateTimeToISO, reminderTimestamp } from './homework.js';
import { COURSES, IMPORTED_HOMEWORK } from './schoolData.js';

test('verified subjects and quiz banks are internally consistent',()=>{
  assert.equal(Object.keys(COURSES).length,13);
  for(const course of Object.values(COURSES)){
    assert.match(course.source,/^https:\/\/lms\.isr-school\.com\/homepage\/\d+$/);
    if(course.questions.length){assert.equal(course.topics.length,5);assert.equal(course.questions.length,5);}
    for(const q of course.questions){assert.ok(q.a>=0&&q.a<q.options.length);assert.equal(q.options.length,4);}
  }
});
test('submitted worksheets never produce reminders',()=>{
  const submitted=IMPORTED_HOMEWORK.filter(t=>t.course==='computing');
  assert.equal(submitted.length,3);
  for(const t of submitted){assert.equal(t.done,true);assert.equal(isReminderDue(t,Date.parse(t.due)-3600000),false);}
});
test('reminder activates in its window, not early or after its deadline',()=>{
  const t=IMPORTED_HOMEWORK.find(t=>t.id==='school-9464');const due=Date.parse(t.due);
  assert.equal(isReminderDue(t,due-86400001),false);
  assert.equal(isReminderDue(t,due-86400000),true);
  assert.equal(isReminderDue(t,due-1000),true);
  assert.equal(isReminderDue(t,due),false);
  assert.equal(isReminderDue({...t,remindHours:null},due-1000),false);
  assert.notEqual(reminderKey(t),reminderKey({...t,remindHours:48}));
});
test('calendar preserves Berlin DST offsets and excludes undated/submitted work',()=>{
  const calendar=buildCalendar(IMPORTED_HOMEWORK,new Date('2026-09-19T12:00:00Z'));
  assert.equal((calendar.match(/BEGIN:VEVENT/g)||[]).length,3);
  assert.match(calendar,/DTSTART:20260922T122000Z/);
  assert.match(calendar,/DTSTART:20261027T132000Z/);
  assert.match(calendar,/TRIGGER:-PT24H/);
  assert.match(calendar,/TRIGGER:-PT48H/);
  assert.doesNotMatch(calendar,/UID:school-(10185|10063|9154|10609)@/);
  assert.ok(calendar.endsWith('END:VCALENDAR\r\n'));
  for(const line of calendar.split('\r\n'))assert.ok(new TextEncoder().encode(line).length<=75);
});
test('calendar escapes line breaks and punctuation in personal notes',()=>{
  const text=buildCalendar([{id:'local-test',course:'music',title:'Review, repeat; learn',due:'2026-09-22T14:20:00+02:00',details:'One\nTwo; three, four',remindHours:1,done:false}]);
  assert.match(text,/SUMMARY:Music: Review\\, repeat\\; learn/);
  assert.match(text,/DESCRIPTION:One\\nTwo\\; three\\, four/);
});
test('homework sorting, restoration and corrupt storage fallback are safe',()=>{
  const sorted=sortHomework(IMPORTED_HOMEWORK);assert.equal(sorted[0].id,'school-9464');
  const badStorage={getItem:()=>'{broken'};assert.equal(loadHomework(badStorage).length,SEED_HOMEWORK.length);
  const custom={id:'local-test',title:'My task',course:'maths',due:null,remindHours:null,done:false};
  const storage={getItem:()=>JSON.stringify([{...IMPORTED_HOMEWORK[0],done:true},custom,{...custom,id:'local-bad',course:'unknown'}])};
  const restored=loadHomework(storage);assert.equal(restored.length,SEED_HOMEWORK.length+1);assert.equal(restored[0].done,true);assert.ok(restored.some(t=>t.id==='local-test'));assert.ok(!restored.some(t=>t.id==='local-bad'));
});
test('uncertain dates remain explicit instead of invented',()=>{
  assert.equal(dueLabel(null),'Date to confirm');
  assert.equal(dueLabel('2026-09-22T14:20:00+02:00',new Date('2026-09-21T12:00:00Z')),'Tomorrow · 14:20');
});

test('Berlin date entry handles summer, winter and nonexistent DST times',()=>{
  assert.equal(berlinDateTimeToISO('2026-09-22T14:20'),'2026-09-22T12:20:00.000Z');
  assert.equal(berlinDateTimeToISO('2026-10-27T14:20'),'2026-10-27T13:20:00.000Z');
  assert.equal(berlinDateTimeToISO('2026-03-29T02:30'),null);
});
test('date-only tasks keep calendar dates and morning reminders',()=>{
  const t={id:'local-date',course:'english',title:'Revision',due:'2026-09-24',allDay:true,remindHours:24,done:false};
  assert.equal(reminderTimestamp(t),Date.parse('2026-09-23T07:00:00Z'));
  assert.equal(isReminderDue(t,Date.parse('2026-09-24T18:00:00Z')),true);
  assert.equal(isReminderDue(t,Date.parse('2026-09-24T22:00:00Z')),false);
  const calendar=buildCalendar([t]);
  assert.match(calendar,/DTSTART;VALUE=DATE:20260924/);
  assert.match(calendar,/DTEND;VALUE=DATE:20260925/);
  assert.match(calendar,/TRIGGER;VALUE=DATE-TIME:20260923T070000Z/);
});
