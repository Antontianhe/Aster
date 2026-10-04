// Read captures made through the signed-in school browser. Private inputs and output stay in .work.
import fs from 'node:fs/promises';
import {scienceResourceBranch} from '../front-end/src/scienceResources.js';
import {createHash} from 'node:crypto';
import {parseSchoolCalendar,subjectFromTitle,safeSchoolUrl,matchAssessmentGuide,mergeSchoolEvents} from '../front-end/src/schoolSync.js';
import {berlinDateTimeToISO,addDateDays} from '../front-end/src/homework.js';
const dir=new URL('../.work/school-sync/',import.meta.url);
const read=async(name,fallback)=>JSON.parse(await fs.readFile(new URL(name,dir),'utf8').catch(()=>JSON.stringify(fallback)));
const [pages,records,guides,documents,texts,schoolboxDates]=await Promise.all([read('pages.json',[]),read('veracross-assessments.json',[]),read('assessment-guides.json',[]),read('documents.json',[]),read('document-text.json',[]),read('schoolbox-assessments.json',[])]);
const checkedAt=new Date().toISOString(),resources=new Map(),units=new Map();
const subjects={advising:5094,art:5109,computing:5161,drama:5213,english:5245,german:5196,maths:5322,music:5344,pe:5372,science:5382,social:5413,spanish:5399,homeroom:3486};
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
for(const page of pages){
 if(!page.title||/permission|^Resources$/.test(page.title))continue;
 if(/Chinese|French|Japanese|English B1/.test(page.title))continue; // These are not the student's enrolled language courses.
 const subject=subjectFromTitle(page.title)||page.subject;if(!subjects[subject])continue;
 const unit=page.title.replace(/^View Files on /,'');
 let grade=/G7|^[5-8] - \(B\)|^[7-9] - \(C\)|^[6-9] - \(P\)|^10 - \(P\)/.test(unit)?7:8;
 const branch=/\(B\)|Biology|excretion|genetic|variation/i.test(unit)?'Biology':/\(C\)|Chemistry/i.test(unit)?'Chemistry':/\(P\)|Physics/i.test(unit)?'Physics':'';
 const items=[];
 for(const link of page.links||[]){
  const title=clean(link.title),url=safeSchoolUrl(link.url);if(!title||title.length>240||!url)continue;
  if(!/\/send\.php\?|\/storage\/|\/redir\.php\?|\.pptx?(?:\?|$)|\.pdf(?:\?|$)|\.docx?(?:\?|$)/i.test(url))continue;
  if(/\/(settings|profile|logout)/.test(url))continue;
  const id='resource-'+createHash('sha256').update(url).digest('hex').slice(0,14),document=documents.find(d=>d.source===url);
  const redirected=new URL(url).searchParams.get('url');let destination='';if(redirected){try{destination=Buffer.from(redirected,'base64').toString('utf8');}catch{}}
  const kind=/\.ppt|powerpoint|presentation/i.test(title+' '+decodeURIComponent(url)+' '+destination)?'Slides':document?.file.endsWith('.pdf')?'PDF':/vocab|worksheet|revision|exercises/i.test(title)?'Worksheet':'Resource';
  const record={id,title,url,subject,unit,branch:subject==='science'?scienceResourceBranch({branch,unit,title}):branch,grade,kind,source:'Schoolbox',sourceUrl:page.url.split('#')[0],checkedAt,...(document?{documentId:document.id,documentType:document.file.split('.').pop()}:{} )};
  if(!resources.has(url)||/View Files|^Files$/.test(resources.get(url).unit))resources.set(url,record);
  items.push(id);
 }
 if(/\/homepage\/\d+\/?$/.test(new URL(page.url).pathname)&&items.length&&!/^G[78]|Assessment Topics/.test(unit))units.set(page.url,{id:page.url.split('/').filter(Boolean).pop(),subject,title:unit,branch,grade,source:page.url,resourceIds:items});
}
const months={Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'},assessments=[];
for(const record of records){
 const subject=subjectFromTitle(record.text.split('SchoolBox').at(-1)),m=/Due Date\s*\n\w+, (\w{3}) (\d{2})/.exec(record.text),title=/\n(T\d [^\n]+)\nDate Assigned/.exec(record.text)?.[1];
 if(!subject||!title||!m||!months[m[1]]||!Number.isInteger(record.year))continue;
 const date=`${record.year}-${months[m[1]]}-${m[2]}`,id='vc-'+record.url.split('/').pop();
 const guide=matchAssessmentGuide(guides,{id,subject,title,date});
 assessments.push({id,subject,title,date,allDay:true,source:'Veracross',sourceUrl:record.url,checkedAt,topics:guide?.topics||[],guideIds:guide?.guideIds||[],practiceKey:guide?.practiceKey||'',coverage:guide?.coverage||'',notes:guide?.notes||'',topicSource:guide?.source||'',topicStatus:guide?'published':'not published in the imported guides'});
}
// Keep date-specific guides visible even when the two portals use different assessment labels.
for(const guide of guides.filter(g=>g.date&&!assessments.some(a=>a.subject===g.subject&&a.date===g.date))){assessments.push({id:'guide-'+guide.subject+'-'+guide.date,subject:guide.subject,title:guide.assessment,date:guide.date,allDay:true,source:'Schoolbox',sourceUrl:guide.source,checkedAt,topics:guide.topics,guideIds:guide.guideIds||[],practiceKey:guide.practiceKey||'',coverage:guide.coverage||'',notes:guide.notes||'',topicSource:guide.source,topicStatus:'published'});}
for(const assessment of assessments){
 const records=schoolboxDates.filter(record=>record.assessmentId===assessment.id&&record.subject===assessment.subject&&safeSchoolUrl(record.sourceUrl));
 assessment.alternateDates=records.filter(record=>record.date!==assessment.date).map(({date,time,sourceUrl,checkedAt})=>({date,time,sourceUrl,checkedAt,source:'Schoolbox'}));
 assessment.dateConflict=assessment.alternateDates.length>0;
}
const portalEvents=[];
for(const record of await read('veracross-events.json',[])){
 const body=record.text.split('SchoolBox').at(-1),title=/\n(?:OTHER|NO SCHOOL)\n([^\n]+)/.exec(body)?.[1],start=/(?:EVENT|START) DATE\n\w+ (\w{3}) (\d{1,2}), (\d{4})/.exec(body),end=/END DATE\n\w+ (\w{3}) (\d{1,2}), (\d{4})/.exec(body);
 if(!title||!start||!months[start[1]])continue;
 const day=m=>`${m[3]}-${months[m[1]]}-${m[2].padStart(2,'0')}`,date=day(start),times=/EVENT TIME\n(\d{1,2}):(\d{2}) (AM|PM) - (\d{1,2}):(\d{2}) (AM|PM)/.exec(body),hour=(h,ap)=>String(Number(h)%12+(ap==='PM'?12:0)).padStart(2,'0');
 portalEvents.push({id:'vc-event-'+record.url.split('/').pop(),title,date,start:times?berlinDateTimeToISO(`${date}T${hour(times[1],times[3])}:${times[2]}`):date,end:times?berlinDateTimeToISO(`${date}T${hour(times[4],times[6])}:${times[5]}`):addDateDays(end?day(end):date,1),allDay:!times,kind:'event',schoolClosed:/NO SCHOOL/i.test(title),source:'Veracross',sourceUrl:record.url});
}
const events=mergeSchoolEvents(parseSchoolCalendar(await fs.readFile(new URL('calendar.ics',dir),'utf8')),portalEvents);
const snapshot={version:1,checkedAt,source:'Schoolbox & Veracross',resources:[...resources.values()],units:[...units.values()],assessments:[...new Map(assessments.map(a=>[a.id,a])).values()].sort((a,b)=>a.date.localeCompare(b.date)),events,portalEvents,subjects:Object.entries(subjects).map(([id,page])=>({id,url:`https://lms.isr-school.com/homepage/${page}`})),documents:documents.filter(d=>/\.(pdf|png|docx|pptx)$/.test(d.file)).map(({id,title,subject,source,file})=>({id,title,subject,source,type:file.split('.').pop(),...(file.endsWith('.docx')?{text:texts.find(t=>t.id===id)?.text||''}:{})})),coverage:{pages:new Set(pages.map(p=>p.url.split('#')[0].split('?')[0])).size,blocked:[...new Set(pages.filter(p=>/permission/.test(p.title)).map(p=>p.url))],note:'Catalogue includes accessible course and assessment links. Some teacher folders require additional permission. Dates are imported from published school records.'}};
await fs.writeFile(new URL('snapshot.json.tmp',dir),JSON.stringify(snapshot));await fs.rename(new URL('snapshot.json.tmp',dir),new URL('snapshot.json',dir));
console.log(JSON.stringify({resources:snapshot.resources.length,science:snapshot.resources.filter(r=>r.subject==='science').length,units:snapshot.units.length,assessments:snapshot.assessments.length,events:events.length,blocked:snapshot.coverage.blocked.length,bytes:JSON.stringify(snapshot).length}));
