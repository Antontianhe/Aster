import React,{useId,useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {RotateCcw} from 'lucide-react';
import {useApp} from '../context.jsx';
import s from './BrandLogo.module.css';

export default function BrandLogo({wordmark=true,tagline=false,large=false,replay=0}){
 const app=useApp(),reduced=useReducedMotion(),calm=reduced||app?.prefs.reduceMotion,id=useId().replace(/:/g,''),[hover,setHover]=useState(0);
 const reveal={duration:1.1,ease:[.22,1,.36,1]};
 return <span className={`${s.logo} ${large?s.large:''}`} data-calm={Boolean(calm)} onPointerEnter={()=>{if(!calm)setHover(v=>v+1)}}>
  <motion.svg key={replay+'-'+hover} className={s.mark} viewBox="0 0 100 100" aria-hidden={wordmark?true:undefined} role={wordmark?undefined:'img'} aria-label={wordmark?undefined:'Learnify: an open book taking flight'} initial={calm?false:{rotate:-8,scale:.82,opacity:0}} animate={{rotate:0,scale:1,opacity:1}} transition={reveal}>
   <defs><linearGradient id={id+'-left'} x1="0" y1="1" x2="1" y2="0"><stop stopColor="#3157b7"/><stop offset="1" stopColor="#69d8d2"/></linearGradient><linearGradient id={id+'-right'} x1="0" y1="1" x2="1" y2="0"><stop stopColor="#7051c4"/><stop offset="1" stopColor="#a0adff"/></linearGradient></defs>
   <motion.path d="M13 34Q32 28 49 45V80Q32 63 13 69Z" fill={'url(#'+id+'-left)'} initial={calm?false:{rotateY:-65,opacity:0}} animate={{rotateY:0,opacity:1}} style={{originX:'49px',originY:'70px'}} transition={{...reveal,delay:.08}}/>
   <motion.path d="M51 45Q69 28 87 34V69Q68 63 51 80Z" fill={'url(#'+id+'-right)'} initial={calm?false:{rotateY:65,opacity:0}} animate={{rotateY:0,opacity:1}} style={{originX:'51px',originY:'70px'}} transition={{...reveal,delay:.16}}/>
   <motion.path d="M22 38V56Q35 57 45 67M78 38V56Q65 57 55 67" fill="none" stroke="#f5ffff" strokeWidth="2.7" strokeLinecap="round" opacity=".75" initial={calm?false:{pathLength:0}} animate={{pathLength:1}} transition={{duration:.7,delay:.35}}/>
   <motion.path d="M29 29Q40 31 50 41Q61 24 76 20" fill="none" stroke="#64bbb9" strokeWidth="4" strokeLinecap="round" initial={calm?false:{pathLength:0,y:10,opacity:0}} animate={{pathLength:1,y:0,opacity:1}} transition={{...reveal,delay:.3}}/>
   <motion.path d="M44 21L51 29L59 16" fill="none" stroke="#8a8ddd" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" initial={calm?false:{pathLength:0,y:12,opacity:0}} animate={{pathLength:1,y:0,opacity:1}} transition={{...reveal,delay:.46}}/>
   <motion.circle cx="69" cy="10" r="4" fill="#63cbc5" initial={calm?false:{cx:51,cy:42,scale:0}} animate={{cx:69,cy:10,scale:1}} transition={{...reveal,delay:.5}}/>
  </motion.svg>
  {wordmark&&<span className={s.wordmark}>Learnify<span className={s.dot}>.</span>{tagline&&<small>IDEAS TAKE FLIGHT</small>}</span>}
 </span>;
}
export function BrandReveal(){const [replay,setReplay]=useState(0);return <div className={s.reveal}><span className={s.orbit} aria-hidden="true"/><span className={s.orbitTwo} aria-hidden="true"/><div className={s.heroMark}><BrandLogo wordmark={false} large replay={replay}/></div><div className={s.signature}><span>Learnify<span className={s.dot}>.</span></span><p>Ideas take flight.</p></div><button className={s.replay} onClick={()=>setReplay(v=>v+1)}><RotateCcw size={13}/>Replay logo animation</button></div>;}
