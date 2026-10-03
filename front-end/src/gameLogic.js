export function move2048(board,direction){const output=Array(16).fill(0);let score=0;const lines=Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>direction==='left'?r*4+c:direction==='right'?r*4+3-c:direction==='up'?c*4+r:(3-c)*4+r));for(const indexes of lines){const nums=indexes.map(i=>board[i]).filter(Boolean),merged=[];for(let i=0;i<nums.length;i++){if(nums[i]===nums[i+1]){const n=nums[i]*2;merged.push(n);score+=n;i++;}else merged.push(nums[i]);}indexes.forEach((index,i)=>output[index]=merged[i]||0);}return{board:output,score,moved:output.some((n,i)=>n!==board[i])};}
export function spawnTile(board,random=Math.random){const free=board.map((v,i)=>v?null:i).filter(v=>v!==null);if(!free.length)return board;const next=[...board];next[free[Math.floor(random()*free.length)]]=random()<.9?2:4;return next;}
export function canMove2048(board){return ['left','right','up','down'].some(d=>move2048(board,d).moved);}
export const SUDOKU_PUZZLE='530070000600195000098000060800060003400803001700020006060000280000419005000080079'.split('').map(Number);
export const SUDOKU_SOLUTION='534678912672195348198342567859761423426853791713924856961537284287419635345286179'.split('').map(Number);
export function sudokuConflicts(board,index){if(!board[index])return false;const row=Math.floor(index/9),col=index%9;return board.some((n,i)=>i!==index&&n===board[index]&&(Math.floor(i/9)===row||i%9===col||(Math.floor(i/27)===Math.floor(row/3)&&Math.floor(i%9/3)===Math.floor(col/3))));}
export function sudokuSolved(board){return board.length===81&&board.every((n,i)=>n>=1&&n<=9&&!sudokuConflicts(board,i));}
export function freshGame(kind){return{kind,time:0,score:0,lives:3,x:450,y:400,vy:0,lane:1,objects:[],bullets:[],spawn:0,fire:0,invulnerable:0,over:false,previous:{}};}
export function stepGame(state,input,dt,random=Math.random){if(state.over)return state;dt=Math.min(.04,Math.max(0,dt));const s={...state,objects:state.objects.map(v=>({...v})),bullets:state.bullets.map(v=>({...v})),time:state.time+dt,spawn:state.spawn-dt,fire:state.fire-dt,invulnerable:Math.max(0,state.invulnerable-dt)};const hit=()=>{if(!s.invulnerable){s.lives--;s.invulnerable=1.2;}};
 if(s.kind==='racer'){
  if(input.left&&!state.previous.left)s.lane=Math.max(0,s.lane-1);if(input.right&&!state.previous.right)s.lane=Math.min(2,s.lane+1);s.x+=(315+s.lane*135-s.x)*Math.min(1,dt*15);
  if(s.spawn<=0){s.objects.push({x:315+Math.floor(random()*3)*135,y:-70,type:random()<.3?'coin':'car'});s.spawn=.72-Math.min(.27,s.time/180);}
  for(const o of s.objects){o.y+=dt*(265+s.time*2);if(Math.abs(o.x-s.x)<48&&Math.abs(o.y-410)<55){if(o.type==='coin')s.score+=25;else hit();o.dead=true;}}
  s.objects=s.objects.filter(o=>!o.dead&&o.y<590);
 }else if(s.kind==='space'){
  s.x=Math.max(35,Math.min(865,s.x+((input.right?1:0)-(input.left?1:0))*dt*460));
  if(input.fire&&s.fire<=0){s.bullets.push({x:s.x,y:420});s.fire=.16;}
  if(s.spawn<=0){s.objects.push({x:40+random()*820,y:-30,type:'rock',radius:17+random()*13});s.spawn=.65;}
  for(const b of s.bullets)b.y-=dt*620;
  for(const o of s.objects){o.y+=dt*(100+s.time*2.3);for(const b of s.bullets)if(!b.dead&&Math.hypot(o.x-b.x,o.y-b.y)<o.radius+7&&!o.dead){o.dead=true;b.dead=true;s.score+=50;}if(Math.hypot(o.x-s.x,o.y-438)<o.radius+19&&!o.dead){hit();o.dead=true;}if(o.y>530){hit();o.dead=true;}}
  s.objects=s.objects.filter(o=>!o.dead);s.bullets=s.bullets.filter(b=>!b.dead&&b.y>-20);
 }else{
  s.x=160;if(input.fire&&!state.previous.fire&&s.y>=400){s.vy=-700;}s.vy+=dt*1900;s.y=Math.min(400,s.y+s.vy*dt);if(s.y>=400)s.vy=0;
  if(s.spawn<=0){s.objects.push({x:940,y:414,type:random()<.27?'coin':'spike',width:34+random()*20});s.spawn=1.1+random()*.5-Math.min(.25,s.time/160);}
  for(const o of s.objects){o.x-=dt*(300+s.time*2.2);const oy=o.type==='coin'?300:414;if(o.type==='coin'){if(Math.hypot(o.x-s.x,oy-(s.y-25))<40){s.score+=25;o.dead=true;}}else if(Math.abs(o.x-s.x)<o.width/2+19&&s.y>369){hit();o.dead=true;}}
  s.objects=s.objects.filter(o=>!o.dead&&o.x>-60);
 }s.previous={...input};s.over=s.lives<=0||s.time>=75;return s;
}
