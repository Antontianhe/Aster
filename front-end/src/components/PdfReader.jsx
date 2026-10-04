import React,{useEffect,useRef,useState} from 'react';
import {getDocument,GlobalWorkerOptions} from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import s from './PdfReader.module.css';
GlobalWorkerOptions.workerSrc=workerUrl;

function PdfPage({document:pdf,page,width,zoom,title}){
 const canvas=useRef(),[error,setError]=useState(''),[text,setText]=useState(''),[ready,setReady]=useState(false);
 useEffect(()=>{let active=true,render;
  (async()=>{try{const sheet=await pdf.getPage(page);if(!active)return;const base=sheet.getViewport({scale:1}),viewport=sheet.getViewport({scale:width/base.width*zoom}),ratio=Math.min(2,window.devicePixelRatio||1),target=canvas.current;
   target.width=Math.floor(viewport.width*ratio);target.height=Math.floor(viewport.height*ratio);target.style.width=viewport.width+'px';target.style.height=viewport.height+'px';
   render=sheet.render({canvasContext:target.getContext('2d'),viewport,transform:[ratio,0,0,ratio,0,0]});await render.promise;if(!active)return;setReady(true);
   const content=await sheet.getTextContent();if(active)setText(content.items.map(item=>item.str+(item.hasEOL?'\n':' ')).join(''));
  }catch(e){if(active&&e.name!=='RenderingCancelledException')setError('This page could not be displayed. Try another page or open the original PDF.');}})();
  return()=>{active=false;render?.cancel();};
 },[pdf,page,width,zoom]);
 return <>{!ready&&!error&&<p role="status">Rendering page {page}…</p>}{error&&<p role="alert">{error}</p>}<div className={s.paperScroll}><canvas ref={canvas} role="img" aria-label={title+' · page '+page} style={{visibility:ready?'visible':'hidden'}}/></div>{text&&<details className={s.pageText}><summary>Read or copy this page’s text</summary><pre>{text}</pre></details>}</>;
}
export default function PdfReader({src,title}){
 const [pdf,setPdf]=useState(null),[page,setPage]=useState(1),[zoom,setZoom]=useState(1),[width,setWidth]=useState(680),[error,setError]=useState(''),container=useRef();
 useEffect(()=>{const observer=new ResizeObserver(([entry])=>setWidth(Math.max(220,Math.min(1000,Math.floor(entry.contentRect.width)-24))));observer.observe(container.current);return()=>observer.disconnect();},[]);
 useEffect(()=>{let active=true;setPdf(null);setError('');setPage(1);const task=getDocument({url:src,httpHeaders:{'X-Aster-Client':'workspace'},isEvalSupported:false});task.promise.then(doc=>{if(active)setPdf(doc);}).catch(()=>{if(active)setError('The PDF could not load. Check the connection or open the original document below.');});return()=>{active=false;void task.destroy();};},[src]);
 return <section className={s.reader} ref={container} aria-label={title+' reader'}>{error?<p className={s.message} role="alert">{error}</p>:!pdf?<p className={s.message} role="status">Loading the full PDF…</p>:<><div className={s.toolbar}><button aria-label="Previous PDF page" disabled={page===1} onClick={()=>setPage(n=>n-1)}><ChevronLeft size={18}/></button><label>Page <select aria-label="PDF page" value={page} onChange={e=>setPage(Number(e.target.value))}>{Array.from({length:pdf.numPages},(_,i)=><option key={i} value={i+1}>{i+1}</option>)}</select> of {pdf.numPages}</label><button aria-label="Next PDF page" disabled={page===pdf.numPages} onClick={()=>setPage(n=>n+1)}><ChevronRight size={18}/></button><select aria-label="PDF zoom" value={zoom} onChange={e=>setZoom(Number(e.target.value))}>{[[1,'Fit width'],[1.25,'125%'],[1.5,'150%'],[2,'200%']].map(([v,label])=><option value={v} key={v}>{label}</option>)}</select></div><PdfPage key={page+'-'+zoom+'-'+width} document={pdf} page={page} width={width} zoom={zoom} title={title}/></>}</section>;
}
