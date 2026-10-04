export function makeFact(tables,mode='mixed',random=Math.random){
  const allowed=tables.filter(n=>Number.isInteger(n)&&n>=2&&n<=12);
  if(!allowed.length)throw new Error('Choose at least one times table.');
  const a=allowed[Math.min(allowed.length-1,Math.floor(random()*allowed.length))],b=1+Math.min(11,Math.floor(random()*12));
  const division=mode==='divide'||mode==='mixed'&&random()<.5;
  return division?{prompt:`${a*b} ÷ ${a}`,answer:b,working:`${a} × ${b} = ${a*b}`}:{prompt:`${a} × ${b}`,answer:a*b,working:`${a} × ${b} = ${a*b}`};
}
export function markFact(question,input){const value=String(input).trim();return /^\d{1,3}$/.test(value)&&Number(value)===question.answer;}
export function summariseFacts(answers){const correct=answers.filter(a=>a.correct).length;return{correct,total:answers.length,accuracy:answers.length?Math.round(correct/answers.length*100):0,mistakes:answers.filter(a=>!a.correct)};}
