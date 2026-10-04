import React from 'react';
import {motion,useMotionValue,useMotionTemplate,useSpring} from 'motion/react';
import {ArrowUpRight,FlaskConical,Zap,Orbit,Dna,Leaf,Sun,Activity,Flame,Atom,Ship,Triangle as Prism,Waves,Gauge,SlidersHorizontal} from 'lucide-react';
import s from './ScienceGallery.module.css';

export const LAB_CARDS=[
 {id:'neutralization',name:'Acid meets base',branch:'Chemistry',icon:FlaskConical,description:'Pour, mix and predict pH. Discover what happens when acids and bases react.',concept:'Acids & alkalis',symbol:'H⁺ + OH⁻'},
 {id:'circuit',name:'Light up a circuit',branch:'Physics',icon:Zap,description:'Build a closed circuit and see how voltage and resistance change the current.',concept:'Electricity',symbol:'V = IR'},
 {id:'pendulum',name:'Find your rhythm',branch:'Physics',icon:Orbit,description:'Release a pendulum. Explore how length and gravity shape each swing.',concept:'Oscillations',symbol:'T = 2π√(L/g)'},
 {id:'osmosis',name:'Water across membranes',branch:'Biology',icon:Leaf,description:'Change solute concentrations and predict which way water moves through a membrane.',concept:'Cell transport',symbol:'H₂O'},
 {id:'inheritance',name:'Patterns of inheritance',branch:'Biology',icon:Dna,description:'Choose two parents and use a Punnett square to explore possible offspring.',concept:'Genetics',symbol:'Aa × Aa'},
 {id:'photosynthesis',name:'Limiting photosynthesis',branch:'Biology',icon:Sun,description:'Balance light, carbon dioxide and temperature to uncover the limiting factor.',concept:'Plant biology',symbol:'CO₂ + H₂O'},
 {id:'enzymes',name:'Enzyme activity',branch:'Biology',icon:Activity,description:'Investigate temperature and pH to find the conditions in which an enzyme works best.',concept:'Biochemistry',symbol:'pH · °C'},
 {id:'reaction-rate',name:'Speed of a reaction',branch:'Chemistry',icon:Flame,description:'Change concentration, heat and surface area. Watch the product curve respond.',concept:'Reaction rates',symbol:'Δproduct / Δt'},
 {id:'diffusion',name:'Particles spreading out',branch:'Chemistry',icon:Atom,description:'Release two gases and explore how temperature affects their mixing.',concept:'Particle theory',symbol:'Random motion'},
 {id:'buoyancy',name:'Float or sink',branch:'Physics',icon:Ship,description:'Adjust mass, volume and liquid density to find out what floats—and why.',concept:'Density & forces',symbol:'ρ = m/V'},
 {id:'refraction',name:'Bending light',branch:'Physics',icon:Prism,description:'Send light between materials and discover refraction and total internal reflection.',concept:'Optics',symbol:'n₁ sin θ₁ = n₂ sin θ₂'},
 {id:'waves',name:'Wavelength and frequency',branch:'Physics',icon:Waves,description:'Make a travelling wave and explore the link between speed, frequency and wavelength.',concept:'Wave motion',symbol:'v = fλ'},
 {id:'gas',name:'Compressing a gas',branch:'Physics',icon:Gauge,description:'Move the piston and measure how an ideal gas responds at constant temperature.',concept:'Gas pressure',symbol:'pV = constant'},
];
export const LAB_CATEGORIES=['All labs','Chemistry','Biology','Physics'];
export function labLink(id,category='All labs'){return '#/science?experiment='+id+(category==='All labs'?'':'&category='+category);}

// Motion's spring values and gesture components power the interaction; all icons are Lucide.
function LabCard({lab,index,category,calm}){
 const {icon:Icon}=lab,rx=useSpring(0,{stiffness:240,damping:24}),ry=useSpring(0,{stiffness:240,damping:24}),px=useMotionValue(50),py=useMotionValue(30);
 const light=useMotionTemplate`radial-gradient(circle at ${px}% ${py}%, var(--card-glow), transparent 65%)`;
 function move(e){if(calm||e.pointerType!=='mouse')return;const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;rx.set((.5-y)*9);ry.set((x-.5)*12);px.set(x*100);py.set(y*100);}
 function reset(){rx.set(0);ry.set(0);px.set(50);py.set(30);}
 return <motion.li className={s.cardSlot} initial={calm?false:{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.35,delay:Math.min(index*.035,.25)}}>
  <motion.a href={labLink(lab.id,category)} className={s.card} data-branch={lab.branch} aria-labelledby={'lab-title-'+lab.id} aria-describedby={'lab-description-'+lab.id}
   onPointerMove={move} onPointerLeave={reset} onBlur={reset} style={{rotateX:calm?0:rx,rotateY:calm?0:ry,transformPerspective:1000}}
   initial="rest" whileHover={calm?'rest':'active'} whileFocus={calm?'rest':'active'} whileTap={calm?undefined:{scale:.98}}>
   <div className={s.art} aria-hidden="true">
    <motion.span className={s.glow} style={{background:light}}/>
    <span className={s.subject}>{lab.branch}</span><span className={s.number}>{String(LAB_CARDS.indexOf(lab)+1).padStart(2,'0')}</span>
    <div className={s.object}>
     <motion.span className={s.backPlate} variants={{rest:{rotate:-12,y:6},active:{rotate:-18,y:8}}} transition={{type:'spring',stiffness:180,damping:17}}/>
     <motion.span className={s.iconPlate} variants={{rest:{y:0,rotate:-5},active:{y:-9,rotate:3}}} transition={{type:'spring',stiffness:240,damping:17}}><Icon size={58} strokeWidth={1.25}/></motion.span>
     <motion.span className={s.satellite} variants={{rest:{y:0,rotate:8},active:{y:5,rotate:-6}}} transition={{type:'spring',stiffness:160,damping:16}}><SlidersHorizontal size={17} strokeWidth={1.5}/></motion.span>
    </div>
    <span className={s.formula}>{lab.symbol}</span>
   </div>
   <div className={s.cardBody}><span className={s.concept}>{lab.concept}</span><h2 id={'lab-title-'+lab.id}>{lab.name}</h2><p id={'lab-description-'+lab.id}>{lab.description}</p><div className={s.cardFoot}><span>Open experiment</span><motion.span variants={{rest:{x:0,y:0},active:{x:3,y:-3}}}><ArrowUpRight size={19}/></motion.span></div></div>
  </motion.a>
 </motion.li>;
}
export default function ScienceGallery({category,calm}){
 const visible=LAB_CARDS.filter(l=>category==='All labs'||l.branch===category);
 return <div className={s.gallery} data-calm={calm}>
  <nav className={s.categories} aria-label="Science lab categories">{LAB_CATEGORIES.map(c=><a key={c} href={c==='All labs'?'#/science':'#/science?category='+c} aria-current={c===category?'page':undefined}>{c}<span>{c==='All labs'?LAB_CARDS.length:LAB_CARDS.filter(l=>l.branch===c).length}</span></a>)}</nav>
  <div className={s.listHeading}><p>{visible.length} experiments to explore</p><span><SlidersHorizontal size={14}/> Change a variable. See what happens.</span></div>
  <ul className={s.grid} key={category}>{visible.map((lab,index)=><LabCard key={lab.id} lab={lab} index={index} category={category} calm={calm}/>)}</ul>
 </div>;
}
