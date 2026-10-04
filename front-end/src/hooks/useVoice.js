import {useEffect,useRef,useState} from 'react';
export const VOICE_LANGUAGES={en:'en-GB',de:'de-DE',fr:'fr-FR',es:'es-ES',zh:'zh-CN'};
export function useVoice(language,onTranscript,options={}){
 const [listening,setListening]=useState(false),[interim,setInterim]=useState(''),[error,setError]=useState(''),[speaking,setSpeaking]=useState(false),[voices,setVoices]=useState([]);
 const recognition=useRef(),timeout=useRef(),pause=useRef(),live=useRef(true),callbacks=useRef(),utterance=useRef(),generation=useRef(0);callbacks.current={onTranscript,...options};
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 function silence(){generation.current++;utterance.current=null;window.speechSynthesis?.cancel();setSpeaking(false);}
 function stop(){clearTimeout(timeout.current);clearTimeout(pause.current);recognition.current?.stop();}
 function cancel(){const rec=recognition.current;recognition.current=null;if(rec)rec.onend=null;rec?.abort();clearTimeout(timeout.current);clearTimeout(pause.current);setListening(false);setInterim('');}
 useEffect(()=>{live.current=true;const synth=window.speechSynthesis,update=()=>setVoices(synth?.getVoices()||[]);update();synth?.addEventListener('voiceschanged',update);return()=>{live.current=false;clearTimeout(timeout.current);clearTimeout(pause.current);recognition.current?.abort();generation.current++;synth?.cancel();synth?.removeEventListener('voiceschanged',update);};},[]);
 useEffect(()=>{cancel();silence();},[language]);
 function start(){
  if(!Recognition||recognition.current||listening)return;silence();setError('');setInterim('');let completed='',discard=false;
  const rec=new Recognition();recognition.current=rec;rec.lang=VOICE_LANGUAGES[language];rec.continuous=true;rec.interimResults=true;
  rec.onstart=()=>{if(live.current)setListening(true);};
  rec.onresult=e=>{if(!live.current)return;clearTimeout(pause.current);let partial='';for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal){const text=e.results[i][0].transcript;completed=(completed+' '+text).trim().slice(0,1800);callbacks.current.onTranscript?.(text);}else partial+=e.results[i][0].transcript;}setInterim(partial);if(callbacks.current.autoTurn&&completed&&!partial)pause.current=setTimeout(()=>rec.stop(),1500);};
  rec.onend=()=>{if(recognition.current!==rec)return;recognition.current=null;clearTimeout(timeout.current);clearTimeout(pause.current);if(live.current){setListening(false);setInterim('');if(!discard&&completed&&callbacks.current.autoTurn)callbacks.current.onComplete?.(completed);}};
  rec.onerror=e=>{discard=true;if(live.current&&e.error!=='aborted')setError(({'not-allowed':'Microphone access was denied. Allow it in your browser or type your answer.','network':'The browser’s speech service could not connect. Type your answer instead.','no-speech':'No speech detected. Press Speak to try again.','audio-capture':'No microphone is available. Connect one or type your answer.'})[e.error]||'Speech recognition is unavailable here. Try Chrome or Edge, or type your answer.');};
  try{setListening(true);rec.start();timeout.current=setTimeout(()=>rec.stop(),60000);}catch{recognition.current=null;setListening(false);setError('The microphone could not start. Type your answer or try again.');}
 }
 function speak(text,{resume=true}={}){
  if(!window.speechSynthesis)return;cancel();silence();setError('');const token=generation.current;
  const item=new SpeechSynthesisUtterance(String(text).replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[#*_`]/g,''));utterance.current=item;item.lang=VOICE_LANGUAGES[language];item.rate=callbacks.current.rate||.95;
  const available=window.speechSynthesis.getVoices().filter(v=>v.lang.startsWith(language)),voice=available.find(v=>v.voiceURI===callbacks.current.voiceURI)||available.find(v=>v.localService)||available[0];if(voice)item.voice=voice;
  item.onstart=()=>{if(live.current&&token===generation.current)setSpeaking(true);};
  item.onend=()=>{if(live.current&&token===generation.current){setSpeaking(false);utterance.current=null;if(resume)callbacks.current.onPlaybackEnd?.();}};
  item.onerror=e=>{if(live.current&&token===generation.current){setSpeaking(false);if(!['canceled','interrupted'].includes(e.error))setError('Audio could not play. Press Replay or read the reply below.');}};
  window.speechSynthesis.speak(item);
 }
 return {supported:!!Recognition,canSpeak:!!window.speechSynthesis,voices:voices.filter(v=>v.lang.startsWith(language)),listening,interim,error,speaking,start,stop,cancel,speak,silence};
}
