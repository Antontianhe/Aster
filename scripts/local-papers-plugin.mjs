import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {localRequestAllowed} from './local-school-plugin.mjs';
const catalogue=new URL('../front-end/src/competitionPaperAvailability.json',import.meta.url),cache=new URL('../.work/paper-cache/',import.meta.url);
export default function localPapersPlugin(){
 const pending=new Map();
 async function readPaper(url){
  const file=new URL(createHash('sha256').update(url).digest('hex')+'.pdf',cache);
  try{return await fs.readFile(file);}catch{}
  const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(30000)});
  if(!response.ok||Number(response.headers.get('content-length'))>30_000_000)throw new Error('Paper unavailable');
  const data=Buffer.from(await response.arrayBuffer());if(data.length>30_000_000||data.subarray(0,5).toString()!=='%PDF-')throw new Error('Invalid PDF');
  await fs.mkdir(cache,{recursive:true});await fs.writeFile(file,data);return data;
 }
 function configure(server){server.middlewares.use(async(req,res,next)=>{
  const url=new URL(req.url,'http://localhost');if(url.pathname!=='/api/local-papers')return next();
  res.setHeader('Cache-Control','private, max-age=3600');res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'||!localRequestAllowed(req)){res.writeHead(403);res.end();return;}
  const source=url.searchParams.get('source'),allowed=JSON.parse(await fs.readFile(catalogue,'utf8'));
  if(!allowed.some(p=>p.url===source&&p.available)){res.writeHead(404);res.end();return;}
  try{if(!pending.has(source))pending.set(source,readPaper(source).finally(()=>pending.delete(source)));const data=await pending.get(source);res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Length',data.length);res.end(data);}catch{res.writeHead(502);res.end('The official paper is currently unavailable.');}
 });}
 return {name:'learnify-local-official-papers',configureServer:configure,configurePreviewServer:configure};
}
