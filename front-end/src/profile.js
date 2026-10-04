export function profileAge(birthday,today){
  if(typeof birthday!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(birthday)||birthday>today)return null;
  const date=new Date(birthday+'T12:00:00Z');
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==birthday)return null;
  return Number(today.slice(0,4))-Number(birthday.slice(0,4))-(today.slice(5)<birthday.slice(5)?1:0);
}
export function normalizeProfile(value){const p=value&&typeof value==='object'?value:{};const result={};for(const key of ['fullName','email','phone','school','grade','className','dateOfBirth'])result[key]=typeof p[key]==='string'?p[key].trim().slice(0,key==='email'?254:100):'';return result;}
