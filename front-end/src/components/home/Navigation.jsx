import React from 'react';
import {Home,GraduationCap,CalendarDays,LibraryBig,Heart,MessagesSquare,FlaskConical,Mic,Brain,Trophy} from 'lucide-react';
import {useT} from '../../i18n.jsx';
export const NAV_GROUPS=[
 {title:'Today',icon:Home,home:'overview',routes:[['overview','Today'],['headlines','World news'],['celebrations','Celebrations'],['focus','Focus room']]},
 {title:'Learn',icon:GraduationCap,home:'subjects',routes:[['subjects','My subjects'],['curriculum','IGCSE & IB'],['roadmap','Study roadmap']]},
 {title:'Science lab',icon:FlaskConical,home:'science',routes:[['science','Science lab']]},
 {title:'Speaking room',icon:Mic,home:'oral',routes:[['oral','Speaking practice'],['debate','Debate']]},
 {title:'Study lab',icon:Brain,home:'lab',routes:[['lab','Study lab']]},
 {title:'Competitions',icon:Trophy,home:'competitions',routes:[['competitions','Competitions']]},
 {title:'School & planner',icon:CalendarDays,home:'planner',routes:[['planner','My planner'],['homework','Homework'],['board','Task board'],['school','Grades & school']]},
 {title:'Library',icon:LibraryBig,home:'books',routes:[['books','Book library'],['resources','Course resources'],['research','Research desk'],['writing','Writing studio']]},
 {title:'Buddy & play',icon:Heart,home:'buddy',routes:[['buddy','Avatar & buddy'],['arcade','Game room'],['math-game','Number stage'],['claw','Daily claw'],['helper','AI helper']]},
 {title:'Community',icon:MessagesSquare,home:'community',routes:[['community','Student lounge']]}
];
export function groupFor(section){return NAV_GROUPS.find(g=>g.routes.some(([r])=>r===section));}
export function SectionTabs({section}){const tr=useT(),group=groupFor(section);if(!group||group.routes.length<2)return null;return <nav className="section-tabs" aria-label={tr(group.title)+' sections'}>{group.routes.map(([path,label])=><a key={path} href={'#/'+path} aria-current={section===path?'page':undefined}>{tr(label)}</a>)}</nav>;}

