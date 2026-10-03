import {storage} from '../storage.js';
import {useCallback,useEffect,useRef,useState} from 'react';

function readCache(key){try{const c=JSON.parse(storage.getItem(key));return c&&Number.isFinite(c.fetchedAt)&&Date.now()-c.fetchedAt>=0&&Date.now()-c.fetchedAt<86400000*2?c:null;}catch{return null;}}
export function useRemoteData(key,loader){
 const [state,setState]=useState(()=>({key,cache:readCache(key),loading:true,error:''}));const [revision,setRevision]=useState(0);const loaderRef=useRef(loader);loaderRef.current=loader;
 useEffect(()=>{
  let active=true;const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
  setState(s=>({key,cache:s.key===key?s.cache:readCache(key),loading:true,error:''}));
  loaderRef.current(controller.signal).then(data=>{if(!active)return;const cache={data,fetchedAt:Date.now()};try{storage.setItem(key,JSON.stringify(cache));}catch{}setState({key,cache,loading:false,error:''});}).catch(error=>{if(active)setState(s=>({...s,loading:false,error:error.name==='AbortError'?'The provider took too long to respond. Try again.':error.message||'The live service is unavailable.'}));}).finally(()=>clearTimeout(timeout));
  return()=>{active=false;clearTimeout(timeout);controller.abort();};
 },[key,revision]);
 useEffect(()=>{const timer=setInterval(()=>{if(document.visibilityState==='visible')setRevision(v=>v+1);},30*60*1000);return()=>clearInterval(timer);},[]);
 const refresh=useCallback(()=>setRevision(v=>v+1),[]);
 return {...state,cache:state.key===key?state.cache:readCache(key),refresh};
}
export async function fetchJSON(url,signal){const response=await fetch(url,{signal,credentials:'omit'});if(!response.ok)throw new Error(`The provider is unavailable (${response.status}).`);return response.json();}
