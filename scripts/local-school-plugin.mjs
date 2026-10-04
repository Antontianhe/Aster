import fs from 'node:fs/promises';
import {parseSchoolCalendar,mergeSchoolEvents} from '../front-end/src/schoolSync.js';
const root=new URL('../.work/school-sync/',import.meta.url);
export function localRequestAllowed(req){
 const host=req.headers.host||'',address=req.socket.remoteAddress||'';
 if(!/^(localhost|127\.0\.0\.1):\d+$/.test(host)||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(address))return false;
 if(req.headers['sec-fetch-site']&&!['same-origin','none'].includes(req.headers['sec-fetch-site']))return false;
 if(req.headers.origin&&req.headers.origin!==`http://${host}`)return false;
 return true;
}
export default function localSchoolPlugin(){
 let refreshPromise,lastAttempt=0,calendarError='';
 async function refreshCalendar(force=false){
  if(refreshPromise)return refreshPromise;
  if(!force&&Date.now()-lastAttempt<15*60*1000)return;
  lastAttempt=Date.now();
  refreshPromise=(async()=>{try{
   const url=(await fs.readFile(new URL('calendar-feed.txt',root),'utf8')).trim(),u=new URL(url);
   if(u.protocol!=='https:'||u.hostname!=='lms.isr-school.com'||u.username||u.password)throw new Error('Invalid school calendar connection.');
   const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw new Error('The school calendar is unavailable.');
   const text=await response.text();if(text.length>4_000_000)throw new Error('Calendar exceeds the import limit.');
   const events=parseSchoolCalendar(text);if(events.some(e=>e.recurrenceUnsupported))throw new Error('This calendar needs its repeating events expanded by Schoolbox.');
   const tmp=new URL('calendar.ics.tmp',root);await fs.writeFile(tmp,text);await fs.rename(tmp,new URL('calendar.ics',root));
   await fs.writeFile(new URL('calendar-status.json',root),JSON.stringify({checkedAt:new Date().toISOString()}));calendarError='';
  }catch(e){calendarError=e.code==='ENOENT'?'No private calendar feed has been connected.':'Calendar refresh failed. Showing the last successful import.';}finally{refreshPromise=null;}})();return refreshPromise;
 }
 function configure(server){
  server.middlewares.use(async(req,res,next)=>{
   const url=new URL(req.url,'http://localhost');
   if(!url.pathname.startsWith('/api/local-school'))return next();
   res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');
   if(!localRequestAllowed(req)){res.writeHead(403);res.end();return;}
   if(!['GET','POST'].includes(req.method)){res.writeHead(405);res.end();return;}
   try{
    if(url.pathname.startsWith('/api/local-school/files/')){
     if(req.method!=='GET'){res.writeHead(405);res.end();return;}
     const id=url.pathname.split('/').pop(),manifest=JSON.parse(await fs.readFile(new URL('documents.json',root),'utf8')),doc=manifest.find(d=>d.id===id);
     if(!doc||!/^[a-z]+-\d+\.(pdf|png|docx|pptx)$/.test(doc.file)){res.writeHead(404);res.end();return;}
     const type=doc.file.endsWith('.pdf')?'application/pdf':doc.file.endsWith('.png')?'image/png':'application/octet-stream';
     res.setHeader('Content-Type',type);res.setHeader('Content-Disposition',`${type==='application/octet-stream'?'attachment':'inline'}; filename="${doc.file}"`);res.end(await fs.readFile(new URL('files/'+doc.file,root)));return;
    }
    if(url.pathname!=='/api/local-school'){res.writeHead(404);res.end();return;}
    if(req.headers['x-aster-client']!=='workspace'){res.writeHead(403);res.end();return;}
    if(req.method==='POST')await refreshCalendar(true);else void refreshCalendar();
    const snapshot=JSON.parse(await fs.readFile(new URL('snapshot.json',root),'utf8'));
    try{snapshot.events=mergeSchoolEvents(parseSchoolCalendar(await fs.readFile(new URL('calendar.ics',root),'utf8')),snapshot.portalEvents||[]);}catch{}
    snapshot.calendarCheckedAt=JSON.parse(await fs.readFile(new URL('calendar-status.json',root),'utf8').catch(()=>'{}')).checkedAt||null;
    snapshot.calendarError=calendarError;
    const sync=JSON.parse(await fs.readFile(new URL('sync-status.json',root),'utf8').catch(()=>'{}'));
    snapshot.sync=sync;
    res.setHeader('Content-Type','application/json');res.end(JSON.stringify(snapshot));
   }catch{res.writeHead(404,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'School data has not been imported on this computer.'}));}
  });
 }
 return {name:'aster-private-local-school',configureServer:configure,configurePreviewServer:configure};
}
