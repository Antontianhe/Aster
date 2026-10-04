import {CONCEPTS} from './questionConcepts.js';
import {APPLICATIONS} from './questionApplications.js';

const sourceLabel='Original Learnify practice';
function pack(subject, key, topic, level, q, answer, distractors, why, concept=key){
 const options=[answer,...distractors].map(String);
 return {id:`aster-${subject}-${key}`,concept:`${subject}-${concept}`,topic,level,q,options,a:0,why,sourceLabel};
}
function conceptBank(subject,text){
 const rows=text.trim().split('\n').map(line=>line.split('|'));
 return rows.flatMap(([topic,term,definition],i)=>{
  const candidates=rows.map((r,j)=>({r,j})).filter(v=>v.j!==i).sort((a,b)=>Number(b.r[0]===topic)-Number(a.r[0]===topic));
  const others=candidates.slice(0,3).map(v=>v.r);
  const identify=subject==='german'?`Welcher Begriff passt: „${definition}“?`:subject==='spanish'?`Which Spanish expression means “${definition}”?`:`Which concept means “${definition.toLowerCase()}”?`;
  const describe=subject==='german'?`Was bedeutet „${term}“?`:subject==='spanish'?`What does “${term}” mean?`:`Which description best explains ${term.toLowerCase()}?`;
  const why=subject==='spanish'?`The Spanish expression “${term}” means “${definition}”.`:`${term}: ${definition}.`;
  return [pack(subject,`concept-${i}-identify`,topic,'foundation',identify,term,others.map(r=>r[1]),why,`concept-${i}`),pack(subject,`concept-${i}-explain`,topic,'foundation',describe,definition,others.map(r=>r[2]),why,`concept-${i}`)];
 });
}
function appliedBank(subject,text){return text.trim().split('\n').map((line,i)=>{const[topic,q,answer,a,b,c,why]=line.split('|');return pack(subject,`apply-${i}`,topic,'applied',q,answer,[a,b,c],why)});}
function mathBank(){
 const questions=[];
 function numeric(key,topic,q,answer,why,wrong=[],level='applied'){
  const alternatives=[...new Set([...wrong,answer+1,answer-1,answer+2,answer-2,answer+10].filter(v=>Number.isFinite(v)&&v!==answer))].slice(0,3);
  questions.push(pack('maths',key,topic,level,q,answer,alternatives,why,key.split('-')[0]));
 }
 function expression(key,topic,q,answer,wrong,why){questions.push(pack('maths',key,topic,'applied',q,answer,wrong,why,key.split('-')[0]));}
 for(let n=2;n<=13;n++){
  numeric(`order-${n}`,'Number',`Calculate ${n} + 3 × ${n+2}.`,n+3*(n+2),`Multiply first: 3 × ${n+2} = ${3*(n+2)}. Then add ${n} to get ${n+3*(n+2)}.`,[(n+3)*(n+2)]);
  numeric(`brackets-${n}`,'Number',`Calculate (${n} + 4) × 3.`,(n+4)*3,`Evaluate the brackets first: ${n} + 4 = ${n+4}. Multiply by 3 to get ${(n+4)*3}.`,[n+12]);
  numeric(`negative-${n}`,'Number',`Calculate −${n} − ${n+3}.`,-2*n-3,`Subtracting ${n+3} moves further left on the number line: −${n} − ${n+3} = ${-2*n-3}.`,[3,2*n+3,-3]);
  numeric(`root-${n}`,'Powers & roots',`What is the principal square root of ${n*n}?`,n,`${n} × ${n} = ${n*n}. The principal square root is the non-negative root, ${n}.`,[-n,n*n,2*n],'foundation');
  numeric(`cube-${n}`,'Powers & roots',`What is the cube root of ${n*n*n}?`,n,`${n}³ = ${n} × ${n} × ${n} = ${n*n*n}, so the cube root is ${n}.`,[n*n,n*3,n*n*n],'foundation');
  expression(`indices-${n}`,'Powers & roots',`Simplify x^${n} × x^3.`,`x^${n+3}`,[`x^${n*3}`,`2x^${n+3}`,`x^${n-1}`],`For powers with the same base, add the exponents: ${n} + 3 = ${n+3}.`);
  expression(`divide-${n}`,'Powers & roots',`Simplify x^${n+5} ÷ x^${n}, where x ≠ 0.`,'x^5',[`x^${2*n+5}`,`x^${n+5}`,`x^${n}`=== 'x^5'?'x^0':`x^${n}`],`For division with the same nonzero base, subtract exponents: ${n+5} − ${n} = 5.`);
  expression(`power-${n}`,'Powers & roots',`Simplify (x^${n})^2.`,`x^${2*n}`,[`x^${n===2?n+3:n+2}`,`2x^${n}`,`x^${n}`],`A power raised to another power multiplies the exponents: ${n} × 2 = ${2*n}.`);
  expression(`fraction-${n}`,'Fractions & ratio',`Calculate 1/${n+3} + 2/${n+3}.`,`3/${n+3}`,[`3/${2*(n+3)}`,`2/${n+3}`,`1/${n+3}`],`With equal denominators, add numerators: (1 + 2)/${n+3} = 3/${n+3}.`);
  numeric(`percentage-${n}`,'Fractions & ratio',`Find 25% of ${n*20}.`,n*5,`25% is one quarter. ${n*20} ÷ 4 = ${n*5}.`,[n*4,n*10,n*15]);
  numeric(`ratio-${n}`,'Fractions & ratio',`Red and blue counters are in the ratio 2:3. There are ${n*2} red counters. How many blue counters are there?`,n*3,`Two ratio parts represent ${n*2}, so one part is ${n}. Three parts are ${n*3}.`,[n*2,n*5,n]);
  numeric(`equation-${n}`,'Algebra',`Solve 3x + ${n} = ${4*n}.`,n,`Subtract ${n} from both sides to get 3x = ${3*n}. Divide both sides by 3: x = ${n}.`,[3*n,4*n,n+3]);
  numeric(`bracketEquation-${n}`,'Algebra',`Solve 2(x − ${n}) = ${n*4}.`,n*3,`Divide by 2: x − ${n} = ${n*2}. Add ${n} to both sides: x = ${n*3}.`,[n,n*2,n*4]);
  expression(`expand-${n}`,'Algebra',`Expand ${n}(x + 3).`,`${n}x + ${3*n}`,[`${n}x + 3`,`x + ${3*n}`,`${n+3}x`],`Multiply each term in the bracket by ${n}: ${n} × x + ${n} × 3 = ${n}x + ${3*n}.`);
  expression(`collect-${n}`,'Algebra',`Simplify ${n}x + ${n+2}x.`,`${2*n+2}x`,[`${n*(n+2)}x`===`${2*n+2}x`?'x':`${n*(n+2)}x`,`${2*n+2}x²`,'2x'],`Add the coefficients of the like terms: ${n} + ${n+2} = ${2*n+2}. The variable remains x.`);
  numeric(`rectangle-${n}`,'Geometry',`A rectangle is ${n} cm long and ${n+3} cm wide. What is its area in cm²?`,n*(n+3),`Area = length × width = ${n} × ${n+3} = ${n*(n+3)} cm².`,[4*n+6,2*n+3]);
  numeric(`perimeter-${n}`,'Geometry',`A rectangle has sides ${n} cm and ${n+4} cm. What is its perimeter in cm?`,4*n+8,`Perimeter = 2(length + width) = 2(${n} + ${n+4}) = ${4*n+8} cm.`,[n*(n+4),2*n+4]);
  numeric(`triangle-${n}`,'Geometry',`A triangle has base ${2*n} cm and perpendicular height 5 cm. What is its area in cm²?`,5*n,`Triangle area = ½ × base × perpendicular height = ½ × ${2*n} × 5 = ${5*n} cm².`,[10*n,2*n+5]);
  numeric(`angle-${n}`,'Geometry',`Two angles in a triangle are ${n*3}° and 60°. What is the third angle in degrees?`,120-3*n,`Angles in a triangle total 180°. The missing angle is 180 − ${n*3} − 60 = ${120-3*n}°.`,[180-3*n,60+3*n]);
  expression(`probability-${n}`,'Statistics & probability',`A bag has ${n} red counters and 3 blue counters. One counter is chosen at random. What is the probability it is red?`,`${n}/${n+3}`,[`1/${n+3}`,`${n+1}/${n+3}`,`0/${n+3}`],`There are ${n+3} equally likely counters, of which ${n} are red. Probability = favourable outcomes ÷ total outcomes = ${n}/${n+3}.`);
  numeric(`mean-${n}`,'Statistics & probability',`Find the mean of ${n}, ${n+2}, and ${n+4}.`,n+2,`Add the values and divide by three: (${n} + ${n+2} + ${n+4})/3 = ${3*n+6}/3 = ${n+2}.`,[3*n+6,n+4,n]);
  numeric(`gradient-${n}`,'Graphs',`A line passes through (0, 2) and (${n}, ${3*n+2}). What is its gradient?`,3,`Gradient = change in y ÷ change in x = (${3*n+2} − 2)/(${n} − 0) = ${3*n}/${n} = 3.`,[n,3*n,2]);
 }
 return questions;
}
export const EXTRA_QUESTIONS = Object.fromEntries(Object.keys(CONCEPTS).map(subject=>[subject,[...conceptBank(subject,CONCEPTS[subject]),...appliedBank(subject,APPLICATIONS[subject])]]));
EXTRA_QUESTIONS.maths=mathBank();

function shuffle(list,random){const out=[...list];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out;}
export function selectPractice(bank,{limit=10,topic='all',level='all',mode='fresh',attempts=[]}={},random=Math.random){
 const latest=new Map();for(const a of attempts)if(a&&typeof a.question==='string')latest.set(a.question,a);
 const eligible=bank.filter(q=>(topic==='all'||q.topic===topic)&&(level==='all'||q.level===level)&&(mode!=='mistakes'||latest.get(q.q)?.correct===false));
 const count=Math.min(eligible.length,Math.max(1,Math.min(30,Number(limit)||10)));
 const rank=q=>{const attempt=latest.get(q.q);return !attempt?0:!attempt.correct?1:2;};
 const ordered=shuffle(eligible,random);
 // Prefer a spread of concepts over reversed versions of the same recall prompt.
 const result=[],used=new Set();
 for(const priority of mode==='mixed'?[null]:[0,1,2]){const chosen=[],deferred=[];
  for(const q of ordered.filter(q=>priority===null||rank(q)===priority)){const concept=q.concept||q.id||q.q;if(used.has(concept))deferred.push(q);else{chosen.push(q);used.add(concept)}}
  result.push(...[...chosen,...deferred].slice(0,count-result.length));if(result.length===count)break;
 }
 return result;
}
export function practiceCoverage(bank,attempts=[]){const latest=new Map(attempts.map(a=>[a.question,a]));return{total:bank.length,seen:bank.filter(q=>latest.has(q.q)).length,missed:bank.filter(q=>latest.get(q.q)?.correct===false).length};}
