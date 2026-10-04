import React from 'react';
import {ArrowRight,Gift,Swords,Zap} from 'lucide-react';
import {useT} from '../../i18n.jsx';
import s from './Activities.module.css';
export default function ActivityLinks(){const tr=useT();return <div className={s.activityLinks}>{[
 ['math-game','Number stage','A ten-question times-table round. Choose your pace and earn learning coins.',Zap,'Play & earn'],
 ['claw','Daily claw','One free play, every day. Win a cosmetic or a double-coin boost.',Gift,'Pick your prize'],
 ['debate','Debate arena','Take a side, debate an AI, and earn up to ten coins for your argument.',Swords,'Make your case']
 ].map(([route,title,description,Icon,action])=><a href={'#/'+route} key={route}><Icon size={25}/><h3>{tr(title)}</h3><p>{tr(description)}</p><span>{tr(action)}<ArrowRight size={15}/></span></a>)}</div>}
