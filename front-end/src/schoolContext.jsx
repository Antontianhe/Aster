import React,{createContext,useContext,useEffect,useState,useCallback} from 'react';
import {api,useAuth} from './auth.jsx';
import {storage} from './storage.js';
import {validSchoolSnapshot as valid} from './schoolSync.js';
const SchoolContext=createContext(null),KEY='aster-school-snapshot-v1';
const EMPTY={resources:[],events:[],assessments:[],units:[],documents:[],subjects:[],coverage:{blocked:[]}};
export function SchoolProvider({children}){
 const {user}=useAuth();const[data,setData]=useState(()=>{try{const v=JSON.parse(storage.getItem(KEY));return valid(v)?v:EMPTY;}catch{return EMPTY;}}),[loading,setLoading]=useState(true),[error,setError]=useState(''),[local,setLocal]=useState(false);
 const refresh=useCallback(async(force=false)=>{try{const v=await api('/local-school',force?'POST':'GET');if(!valid(v))throw new Error('Invalid school import.');setData(v);setLocal(true);setError('');}catch(e){setLocal(false);setError('The live school connection is unavailable. Any saved import is still shown.');}finally{setLoading(false);}},[]);
 useEffect(()=>{refresh();const timer=setInterval(()=>{if(document.visibilityState==='visible')refresh();},60000);const focus=()=>refresh();window.addEventListener('focus',focus);return()=>{clearInterval(timer);window.removeEventListener('focus',focus);};},[refresh,user?.id]);
 const importSnapshot=async file=>{if(file.size>450_000)throw new Error('Choose an Aster school snapshot smaller than 450 KB.');const value=JSON.parse(await file.text());if(!valid(value))throw new Error('This is not a valid Aster school snapshot.');storage.setItem(KEY,JSON.stringify(value));setData(value);setError('');};
 return <SchoolContext.Provider value={{...data,loading,error,local,refresh,importSnapshot}}>{children}</SchoolContext.Provider>;
}
export function useSchool(){return useContext(SchoolContext)||{...EMPTY,loading:false,error:'',refresh:()=>{},importSnapshot:()=>{}};}
