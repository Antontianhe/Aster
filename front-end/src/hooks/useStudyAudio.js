import {useCallback,useEffect,useRef} from 'react';

// One context per application. Created only inside a user gesture, never on load.
export function useStudyAudio(enabled){
  const context=useRef(null),active=useRef(new Set());
  useEffect(()=>()=>{for(const node of active.current){try{node.stop();}catch{}}active.current.clear();context.current?.close().catch(()=>{});context.current=null;},[]);
  return useCallback((kind='click')=>{
    if(!enabled)return;
    const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!Audio)return;
    try{
      const ctx=context.current?.state==='closed'||!context.current?(context.current=new Audio()):context.current;
      if(ctx.state==='suspended')ctx.resume().catch(()=>{});
      const melody={click:[440],correct:[523,784],error:[220,174],reward:[523,659,784],level:[523,659,784,1047]}[kind]||[440];
      const duration=kind==='click'?.07:.16;
      melody.forEach((frequency,index)=>{
        const oscillator=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+index*.075;
        oscillator.type=kind==='error'?'sine':'triangle';oscillator.frequency.setValueAtTime(frequency,start);
        gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(kind==='click'?.018:.035,start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
        oscillator.connect(gain);gain.connect(ctx.destination);active.current.add(oscillator);
        oscillator.onended=()=>{active.current.delete(oscillator);oscillator.disconnect();gain.disconnect();};oscillator.start(start);oscillator.stop(start+duration+.02);
      });
    }catch{/* Audio is an enhancement; blocked audio never interrupts a review. */}
  },[enabled]);
}
