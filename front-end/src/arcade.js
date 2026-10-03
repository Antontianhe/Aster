import {shuffled} from './study.js';
import {deckChoices} from './studySets.js';
export const ARCADE_KEY='aster-arcade-v1';
export const GAME_MODES=[
 {id:'recall',name:'Recall sprint',tag:'RETRIEVAL',description:'Five questions. Choose the saved answer and learn from the explanation.',icon:'Zap',color:'#a187fa'},
 {id:'memory',name:'Memory grid',tag:'CONNECTIONS',description:'Turn over cards to pair each question with its answer.',icon:'Grid2X2',color:'#69d9d2'},
 {id:'match',name:'Concept connect',tag:'MATCHING',description:'Drag or tap the answer that belongs with each prompt.',icon:'GitMerge',color:'#ecad76'},
 {id:'verify',name:'Fact check',tag:'PRECISION',description:'Decide whether a prompt and answer belong together in your deck.',icon:'ShieldCheck',color:'#e189cb'},
 {id:'words',name:'Word lab',tag:'VOCABULARY',description:'Unscramble an answer using the question as your clue.',icon:'SpellCheck',color:'#93b9ff'},
 {id:'order',name:'Number flow',tag:'MATHS CHALLENGE',description:'Arrange values from smallest to largest. Fractions, roots, and negatives.',icon:'ArrowDownWideNarrow',color:'#a2d68b'}
];
export function wordCards(deck){return deck.cards.filter(c=>c.answer.length<=44&&(c.answer.match(/\p{L}/gu)||[]).length>=3);}
export function uniqueAnswerCards(cards){const seen=new Set();return cards.filter(c=>{const answer=c.answer.toLocaleLowerCase();if(seen.has(answer))return false;seen.add(answer);return true;});}
export function normalizeAnswer(value){return value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim();}
export function scrambleAnswer(answer){return answer.split(/(\s+)/).map(word=>{const chars=Array.from(word);if(chars.length<2)return word;let changed=shuffled(chars).join('');if(changed===word)changed=chars.slice(1).concat(chars[0]).join('');return changed;}).join(' ');}
export function makeRecall(deck){return shuffled(deck.cards).slice(0,5).map(card=>({...card,choices:deckChoices(deck,card,shuffled)}));}
export function makeVerification(deck){return shuffled(deck.cards).slice(0,6).map((card,i)=>{const others=deck.cards.filter(c=>c.answer!==card.answer);const same=i%2===0||!others.length;return {card,answer:same?card.answer:shuffled(others)[0].answer,same};});}
export const NUMBER_ROUNDS=[
 [{label:'−3',value:-3},{label:'½',value:.5},{label:'0',value:0},{label:'√4',value:2}],
 [{label:'2³',value:8},{label:'−½',value:-.5},{label:'¾',value:.75},{label:'√9',value:3}],
 [{label:'−2²',value:-4},{label:'(−2)²',value:4},{label:'1.25',value:1.25},{label:'⅔',value:2/3}],
 [{label:'√49',value:7},{label:'3²',value:9},{label:'2⁴',value:16},{label:'∛27',value:3}]
];
export function isAscending(items){return items.every((item,i)=>i===0||items[i-1].value<item.value);}
export function normalizeArcade(value){if(!value||typeof value!=='object')return {};return Object.fromEntries(Object.entries(value).filter(([key,v])=>key.length<200&&v&&Number.isInteger(v.plays)&&v.plays>=0&&Number.isFinite(v.best)&&v.best>=0&&v.best<=100).map(([key,v])=>[key,{plays:Math.min(v.plays,100000),best:v.best}]));}
