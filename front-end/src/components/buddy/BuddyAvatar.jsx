import React,{memo,useId} from 'react';import s from './Buddy.module.css';import {WardrobeLayers} from './WardrobeLayers.jsx';
export const BuddyAvatar=memo(function BuddyAvatar({id='dino',color='#63b3ed',clothes='',accessory='',name='Your buddy',excited=false}){
 const uid=useId().replace(/:/g,'');const fur='url(#'+uid+')';const is=(...ids)=>ids.includes(id);
 return <svg className={s.avatar+' '+(excited?s.excited:'')} viewBox="0 0 240 250" role="img" aria-label={name}><defs><linearGradient id={uid} x1="0" y1="0" x2="1" y2="1"><stop stopColor={color}/><stop offset="1" stopColor={color} stopOpacity=".72"/></linearGradient></defs><ellipse cx="120" cy="226" rx="65" ry="12" fill="#162847" opacity=".12"/>
 <g className={s.body}>
 {is('dino','dragon')&&<path className={s.tail} d="M165 170 Q225 199 220 131 Q211 169 169 144" fill={color}/>}
 {id==='fox'&&<path className={s.tail} d="M163 165 Q221 196 215 126 Q192 117 186 150Z" fill={color}/>}
 {id==='dragon'&&<><path d="M83 148 37 103 36 166 83 183M157 148 203 103 204 166 157 183" fill={color}/><path d="m48 132 6 29 20 10m118-39-6 29-20 10" fill="none" stroke="#fff7" strokeWidth="4"/></>}
 {id==='turtle'&&<ellipse cx="121" cy="166" rx="68" ry="52" fill="#57836d"/>}
 <ellipse cx="90" cy="213" rx="24" ry="13" fill={color}/><ellipse cx="151" cy="213" rx="24" ry="13" fill={color}/><ellipse cx="120" cy="170" rx="56" ry="51" fill={fur}/><ellipse cx="120" cy="176" rx="34" ry="35" fill="#fff" opacity=".36"/>
 <ellipse className={s.arm} cx="65" cy="167" rx="13" ry="24" fill={color} transform="rotate(24 65 167)"/><ellipse cx="176" cy="167" rx="13" ry="24" fill={color} transform="rotate(-24 176 167)"/>
 {id==='rabbit'&&<><ellipse cx="91" cy="57" rx="18" ry="43" fill={fur} transform="rotate(-12 91 57)"/><ellipse cx="148" cy="57" rx="18" ry="43" fill={fur} transform="rotate(12 148 57)"/><path d="m90 30 5 45m54-45-5 45" stroke="#e9bad3" strokeWidth="12" strokeLinecap="round"/></>}
 {is('cat','fox','owl')&&<><path d="M58 90 60 37 102 69M142 66 183 37 185 96" fill={fur}/><path d="m69 74 0-22 21 23m66 0 17-23 1 25" fill="#f7d9df" opacity=".7"/></>}
 {id==='panda'&&<><circle cx="71" cy="65" r="23" fill="#465777"/><circle cx="169" cy="65" r="23" fill="#465777"/></>}
 {id==='axolotl'&&<g stroke={color} strokeWidth="13" strokeLinecap="round"><path d="m60 82-28-19m30 42-36-2m36 22-30 17m148-60 28-19m-30 42 36-2m-36 22 30 17"/></g>}
 {is('dino','dragon')&&<path d="m79 73 4-28 20 14 16-28 17 29 25-11-2 30" fill={color}/>}
 <ellipse cx="120" cy="108" rx={id==='fox'?64:66} ry="58" fill={fur}/>
 {id==='penguin'&&<path d="M120 151C30 151 67 66 99 84Q120 96 141 84C178 64 206 151 120 151Z" fill="#f2f6fb"/>}
 {id==='owl'&&<><circle cx="91" cy="105" r="28" fill="#fff8"/><circle cx="149" cy="105" r="28" fill="#fff8"/></>}
 {id==='panda'&&<><ellipse cx="91" cy="104" rx="22" ry="26" fill="#465777" transform="rotate(15 91 104)"/><ellipse cx="149" cy="104" rx="22" ry="26" fill="#465777" transform="rotate(-15 149 104)"/></>}
 {id==='fox'&&<path d="M58 103 120 131 182 103Q178 155 120 165 62 155 58 103" fill="#fff9"/>}
 <g className={s.eyes}><ellipse cx="94" cy="106" rx="7" ry="10" fill="#233453"/><ellipse cx="146" cy="106" rx="7" ry="10" fill="#233453"/><circle cx="96" cy="103" r="2.5" fill="#fff"/><circle cx="148" cy="103" r="2.5" fill="#fff"/></g>
 <ellipse cx="77" cy="125" rx="10" ry="5" fill="#ef8fa3" opacity=".55"/><ellipse cx="164" cy="125" rx="10" ry="5" fill="#ef8fa3" opacity=".55"/>
 {is('penguin','owl')?<path d="m111 123 18 0-9 14Z" fill="#eab85d"/>:<path d="M109 134q11 12 22 0" fill="none" stroke="#344668" strokeWidth="4" strokeLinecap="round"/>}
 {is('cat','fox','panda','rabbit')&&<path d="m116 121 8 0-4 5Z" fill="#52516c"/>}
 {id==='cat'&&<g stroke="#59627a" opacity=".55" strokeWidth="2"><path d="m69 121-19-4m18 11-20 4m123-11 19-4m-18 11 20 4"/></g>}
 {clothes==='scarf'&&<><path d="M74 153Q120 171 166 153L165 167Q120 183 75 168Z" fill="#ed9872"/><path d="m145 169 14-4 8 41-18 3Z" fill="#ed9872"/></>}
 {['hoodie','stars'].includes(clothes)&&<><path d="M73 159Q120 180 167 159L171 202Q120 224 69 202Z" fill={clothes==='stars'?'#8b7cce':'#6f8bd0'}/><path d="M100 190h40l-3 13h-34Z" fill="#fff3"/>{clothes==='stars'&&<path d="m119 175 3 6 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z" fill="#f8db99"/>}</>}
 {clothes==='bow'&&<path d="M121 161 98 148v27l23-12 22 12v-27Z" fill="#dc80ac"/>}
 {accessory==='cap'&&<><path d="M73 69q7-46 57-41 36 1 44 41Z" fill="#59a89e"/><path d="M68 66h110q15 0 17 10H69Z" fill="#417f82"/></>}
 {accessory==='crown'&&<path d="m87 65-6-32 23 15 17-26 17 26 24-15-8 32Z" fill="#e9bc58" stroke="#ffe4a1" strokeWidth="3"/>}
 {accessory==='glasses'&&<g fill="none" stroke="#3d4d68" strokeWidth="4"><circle cx="94" cy="108" r="20"/><circle cx="146" cy="108" r="20"/><path d="M114 106h12m-52-2-10-4m102 4 10-4"/></g>}
 {accessory==='flower'&&<g transform="translate(165 65)"><g fill="#fff2d5">{[0,60,120,180,240,300].map(a=><ellipse key={a} cy="-10" rx="6" ry="10" transform={'rotate('+a+')'}/>)}</g><circle r="8" fill="#e4b854"/></g>}
 <WardrobeLayers clothes={clothes} accessory={accessory}/></g></svg>;
});
