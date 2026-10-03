export const TIERS = Object.freeze([
  {name:'Ignite', at:0, color:'#67e8f9'},
  {name:'Momentum', at:100, color:'#c4a7ff'},
  {name:'Flow', at:250, color:'#ffb16c'},
  {name:'Ascend', at:500, color:'#70f4b8'},
  {name:'Apex', at:1000, color:'#ff8ecf'},
]);
export function tierFor(xp){return [...TIERS].reverse().find(t=>xp>=t.at)||TIERS[0];}
export function tierProgress(xp){
  const current=tierFor(xp),index=TIERS.indexOf(current),next=TIERS[index+1];
  return {current,next,percent:next?Math.max(0,Math.min(100,(xp-current.at)/(next.at-current.at)*100)):100,remaining:next?Math.max(0,next.at-xp):0};
}
export function lessonUnlocked(completed,index){return index===0||completed.includes(index-1)||completed.includes(index);}
export function completePathStage(progress,subject,stage){
  if(!Number.isInteger(stage)||stage<0||stage>4)return progress;
  const previous=progress.paths?.[subject]||[];
  if(previous.includes(stage)||!lessonUnlocked(previous,stage))return progress;
  return {...progress,paths:{...progress.paths,[subject]:[...previous,stage].sort()}};
}
export function progressReducer(state,action){
  switch(action.type){
    case 'update':return typeof action.update==='function'?action.update(state):action.update;
    case 'complete-stage':return completePathStage(state,action.subject,action.stage);
    default:return state;
  }
}
