import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSchoolCalendar,eventsForDay,schoolDay,schoolTime,examStatus,revisionPlan,orderedAssessments,matchAssessmentGuide,validSchoolSnapshot,mergeSchoolEvents} from './schoolSync.js';
import {examQuestions} from './examPractice.js';
import {localRequestAllowed} from '../../scripts/local-school-plugin.mjs';
const wrap=events=>'BEGIN:VCALENDAR\r\n'+events+'\r\nEND:VCALENDAR';
test('Schoolbox feed preserves exact class instances and unfolds descriptions',()=>{
 const events=parseSchoolCalendar(wrap('BEGIN:VEVENT\r\nUID:lesson\r\nDTSTART:20261005T062000Z\r\nDTEND:20261005T064000Z\r\nSUMMARY:G8 Homeroom\r\nLOCATION:1057-8B\r\nDESCRIPTION:A long\r\n  description\\nSecond line\\, yes\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:lesson\r\nDTSTART:20261006T062000Z\r\nSUMMARY:G8 Homeroom\r\nEND:VEVENT'));
 assert.equal(events.length,2);assert.notEqual(events[0].id,events[1].id);assert.equal(events[0].kind,'class');assert.equal(events[0].description,'A long description\nSecond line, yes');assert.equal(schoolTime(events[0].start),'08:20');assert.equal(eventsForDay(events,'2026-10-07').length,0);
});
test('All-day end dates are exclusive and cancelled events are omitted',()=>{
 const events=parseSchoolCalendar(wrap('BEGIN:VEVENT\nUID:break\nDTSTART;VALUE=DATE:20261019\nDTEND;VALUE=DATE:20261024\nSUMMARY:Fall break\nEND:VEVENT\nBEGIN:VEVENT\nUID:cancelled\nDTSTART:20261020T062000Z\nSUMMARY:G8 Science\nSTATUS:CANCELLED\nEND:VEVENT'));
 assert.equal(events.length,1);assert.equal(eventsForDay(events,'2026-10-23').length,1);assert.equal(eventsForDay(events,'2026-10-24').length,0);
});
test('Berlin local calendar times survive the October daylight-saving change',()=>{
 const events=parseSchoolCalendar(wrap('BEGIN:VEVENT\nUID:before\nDTSTART;TZID=Europe/Berlin:20261023T084000\nSUMMARY:G8 Science\nEND:VEVENT\nBEGIN:VEVENT\nUID:after\nDTSTART;TZID=Europe/Berlin:20261026T084000\nSUMMARY:G8 Science\nEND:VEVENT'));
 assert.equal(events[0].start,'2026-10-23T06:40:00.000Z');assert.equal(events[1].start,'2026-10-26T07:40:00.000Z');
});
test('Past, today and future exam states use the school day, not the host timezone',()=>{
 const now=Date.parse('2026-10-04T22:30:00Z');assert.equal(schoolDay(now),'2026-10-05');assert.equal(examStatus({date:'2026-10-04'},now),'past');assert.equal(examStatus({date:'2026-10-05'},now),'today');assert.equal(examStatus({date:'2026-10-08'},now),'upcoming');assert.equal(examStatus({},now),'undated');assert.equal(examStatus({date:'2026-10-05',end:'2026-10-05T07:00:00Z',allDay:false},Date.parse('2026-10-05T08:00:00Z')),'past');
});
test('Revision plans cover every topic before the exam and never schedule past exams',()=>{
 const now=Date.parse('2026-10-04T10:00:00Z'),exam={id:'science',subject:'science',date:'2026-10-08',topics:Array.from({length:9},(_,i)=>'Topic '+i)};const plan=revisionPlan(exam,now);assert.equal(plan.length,4);assert.ok(plan.every(p=>p.date<exam.date&&p.date>=schoolDay(now)));for(const topic of exam.topics)assert.equal(plan.filter(p=>p.title.includes(topic)).length,1);assert.equal(revisionPlan({...exam,date:'2026-10-01'},now).length,0);assert.equal(revisionPlan({...exam,date:null},now).length,0);
});
test('A published Assessment 1 guide never becomes Assessment 2 or end-of-term topics',()=>{
 const guides=[{subject:'science',assessment:'T1 Assessment 1',topics:['Plants']}];assert.equal(matchAssessmentGuide(guides,{subject:'science',title:'T1 Assessment 2',date:'2026-10-08'}),undefined);assert.equal(matchAssessmentGuide(guides,{subject:'science',title:'T1 EOTA',date:'2026-11-19'}),undefined);assert.equal(matchAssessmentGuide(guides,{subject:'maths',title:'T1 Assessment 1'}),undefined);
});
test('Upcoming exams sort ahead of archived exams, whose latest date comes first',()=>{
 const values=[{id:'old',date:'2026-09-01'},{id:'new',date:'2026-10-08'},{id:'recent',date:'2026-10-01'}];assert.deepEqual(orderedAssessments(values,null,Date.parse('2026-10-04T10:00:00Z')).map(v=>v.id),['new','recent','old']);
});
test('Science practice covers every published topic and provides model answers',()=>{
 const rows=examQuestions({id:'s',practiceKey:'science-kidneys-genetics'});assert.equal(rows.length,27);assert.equal(new Set(rows.map(q=>q.topic)).size,9);assert.equal(new Set(rows.map(q=>q.id)).size,rows.length);assert.ok(rows.every(q=>q.answer&&q.question&&!q.guided));
});
test('New topics get labelled guided revision without invented model answers',()=>{
 const rows=examQuestions({id:'new',topics:['Teacher-published topic']});assert.equal(rows.length,2);assert.ok(rows.every(q=>q.guided));assert.equal(examQuestions({id:'pending',topics:[]}).length,0);
});
test('Private local school data rejects LAN, cross-site and mismatched-origin access',()=>{
 const req={headers:{host:'127.0.0.1:5173',origin:'http://127.0.0.1:5173','sec-fetch-site':'same-origin'},socket:{remoteAddress:'127.0.0.1'}};assert.ok(localRequestAllowed(req));assert.equal(localRequestAllowed({...req,socket:{remoteAddress:'192.168.1.6'}}),false);assert.equal(localRequestAllowed({...req,headers:{...req.headers,'sec-fetch-site':'cross-site'}}),false);assert.equal(localRequestAllowed({...req,headers:{...req.headers,origin:'https://example.com'}}),false);assert.equal(localRequestAllowed({...req,headers:{...req.headers,host:'evil.example:5173'}}),false);
});
test('Assessment guides remain bound to their year or exact assignment when dates change',()=>{
 const guide={subject:'science',assessment:'T1 Assessment 2',year:2026},exam={subject:'science',title:'T1 Assessment 2',date:'2026-10-08',id:'vc-1'};
 assert.equal(matchAssessmentGuide([guide],exam),guide);
 assert.equal(matchAssessmentGuide([guide],{...exam,date:'2027-10-08'}),undefined);
 assert.equal(matchAssessmentGuide([{...guide,year:undefined}],exam),undefined);
 const bound={...guide,assessmentId:'vc-1'};assert.equal(matchAssessmentGuide([bound],{...exam,date:'2026-10-09'}),bound);
 assert.equal(matchAssessmentGuide([bound],{...exam,id:'vc-2'}),undefined);
});
test('Conflicting exam dates prepare before the earliest, without prematurely archiving',()=>{
 const exam={id:'music',subject:'music',date:'2026-10-29',alternateDates:[{date:'2026-10-27'}],topics:['Listening','Chords']};
 assert.ok(revisionPlan(exam,Date.parse('2026-10-26T10:00:00Z')).every(p=>p.date<'2026-10-27'));
 assert.equal(examStatus(exam,Date.parse('2026-10-28T10:00:00Z')),'upcoming');
 assert.equal(revisionPlan(exam,Date.parse('2026-10-28T10:00:00Z')).length,0);
 assert.equal(examStatus(exam,Date.parse('2026-10-30T10:00:00Z')),'past');
});
test('A distant exam places its final review before the exam rather than weeks too early',()=>{
 const plan=revisionPlan({id:'future',subject:'maths',date:'2026-11-26',topics:['One','Two']},Date.parse('2026-10-04T10:00:00Z'));
 assert.deepEqual(plan.map(p=>p.date),['2026-11-23','2026-11-24','2026-11-25']);assert.equal(plan.at(-1).title,'Mixed practice & corrections');
});
test('School snapshot rejects malformed dates and executable links',()=>{
 const empty={version:1,resources:[],events:[],assessments:[],units:[],documents:[],subjects:[]};assert.ok(validSchoolSnapshot(empty));
 assert.equal(validSchoolSnapshot({...empty,resources:[{id:'r',subject:'science',title:'Resource',url:'javascript:alert(1)'}]}),false);
 assert.equal(validSchoolSnapshot({...empty,assessments:[{id:'a',subject:'science',title:'Test',date:'2026-02-31',topics:[],guideIds:[]}]}),false);
});
test('Confirmed school closures hide ordinary lessons while keeping events and term-resumption classes',()=>{
 const closure={id:'break',title:'Fall break',date:'2026-10-19',start:'2026-10-19',end:'2026-10-24',allDay:true,schoolClosed:true};
 const lesson=date=>({id:date,title:'Science',kind:'class',date,start:date+'T07:00:00Z'});
 const event={id:'special',title:'School event',kind:'event',date:'2026-10-20',start:'2026-10-20T08:00:00Z'};
 const merged=mergeSchoolEvents([lesson('2026-10-16'),lesson('2026-10-19'),lesson('2026-10-23'),lesson('2026-10-26'),event],[closure]);
 assert.deepEqual(merged.filter(e=>e.kind==='class').map(e=>e.date),['2026-10-16','2026-10-26']);assert.ok(merged.includes(event));assert.ok(merged.includes(closure));
});
