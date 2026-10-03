import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BUILTIN_DECKS,SAMPLE_SET,validateStudySet,safeSource,deckChoices} from './studySets.js';
import {shuffled} from './study.js';
import {parseNews,parseWeather} from './liveData.js';
import {normalizeAnswer,makeVerification,NUMBER_ROUNDS,isAscending,uniqueAnswerCards,normalizeArcade} from './arcade.js';
import {BOOKS,normalizeReading,paginateBook} from './books.js';
import {normalizeRoadmap,ROADMAP_IDS} from './roadmap.js';

test('imported decks require complete, distinct prompts and enough answer pairs',()=>{
 const deck=validateStudySet(SAMPLE_SET);assert.equal(deck.cards.length,4);assert.equal(deck.subject,'computing');
 assert.throws(()=>validateStudySet({...SAMPLE_SET,cards:[SAMPLE_SET.cards[0]]}),/4 and 200/);
 assert.throws(()=>validateStudySet({...SAMPLE_SET,subject:'unknown'}),/subject/);
 assert.throws(()=>validateStudySet({...SAMPLE_SET,cards:[...SAMPLE_SET.cards.slice(0,3),SAMPLE_SET.cards[0]]}),/different question/);
 assert.throws(()=>validateStudySet({...SAMPLE_SET,cards:SAMPLE_SET.cards.map(c=>({...c,answer:'same'}))}),/four different/);
 assert.equal(safeSource('javascript:alert(1)'),'');assert.equal(safeSource('https://user:password@example.com'), '');
 assert.equal(validateStudySet({...SAMPLE_SET,source:'javascript:alert(1)'}).source,'');
});
test('every built-in and imported game deck keeps one correct choice and distinguishable pairs',()=>{
 for(const deck of [...BUILTIN_DECKS,validateStudySet(SAMPLE_SET)]){
  assert.ok(uniqueAnswerCards(deck.cards).length>=4);
  for(const card of deck.cards){const choices=deckChoices(deck,card,shuffled);assert.equal(choices.filter(c=>c.correct).length,1);assert.equal(choices.find(c=>c.correct).text,card.answer);assert.equal(new Set(choices.map(c=>c.text)).size,choices.length);}
  for(const round of makeVerification(deck))assert.equal(round.answer===round.card.answer,round.same);
 }
 assert.equal(normalizeAnswer('  HÉLLO   World  '),'héllo world');
 assert.deepEqual(uniqueAnswerCards([{answer:'Router'},{answer:'router'},{answer:'Switch'}]).map(c=>c.answer),['Router','Switch']);
});
test('number puzzles distinguish roots, signs, powers and fractions',()=>{
 for(const round of NUMBER_ROUNDS){assert.equal(round.length,4);assert.equal(new Set(round.map(c=>c.value)).size,4);assert.equal(isAscending([...round].sort((a,b)=>a.value-b.value)),true);assert.equal(isAscending([...round].sort((a,b)=>b.value-a.value)),false);}
 const signs=NUMBER_ROUNDS.flat();assert.equal(signs.find(c=>c.label==='−2²').value,-4);assert.equal(signs.find(c=>c.label==='(−2)²').value,4);
});
test('news rejects stale, future and off-source links instead of showing them as current',()=>{
 const now=Date.parse('2026-09-20T12:00:00Z');const item={title:'A current headline',description:'Short source summary',link:'https://www.bbc.co.uk/news/articles/example',pubDate:'2026-09-20 11:00:00'};
 const parsed=parseNews({status:'ok',items:[item,{...item,pubDate:'2026-08-10 10:00:00'},{...item,pubDate:'2026-09-21 10:00:00'},{...item,link:'https://bbc.co.uk.example.com/story'},{...item,link:'javascript:alert(1)'},{...item,pubDate:'invalid'}]},now);
 assert.equal(parsed.length,1);assert.equal(parsed[0].publishedAt,Date.parse('2026-09-20T11:00:00Z'));assert.throws(()=>parseNews({status:'error'}),/unavailable/);
});
test('weather verifies current data, required forecast fields and local time offsets',()=>{
 const now=Date.parse('2026-09-20T12:00:00Z');const data={utc_offset_seconds:7200,timezone:'Europe/Berlin',current:{time:'2026-09-20T14:00',temperature_2m:19,apparent_temperature:18,weather_code:2,wind_speed_10m:12},daily:{time:['2026-09-20','2026-09-21','2026-09-22','2026-09-23','2026-09-24'],weather_code:[2,2,3,3,0],temperature_2m_max:[20,21,19,20,22],temperature_2m_min:[12,12,11,11,12],precipitation_probability_max:[20,10,30,10,0]}};
 assert.equal(parseWeather(data,now).measured,now);assert.throws(()=>parseWeather(data,now+86400000*3),/current forecast/);assert.throws(()=>parseWeather({...data,daily:{time:['2026-09-20']}},now),/current forecast/);
});
test('every visible library title is a complete local edition with HTTPS source credits',()=>{
 assert.ok(BOOKS.length>=200);assert.equal(new Set(BOOKS.map(b=>b.id)).size,BOOKS.length);assert.ok(BOOKS.every(b=>b.local && b.access!=='publisher'));assert.equal(BOOKS.some(b=>b.id==='herz-boxers'||b.id==='dorfteich'),false);
 for(const book of BOOKS){assert.ok(book.source.startsWith('https://'));assert.ok(book.url.startsWith('https://'));if(book.local){assert.equal(book.access,'public-domain');const raw=readFileSync(new URL('../public'+book.local,import.meta.url),'utf8');const pages=paginateBook(raw);assert.ok(pages.length>0);assert.ok(pages.every(p=>p.length));const start=raw.indexOf('*** START OF THE PROJECT GUTENBERG EBOOK'),end=raw.indexOf('*** END OF THE PROJECT GUTENBERG EBOOK');const body=raw.slice(raw.indexOf('\n',start)+1,end).replace(/\s+/g,' ').trim();assert.equal(pages.flat().join(' ').replace(/\s+/g,' ').trim(),body);}}
 assert.throws(()=>paginateBook('not a verified book'),/verified/);
});
test('saved reading, roadmap and arcade data reject invalid state without losing valid entries',()=>{
 const reading=normalizeReading({carol:{saved:true,progress:150,page:-3,status:'reading',notes:'A note'},fake:{progress:15}});assert.equal(reading.carol.progress,100);assert.equal(reading.carol.page,0);assert.equal(reading.fake,undefined);
 assert.deepEqual(normalizeRoadmap(['g8-plan','unknown','g8-plan']),['g8-plan']);assert.equal(ROADMAP_IDS.size,12);
 const games=normalizeArcade({good:{plays:2,best:80},invalid:{plays:-1,best:120}});assert.deepEqual(games,{good:{plays:2,best:80}});
});
