import {storage} from './storage.js';
import {COURSES,SUBJECT_ORDER} from './study.js';

export const STUDY_SETS_KEY='aster-study-sets-v1';
export function safeSource(value){try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';}catch{return '';}}
function text(value,max){return typeof value==='string'?value.trim().slice(0,max):'';}
export function validateStudySet(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Choose a JSON study set with a title, subject, and cards.');
  const title=text(input.title,100),subject=COURSES[input.subject]?input.subject:null;
  if(!title||!subject)throw new Error('Give the set a title and a subject ID such as maths, science, english, or music.');
  if(!Array.isArray(input.cards)||input.cards.length<4||input.cards.length>200)throw new Error('A study set needs between 4 and 200 question-and-answer cards.');
  const source=safeSource(input.source);
  const cards=input.cards.map((card,i)=>{
    const question=text(card?.question,400),answer=text(card?.answer,500);
    if(!question||!answer)throw new Error(`Card ${i+1} needs a question and an answer.`);
    return {id:`card-${i}`,question,answer,explanation:text(card.explanation,800),source:safeSource(card.source)||source};
  });
  if(new Set(cards.map(c=>c.question.toLowerCase())).size!==cards.length)throw new Error('Each card needs a different question.');
  if(new Set(cards.map(c=>c.answer.toLowerCase())).size<4)throw new Error('Include at least four different answers so the matching games can form distinct pairs.');
  return {id:typeof input.id==='string'&&/^set-[a-zA-Z0-9-]+$/.test(input.id)?input.id:`set-${crypto.randomUUID()}`,title,subject,source,cards,custom:true};
}
export function loadStudySets(){try{const value=JSON.parse(storage.getItem(STUDY_SETS_KEY));return Array.isArray(value)?value.slice(0,30).flatMap(v=>{try{return [validateStudySet(v)];}catch{return [];}}):[];}catch{return [];}}
export const BUILTIN_DECKS=SUBJECT_ORDER.filter(id=>COURSES[id].questions.length).map(id=>({id:`course-${id}`,subject:id,title:COURSES[id].title,source:COURSES[id].unitSource||COURSES[id].source,custom:false,cards:COURSES[id].questions.map((q,i)=>({id:`${id}-${i}`,question:q.q,answer:q.options[q.a],explanation:q.why,source:q.source||'',choices:q.options.map((text,index)=>({text,correct:index===q.a}))}))}));
export function courseDeck(subject){return BUILTIN_DECKS.find(d=>d.subject===subject);}
export function deckChoices(deck,card,shuffle){
  if(card.choices)return shuffle(card.choices);
  // Imported prompts can have several valid answers. Users verify a deck before importing;
  // other card answers are only used where there are at least four distinct answers.
  const distractors=[...new Set(deck.cards.filter(c=>c.answer!==card.answer).map(c=>c.answer))];
  return shuffle([{text:card.answer,correct:true},...shuffle(distractors).slice(0,3).map(text=>({text,correct:false}))]);
}
export const SAMPLE_SET={title:'Network foundations',subject:'computing',source:'https://lms.isr-school.com/homepage/707',cards:[{question:'Which device forwards data between networks?',answer:'Router',explanation:'A router connects networks and forwards their data.'},{question:'What does LAN stand for?',answer:'Local Area Network'},{question:'What does WAN stand for?',answer:'Wide Area Network'},{question:'Which device connects wired devices within a LAN?',answer:'Switch'}]};
