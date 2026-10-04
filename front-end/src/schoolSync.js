// Shared by the private local importer and the browser. Dates follow the school timezone.
export const SCHOOL_TIMEZONE = 'Europe/Berlin';
export const SCHOOL_SUBJECTS = ['maths','english','science','german','spanish','social','computing','art','music','drama','pe','advising','homeroom'];
export function schoolDay(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:SCHOOL_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
  return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');
}
export function schoolTime(value) { return new Intl.DateTimeFormat('en-GB',{timeZone:SCHOOL_TIMEZONE,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value)); }
export function subjectFromTitle(title='') {
  const entries=[['maths',/math/i],['english',/english/i],['science',/science|biology|chemistry|physics/i],['german',/german/i],['spanish',/spanish/i],['social',/social studies/i],['computing',/computing/i],['art',/\bart\b/i],['music',/music/i],['drama',/drama|theatre/i],['pe',/physical education|\bPE\b/i],['advising',/advising/i],['homeroom',/homeroom/i]];
  return entries.find(([,rx])=>rx.test(title))?.[0] || null;
}
export function safeSchoolUrl(value) {
  try {const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password ? u.href : '';}catch{return '';}
}
export function validSchoolSnapshot(value) {
  const text=v=>typeof v==='string', strings=v=>Array.isArray(v)&&v.every(text);
  const subject=v=>SCHOOL_SUBJECTS.includes(v), url=v=>!v||Boolean(safeSchoolUrl(v));
  const date=v=>text(v)&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
  if(value?.version!==1||!['resources','events','assessments','units','documents','subjects'].every(k=>Array.isArray(value[k])))return false;
  return (!value.checkedAt||Number.isFinite(Date.parse(value.checkedAt)))
    && value.resources.every(r=>r&&text(r.id)&&text(r.title)&&subject(r.subject)&&Boolean(safeSchoolUrl(r.url)))
    && value.events.every(e=>e&&text(e.id)&&text(e.title)&&date(e.date)&&Number.isFinite(Date.parse(e.start))&&Number.isFinite(Date.parse(e.end))&&(!e.subject||subject(e.subject))&&url(e.sourceUrl))
    && value.assessments.every(a=>a&&text(a.id)&&subject(a.subject)&&text(a.title)&&(!a.date||date(a.date))&&strings(a.topics)&&strings(a.guideIds)&&url(a.sourceUrl)&&url(a.topicSource)&&(!a.alternateDates||Array.isArray(a.alternateDates)&&a.alternateDates.every(d=>d&&date(d.date)&&url(d.sourceUrl))))
    && value.units.every(u=>u&&subject(u.subject)&&text(u.title)&&strings(u.resourceIds)&&url(u.source))
    && value.documents.every(d=>d&&text(d.id)&&/^[a-z]+-\d+$/.test(d.id)&&text(d.title)&&url(d.source)&&(!d.text||text(d.text)))
    && value.subjects.every(s=>s&&subject(s.id)&&url(s.url));
}
const unescapeIcs=value=>(value||'').replace(/\\([nN,;\\])/g,(_,c)=>/[nN]/.test(c)?'\n':c);
function icsDate(value,params='') {
  const m=/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(value||'');
  if(!m)return null;
  const date=`${m[1]}-${m[2]}-${m[3]}`;
  if(!m[4])return {value:date,allDay:true};
  const plain=`${date}T${m[4]}:${m[5]}:${m[6]}`;
  if(m[7])return {value:plain+'Z',allDay:false};
  const zone=/TZID=([^;]+)/.exec(params)?.[1]||SCHOOL_TIMEZONE;
  // Resolve a local wall clock in its IANA timezone, including daylight saving.
  let epoch=Date.parse(plain+'Z');
  const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  for(let i=0;i<3;i++){const p=Object.fromEntries(fmt.formatToParts(epoch).map(p=>[p.type,p.value]));const represented=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);epoch+=Date.parse(plain+'Z')-represented;}
  return {value:new Date(epoch).toISOString(),allDay:false};
}
export function parseSchoolCalendar(text) {
  if(!String(text).includes('BEGIN:VCALENDAR'))throw new Error('The school did not return a calendar. Your feed may need reconnecting.');
  const lines=String(text).replace(/\r?\n[ \t]/g,'').split(/\r?\n/),events=[];let current=null;
  for(const line of lines){
    if(line==='BEGIN:VEVENT'){current={};continue;}
    if(line==='END:VEVENT'&&current){
      if(current.STATUS?.value!=='CANCELLED'){
        const start=icsDate(current.DTSTART?.value,current.DTSTART?.params),end=icsDate(current.DTEND?.value,current.DTEND?.params);
        if(start){const title=unescapeIcs(current.SUMMARY?.value),category=unescapeIcs(current.CATEGORIES?.value),subject=subjectFromTitle(title);
          events.push({id:`schoolbox-${current.UID?.value||title}-${current['RECURRENCE-ID']?.value||start.value}`,title,start:start.value,end:end?.value||start.value,date:start.allDay?start.value:schoolDay(start.value),allDay:start.allDay,kind:/exam|assessment/i.test(category+' '+title)?'exam':/^G8\b/i.test(title)&&subject?'class':'event',subject,location:unescapeIcs(current.LOCATION?.value),description:unescapeIcs(current.DESCRIPTION?.value),source:'Schoolbox',sourceUrl:'https://lms.isr-school.com/calendar/week',recurrenceUnsupported:Boolean(current.RRULE)});
        }
      }current=null;continue;
    }
    if(current){const pos=line.indexOf(':');if(pos<0)continue;const [key,...params]=line.slice(0,pos).split(';');current[key]={params:params.join(';'),value:line.slice(pos+1)};}
  }
  return [...new Map(events.map(e=>[e.id,e])).values()].sort((a,b)=>a.start.localeCompare(b.start));
}
export function examStatus(exam,now=Date.now()) {
  if(!exam.date)return 'undated';
  const latestDate=[exam.date,...(exam.alternateDates||[]).map(d=>d.date)].sort().at(-1);
  if(latestDate<schoolDay(now)||(exam.end&&!exam.allDay&&Date.parse(exam.end)<Number(new Date(now))))return 'past';
  return exam.date===schoolDay(now)?'today':'upcoming';
}
export function daysUntil(date,now=Date.now()){return date?Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(schoolDay(now)+'T12:00:00Z'))/86400000):null;}
export function orderedAssessments(assessments,subject,now=Date.now()) {
  const order={today:0,upcoming:1,undated:2,past:3};
  return assessments.filter(a=>!subject||a.subject===subject).slice().sort((a,b)=>order[examStatus(a,now)]-order[examStatus(b,now)]||(examStatus(a,now)==='past'?String(b.date).localeCompare(String(a.date)):String(a.date||'9999').localeCompare(String(b.date||'9999'))));
}
export function revisionPlan(exam,now=Date.now()) {
  if(examStatus(exam,now)==='past')return [];
  const deadline=[exam.date,...(exam.alternateDates||[]).map(d=>d.date)].filter(Boolean).sort()[0];
  const topics=exam.topics||[],days=daysUntil(deadline,now);
  if(days===null||days<0||!topics.length)return [];
  const slots=Math.max(1,Math.min(days||1,14,topics.length+1)),startDate=new Date(deadline+'T12:00:00Z'),items=[];
  startDate.setUTCDate(startDate.getUTCDate()-(days>0?slots:0));
  const start=startDate.toISOString().slice(0,10);
  for(let i=0;i<slots;i++){
    const date=new Date(start+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+i);
    const assigned=topics.filter((_,n)=>n%Math.max(1,slots-1)===i);
    items.push({id:exam.id+'-revision-'+i,date:date.toISOString().slice(0,10),title:slots>1&&i===slots-1?'Mixed practice & corrections':assigned.map(t=>typeof t==='string'?t:t.title).join(' · '),minutes:Math.min(40,Math.max(15,assigned.length*8)),assessmentId:exam.id,subject:exam.subject});
  }return items;
}
export function eventsForDay(events,date){return events.filter(e=>e.allDay?e.date<=date&&(e.end>e.date?date<e.end:date===e.date):e.date===date).sort((a,b)=>a.start.localeCompare(b.start));}
export function mergeSchoolEvents(timetable,calendar=[]){
  const closed=calendar.filter(e=>e.schoolClosed);
  return [...timetable.filter(e=>e.kind!=='class'||!eventsForDay(closed,e.date).length),...calendar.filter(e=>!timetable.some(t=>t.kind!=='class'&&t.date===e.date&&t.title.toLowerCase()===e.title.toLowerCase()))].sort((a,b)=>a.start.localeCompare(b.start));
}
export function uniqueResources(resources){return [...new Map(resources.filter(r=>r?.title&&safeSchoolUrl(r.url)).map(r=>[r.url,r])).values()];}
export function matchAssessmentGuide(guides,exam){return guides.find(g=>g.subject===exam.subject&&(g.assessmentId?g.assessmentId===exam.id:g.date?g.date===exam.date:g.year===Number(exam.date?.slice(0,4))&&g.assessment===exam.title));}
