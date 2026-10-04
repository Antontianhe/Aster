import fs from 'node:fs/promises';
import {PAPER_COLLECTIONS} from '../front-end/src/learningCatalog.js';
const links=[...new Set(PAPER_COLLECTIONS.filter(p=>p.programme==='Competition').flatMap(p=>p.links.filter(l=>/\.pdf(?:\?|$)/i.test(l.url)).map(l=>l.url)))];
const results=[];let index=0;
async function worker(){while(index<links.length){const url=links[index++];try{const r=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(15000)});results.push({url,available:r.ok&&/pdf/i.test(r.headers.get('content-type')||''),status:r.status,frame:r.headers.get('x-frame-options')||'',checkedAt:new Date().toISOString()});}catch{results.push({url,available:false,status:0,checkedAt:new Date().toISOString()});}}}
await Promise.all(Array.from({length:4},worker));
await fs.writeFile(new URL('../front-end/src/competitionPaperAvailability.json',import.meta.url),JSON.stringify(results,null,2));
console.log(JSON.stringify({checked:results.length,available:results.filter(r=>r.available).length,unavailable:results.filter(r=>!r.available).map(r=>({url:r.url,status:r.status})),blockedFrames:results.filter(r=>r.frame)}));
