import React,{createContext,useContext,useEffect,useState,useCallback,useRef} from 'react';
import {Eye,EyeOff,ArrowRight,LogOut,ShieldCheck,Cloud,CloudOff} from 'lucide-react';
import {setStorageOwner,restoreStorage,snapshotStorage} from './storage.js';
import {useT,LanguageSelector} from './i18n.jsx';
import {Blue} from './components/UI.jsx';
import s from './components/account/Account.module.css';
export async function api(path,method='GET',data,signal){const response=await fetch('/api'+path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json','X-Aster-Client':'workspace'},body:data?JSON.stringify(data):undefined,signal});let value;try{value=await response.json()}catch{throw new Error('Start the local Aster service to use accounts and AI.')}if(!response.ok)throw new Error(value.error||'Something went wrong. Try again.');return value;}
const AuthContext=createContext(null);
export function useAuth(){return useContext(AuthContext);}
export function AuthProvider({children}){
 const [user,setUser]=useState(null),[ready,setReady]=useState(false),[sync,setSync]=useState('guest');const revision=useRef(0),pending=useRef(false);
 const activate=useCallback(async next=>{const {data}=await api('/workspace');restoreStorage(next.id,data);setUser(next);setSync('saved');},[]);
 useEffect(()=>{let live=true;api('/auth/session').then(async v=>{if(v.user&&live)await activate(v.user);}).catch(()=>{}).finally(()=>{if(live)setReady(true)});return()=>{live=false}},[activate]);
 useEffect(()=>{if(!user)return;let timer,active=true;async function save(){if(pending.current){timer=setTimeout(save,600);return;}pending.current=true;const rev=revision.current;try{await api('/workspace','PUT',{data:snapshotStorage()});if(active)setSync(rev===revision.current?'saved':'saving');}catch{if(active)setSync('error');}finally{pending.current=false;if(active&&rev!==revision.current)timer=setTimeout(save,400);}}function changed(){revision.current++;setSync('saving');clearTimeout(timer);timer=setTimeout(save,800);}window.addEventListener('aster-storage',changed);return()=>{active=false;clearTimeout(timer);window.removeEventListener('aster-storage',changed);}},[user]);
 const logout=useCallback(async()=>{if(pending.current)throw new Error('Please wait for your latest changes to finish saving.');if(sync!=='saved')await api('/workspace','PUT',{data:snapshotStorage()});await api('/auth/logout','POST');setStorageOwner('');setUser(null);setSync('guest');try{window.sessionStorage.removeItem('aster-demo-entry')}catch{}window.location.hash='/login';},[sync]);
 if(!ready)return <div className={s.loading} role="status">Opening your study space…</div>;
 return <AuthContext.Provider value={{user,activate,logout,sync}}>{React.cloneElement(children,{key:user?.id||'guest'})}</AuthContext.Provider>;
}
export function AccountStatus(){const {user,sync}=useAuth();const tr=useT();return <a className={s.status} href={user?'#/account':'#/login'} title={tr(user?(sync==='error'?'Changes saved only in this browser':sync==='saving'?'Saving to your account':'Saved to your account'):'Sign in to save your progress')}><span className={s.statusDot}/>{user?(sync==='error'?<CloudOff size={16}/>:<Cloud size={16}/>):<ShieldCheck size={16}/>}<span>{tr(user?user.username:'Sign in')}</span></a>}
export {default} from './components/account/AuthPage.jsx';
