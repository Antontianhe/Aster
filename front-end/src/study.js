import {storage as accountStorage} from './storage.js';
import { COURSES as BASE_COURSES } from './schoolData.js';
import { ART_CONTENT, SUBJECT_META } from './schoolExtras.js';
import { EXTRA_QUESTIONS,selectPractice } from './questionBank.js';

const CLASS_COURSES={...BASE_COURSES,art:{...BASE_COURSES.art,...ART_CONTENT}};
export const COURSES=Object.fromEntries(Object.entries(CLASS_COURSES).map(([id,course])=>[id,{...course,questions:[...course.questions.map((q,i)=>({...q,id:`class-${id}-${i}`,topic:'Classroom review',level:'foundation',sourceLabel:'Learnify classroom review',source:course.unitSource||course.source})),...(EXTRA_QUESTIONS[id]||[]).filter(q=>!course.questions.some(original=>original.q===q.q))]}]));
export { SUBJECT_META };
export const SUBJECT_ORDER = ['maths','science','english','music','computing','german','spanish','social','art','drama','pe','advising','homeroom'];
export const PROGRESS_KEY='dinostudy-progress-v2';
export const PREFS_KEY='dinostudy-preferences-v3';
export const SESSIONS_KEY='dinostudy-sessions-v3';
export const BOOKMARKS_KEY='dinostudy-bookmarks-v3';
export const DAY_ZONE='Europe/Berlin';
export const DEFAULT_PREFS={name:'Anton',theme:'light',sound:false,reduceMotion:false,dailyGoal:25,pinned:['maths','science','english','music'],weeklyGoal:5};
export const EMPTY_PROGRESS={xp:0,gems:0,streak:0,completed:{},sessions:0,todayXP:0,todaySessions:0,accuracyQuest:false,activityDate:'',lastStudy:'',studyDays:[],claimed:{},course:'music',bestScores:{},attempts:{},reviewedTopics:{},focusMinutes:0,paths:{}};
export function dayKey(date=new Date()) { return new Intl.DateTimeFormat('en-CA',{timeZone:DAY_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(date); }
export function localDayDate(key) { return new Date(`${key}T12:00:00`); }
export function shiftDay(key,offset) { const date=localDayDate(key);date.setDate(date.getDate()+offset);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function readStored(key,fallback,storage=accountStorage) { try { const value=JSON.parse(storage.getItem(key));return value===null?fallback:value; }catch{return fallback;} }
export function normalizeProgress(input) {
  const p={...EMPTY_PROGRESS};if(!input||typeof input!=='object'||Array.isArray(input))return p;
  for(const key of ['xp','gems','streak','sessions','todayXP','todaySessions','focusMinutes'])p[key]=Number.isFinite(input[key])&&input[key]>=0?Math.floor(input[key]):0;
  for(const key of ['activityDate','lastStudy'])p[key]=typeof input[key]==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(input[key])?input[key]:'';
  p.studyDays=Array.isArray(input.studyDays)?[...new Set(input.studyDays.filter(d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)))].sort().slice(-366):[];
  for(const key of ['completed','bestScores','attempts'])p[key]=Object.fromEntries(Object.entries(input[key]||{}).filter(([id,val])=>COURSES[id]&&Number.isFinite(val)&&val>=0).map(([id,val])=>[id,Math.min(key==='bestScores'?100:key==='completed'?5:100000,val)]));
  p.paths=Object.fromEntries(Object.entries(input.paths&&typeof input.paths==='object'?input.paths:{}).filter(([id,stages])=>COURSES[id]&&Array.isArray(stages)).map(([id,stages])=>[id,[...new Set(stages.filter(v=>Number.isInteger(v)&&v>=0&&v<5))].sort()]));
  p.course=COURSES[input.course]?input.course:'music';p.accuracyQuest=Boolean(input.accuracyQuest);return p;
}
export function loadProgress(storage=accountStorage){const saved=readStored(PROGRESS_KEY,null,storage);if(saved)return normalizeProgress(saved);const old=readStored('duo-review-v1',null,storage);return normalizeProgress(old);}
export function activeStreak(progress,now=new Date()){const today=dayKey(now);return progress.lastStudy===today||progress.lastStudy===shiftDay(today,-1)?progress.streak:0;}
export function finishReview(progress,courseId,score,total,now=new Date()){
  const today=dayKey(now),accuracy=Math.round(score/total*100),earned=score*5;
  return {...progress,xp:progress.xp+earned,gems:progress.gems+Math.max(0,score)*2,sessions:progress.sessions+1,todayXP:(progress.activityDate===today?progress.todayXP:0)+earned,todaySessions:(progress.activityDate===today?progress.todaySessions:0)+1,accuracyQuest:(progress.activityDate===today&&progress.accuracyQuest)||accuracy>=80,activityDate:today,lastStudy:today,streak:progress.lastStudy===today?progress.streak:progress.lastStudy===shiftDay(today,-1)?progress.streak+1:1,studyDays:[...new Set([...progress.studyDays,today])].sort().slice(-366),completed:{...progress.completed,[courseId]:Math.min(5,(progress.completed[courseId]||0)+(accuracy>=60?1:0))},bestScores:{...progress.bestScores,[courseId]:Math.max(progress.bestScores[courseId]||0,accuracy)},attempts:{...progress.attempts,[courseId]:(progress.attempts[courseId]||0)+1}};
}
export function shuffled(items,random=Math.random){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
export function makeQuiz(courseId,options){const bank=COURSES[courseId]?.questions||[];const questions=options?.selectedQuestion?bank.filter(q=>q.q===options.selectedQuestion):Array.isArray(options?.selectedQuestions)?options.selectedQuestions.slice(0,30).filter((id,i,ids)=>ids.indexOf(id)===i).map(id=>bank.find(q=>q.id===id)).filter(Boolean):selectPractice(bank,options);return questions.map(q=>({...q,choices:shuffled(q.options.map((text,i)=>({text,correct:i===q.a})))}));}
export function resourceId(subject,resource){return `${subject}:${resource.title}:${resource.url}`;}
export const RESOURCES=Object.entries(COURSES).flatMap(([subject,course])=>course.resources.map(r=>({...r,subject,id:resourceId(subject,r)})));
export function groupDayTasks(tasks){return tasks.reduce((groups,t)=>{if(!t.due)return groups;const key=t.allDay?t.due.slice(0,10):dayKey(new Date(t.due));(groups[key]??=[]).push(t);return groups;},{});}
export function calendarDays(year,month){const first=new Date(year,month,1,12);const offset=(first.getDay()+6)%7;const days=[];for(let i=0;i<42;i++){const date=new Date(year,month,1-offset+i,12);days.push({date,key:`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`,inMonth:date.getMonth()===month});}return days;}
export function minutesLabel(minutes){return minutes<60?`${minutes} min`:`${Math.floor(minutes/60)}h${minutes%60?` ${minutes%60}m`:''}`;}
