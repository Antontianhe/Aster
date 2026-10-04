import {normalizeBuddy,buyForBuddy,BUDDIES} from './buddies.js';
import {normalizeCharacter,buyCharacterExtra} from './character.js';
import {activityCoins,awardActivity,claimClaw} from './activityRewards.js';
import {dayKey} from './study.js';
export const EXAM_BONUS=50;
export const GAME_TICKET=4;
const count=n=>Number.isFinite(n)?Math.max(0,Math.min(1e9,Math.floor(n))):0;
export function normalizeEconomy(value={}){return{gameSpent:count(value?.gameSpent),tickets:count(value?.tickets),gradeRewards:Array.isArray(value?.gradeRewards)?[...new Set(value.gradeRewards.filter(x=>typeof x==='string'&&x.length<500))].slice(0,5000):[]};}
export function coinBalance(progress,prefs){const e=normalizeEconomy(prefs.economy);return Math.max(0,count(progress.gems)+e.gradeRewards.length*EXAM_BONUS+activityCoins(prefs)-normalizeBuddy(prefs.buddy).spent-normalizeCharacter(prefs.character).spent-e.gameSpent);}
export function examRewardKey(g){return JSON.stringify([g.date,g.subject.trim().toLowerCase(),g.title.trim().toLowerCase()]);}
export function rewardExams(prefs,grades,today){const economy=normalizeEconomy(prefs.economy),known=new Set(economy.gradeRewards);for(const g of grades){if(g.kind==='exam'&&g.scale==='percent'&&g.date<=today&&Number.isFinite(g.score)&&Number.isFinite(g.max)&&g.max>0&&g.score<=g.max&&g.score/g.max>.9)known.add(examRewardKey(g));}return{...prefs,economy:{...economy,gradeRewards:[...known].slice(0,5000)}};}
export function purchase(prefs,progress,type,itemId){
 const economy=normalizeEconomy(prefs.economy),buddy=normalizeBuddy(prefs.buddy);
 if(type==='activity')return awardActivity(prefs,itemId,dayKey());
 if(type==='claw')return claimClaw(prefs,dayKey(),itemId);
 if(type==='character'){const result=buyCharacterExtra(prefs.character,itemId,coinBalance(progress,prefs));return result.error?{error:result.error}:{prefs:{...prefs,character:result.character},item:result.item};}
 if(type==='game'){if(coinBalance(progress,prefs)<GAME_TICKET)return{error:'Earn 4 coins in a review to open a play session.'};return{prefs:{...prefs,economy:{...economy,gameSpent:economy.gameSpent+GAME_TICKET,tickets:economy.tickets+1}}};}
 if(!buddy.adopted)return{error:'Choose your one buddy before visiting the shop.'};
 const result=buyForBuddy(buddy,itemId,coinBalance(progress,prefs)+buddy.spent);return result.error?{error:result.error}:{prefs:{...prefs,buddy:result.buddy},item:result.item};
}
export function adoptBuddy(prefs,id){const previous=normalizeBuddy(prefs.buddy),chosen=BUDDIES.find(b=>b.id===id);if(previous.adopted||!chosen)return{error:'Your companion is already chosen.'};return{prefs:{...prefs,buddy:{...previous,id:chosen.id,name:chosen.name,color:chosen.color,adopted:true}}};}
