import {storage as accountStorage} from './storage.js';
import { COURSES, IMPORTED_HOMEWORK } from './schoolData.js';
import { EXTRA_HOMEWORK } from './schoolExtras.js';
export const HOMEWORK_KEY='dinostudy-homework-v1';
export const SEED_HOMEWORK=[...IMPORTED_HOMEWORK,...EXTRA_HOMEWORK];
export const SCHOOL_TIMEZONE='Europe/Berlin';
const allowedReminders=[0,1,24,48];
const dateOnly=/^\d{4}-\d{2}-\d{2}$/;
export function berlinInput(value){
  if(!value)return '';if(dateOnly.test(value))return value;if(!Number.isFinite(Date.parse(value)))return '';
  return new Intl.DateTimeFormat('sv-SE',{timeZone:SCHOOL_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value)).replace(' ','T');
}
export function berlinDateTimeToISO(value){
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))return null;
  const target=Date.parse(`${value}:00Z`);if(!Number.isFinite(target))return null;
  let guess=target;
  for(let i=0;i<3;i++){const displayed=Date.parse(`${berlinInput(new Date(guess).toISOString())}:00Z`);guess+=target-displayed;}
  const result=new Date(guess).toISOString();return berlinInput(result)===value?result:null;
}
export function addDateDays(value,days){const d=new Date(`${value}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
export function taskDay(item){return item.due?(item.allDay?item.due.slice(0,10):berlinInput(item.due).slice(0,10)):null;}
export function dueTimestamp(item){if(!item.due)return Infinity;return item.allDay?Date.parse(berlinDateTimeToISO(`${addDateDays(item.due.slice(0,10),1)}T00:00`))-1:Date.parse(item.due);}
export function loadHomework(storage=accountStorage){
  try{const saved=JSON.parse(storage.getItem(HOMEWORK_KEY));if(!Array.isArray(saved))return SEED_HOMEWORK.map(item=>({...item}));
    const valid=saved.filter(item=>item&&typeof item.id==='string'&&typeof item.title==='string'&&COURSES[item.course]&&(item.due===null||typeof item.due==='string'&&Number.isFinite(Date.parse(item.due)))&&(item.remindHours===null||allowedReminders.includes(item.remindHours)));
    const unique=new Map(valid.map(item=>[item.id,{...item,done:Boolean(item.done),priority:['high','normal','low'].includes(item.priority)?item.priority:'normal',checklist:Array.isArray(item.checklist)?item.checklist.filter(s=>typeof s==='string').slice(0,20):[],checks:Array.isArray(item.checks)?item.checks.filter(s=>Number.isInteger(s)&&s>=0):[]}]));
    return [...SEED_HOMEWORK.map(original=>({...original,...unique.get(original.id),source:original.source,sourceStatus:original.sourceStatus})),...Array.from(unique.values()).filter(item=>item.id.startsWith('local-'))];
  }catch{return SEED_HOMEWORK.map(item=>({...item}));}
}
export function dueLabel(due,now=new Date(),allDay=false){
  if(!due)return 'Date to confirm';const key=allDay?due.slice(0,10):berlinInput(due).slice(0,10);const nowKey=berlinInput(now.toISOString()).slice(0,10);const time=allDay?'':` · ${berlinInput(due).slice(11)}`;
  if(key===nowKey)return `Today${time}`;if(key===addDateDays(nowKey,1))return `Tomorrow${time}`;if(key===addDateDays(nowKey,-1))return `Yesterday${time}`;
  return new Intl.DateTimeFormat('en-GB',{timeZone:SCHOOL_TIMEZONE,day:'numeric',month:'short',...(key.slice(0,4)!==nowKey.slice(0,4)?{year:'numeric'}:{})}).format(new Date(`${key}T12:00:00Z`))+time;
}
export function sortHomework(items){return [...items].sort((a,b)=>Number(a.done)-Number(b.done)||dueTimestamp(a)-dueTimestamp(b)||a.title.localeCompare(b.title));}
export function reminderTimestamp(item){
  if(!item.due||item.remindHours===null||!allowedReminders.includes(item.remindHours))return Infinity;
  if(item.allDay){const days=Math.floor(item.remindHours/24);return Date.parse(berlinDateTimeToISO(`${addDateDays(item.due.slice(0,10),-days)}T09:00`));}
  return Date.parse(item.due)-item.remindHours*3600000;
}
export function isReminderDue(item,now=Date.now()){return Boolean(!item.done&&item.due&&item.remindHours!==null&&now>=reminderTimestamp(item)&&now<dueTimestamp(item));}
export function reminderKey(item){return `${item.id}:${item.due}:${Boolean(item.allDay)}:${item.remindHours}`;}
export function reminderLabel(item){if(item.remindHours===null)return 'Add reminder';if(item.allDay)return `${item.remindHours===0?'On the day':`${item.remindHours/24} day${item.remindHours===24?'':'s'} before`} · 09:00`;return item.remindHours===0?'At the due time':item.remindHours===1?'1 hour before':`${item.remindHours/24} day${item.remindHours===24?'':'s'} before`;}
function escapeCalendar(value){return String(value).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');}
function utcStamp(value){return new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');}
function foldLine(line){const parts=[];let part='';for(const char of line){if(new TextEncoder().encode(part+char).length>74){parts.push(part);part=' '+char;}else part+=char;}parts.push(part);return parts.join('\r\n');}
export function buildCalendar(items,now=new Date()){
  const events=items.filter(item=>!item.done&&item.due&&Number.isFinite(dueTimestamp(item))).map(item=>[
    'BEGIN:VEVENT',`UID:${escapeCalendar(item.id)}@dinostudy.local`,`DTSTAMP:${utcStamp(now)}`,
    ...(item.allDay?[`DTSTART;VALUE=DATE:${item.due.replaceAll('-','')}`,`DTEND;VALUE=DATE:${addDateDays(item.due,1).replaceAll('-','')}`]:[`DTSTART:${utcStamp(item.due)}`]),
    `SUMMARY:${escapeCalendar(`${COURSES[item.course].name}: ${item.title}`)}`,`DESCRIPTION:${escapeCalendar(`${item.details||''}${item.source?'\nSchoolbox: '+item.source:''}`)}`,
    ...(item.source?[`URL:${item.source}`]:[]),...(item.remindHours!==null&&Number.isFinite(reminderTimestamp(item))?['BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${escapeCalendar(item.title)}`,item.allDay?`TRIGGER;VALUE=DATE-TIME:${utcStamp(reminderTimestamp(item))}`:`TRIGGER:${item.remindHours===0?'PT0S':`-PT${item.remindHours}H`}`,'END:VALARM']:[]),'END:VEVENT'
  ]);
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Learnify//Homework//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH',...events.flat(),'END:VCALENDAR'].map(foldLine).join('\r\n')+'\r\n';
}
export function downloadCalendar(items){const blob=new Blob([buildCalendar(items)],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='aster-homework.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function localInputDate(value){return berlinInput(value);}
