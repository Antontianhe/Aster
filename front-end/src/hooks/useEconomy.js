import {useCallback,useRef} from 'react';
import {coinBalance,purchase,rewardExams,normalizeEconomy,adoptBuddy} from '../economy.js';
import {dayKey} from '../study.js';
export function useEconomy(progress,prefs,setPrefs){
 const latest=useRef({progress,prefs});latest.current={progress,prefs};
 const transact=useCallback((type,id)=>{const current=latest.current;const result=type==='adopt'?adoptBuddy(current.prefs,id):purchase(current.prefs,current.progress,type,id);if(!result.error){latest.current={...current,prefs:result.prefs};setPrefs(result.prefs);}return result;},[setPrefs]);
 const rewardGrades=useCallback(grades=>{const current=latest.current,next=rewardExams(current.prefs,grades,dayKey());const awarded=next.economy.gradeRewards.length-normalizeEconomy(current.prefs.economy).gradeRewards.length;if(awarded){latest.current={...current,prefs:next};setPrefs(next);}return awarded;},[setPrefs]);
 return{coins:coinBalance(progress,prefs),transact,rewardGrades};
}
