import { normalizeCharacter } from './character.js';
export const CLAW_PRIZES = [
  { id:'double',name:'Double learning coins',detail:'Review and maths coins are doubled until midnight in Europe/Berlin.' },
  { id:'starlight',name:'Starlight skin',detail:'A constellation effect for your avatar. Yours to keep.' },
  { id:'headphones',name:'Studio headphones',detail:'A new accessory for your avatar. Yours to keep.' },
  { id:'crown',name:'Crystal crown',detail:'A new accessory for your avatar. Yours to keep.' },
];
export function activityRewards(prefs){return Array.isArray(prefs.activityRewards)?prefs.activityRewards.filter(r=>r&&typeof r.id==='string'&&['math','debate'].includes(r.kind)&&Number.isInteger(r.coins)&&r.coins>=0&&r.coins<=(r.kind==='debate'?10:20)).slice(-5000):[];}
export function activityCoins(prefs){return activityRewards(prefs).reduce((sum,r)=>sum+r.coins,0);}
export function learningMultiplier(prefs,day){return prefs.claw?.boostDay===day?2:1;}
export function awardActivity(prefs,request,day){
  if(!request||typeof request.id!=='string'||!['math','debate'].includes(request.kind))return{error:'Invalid activity.'};
  const rewards=activityRewards(prefs);
  if(rewards.some(r=>r.id===request.id))return{error:'This activity has already been rewarded.'};
  if(rewards.length>=5000)return{error:'Your activity reward log is full.'};
  let coins;
  if(request.kind==='debate'){
    const scores=request.scores;
    if(!scores||!['reasoning','evidence','rebuttal','clarity'].every(key=>Number.isInteger(scores[key])&&scores[key]>=0&&scores[key]<=5))return{error:'A complete AI evaluation is needed first.'};
    coins=Math.floor(['reasoning','evidence','rebuttal','clarity'].map(key=>scores[key]).reduce((n,v)=>n+v,0)/2);
    coins=Math.min(10,Math.max(0,coins));
  }else{if(!Number.isInteger(request.correct)||request.correct<0)return{error:'Invalid maths result.'};coins=Math.min(10,request.correct)*learningMultiplier(prefs,day);}
  return{prefs:{...prefs,activityRewards:[...rewards,{id:request.id,kind:request.kind,coins,day}]},coins};
}
export function claimClaw(prefs,day,pick){
  if(prefs.claw?.day===day)return{error:'You already played today. Come back tomorrow.'};
  if(!Number.isInteger(pick)||pick<0||pick>=CLAW_PRIZES.length)return{error:'Invalid prize.'};
  let prize=CLAW_PRIZES[pick];const character=normalizeCharacter(prefs.character);
  if(prize.id!=='double'&&character.owned.includes(prize.id))prize=CLAW_PRIZES[0];
  const next={...prefs,claw:{...prefs.claw,day,prize:prize.id}};
  if(prize.id==='double')next.claw.boostDay=day;
  else next.character={...character,owned:[...character.owned,prize.id]};
  return{prefs:next,prize};
}
