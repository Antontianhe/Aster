import React from 'react';
import {Home,GraduationCap,CalendarDays,LibraryBig,Heart,MessagesSquare} from 'lucide-react';
import {useT} from '../../i18n.jsx';
export const NAV_GROUPS=[
 {title:'Today',icon:Home,home:'overview',routes:[['overview','Today'],['headlines','World news'],['focus','Focus room']]},
 {title:'Learn',icon:GraduationCap,home:'subjects',routes:[['subjects','My subjects'],['curriculum','IGCSE & IB'],['comprehension','English practice'],['path','Learning path'],['practice','Quick review'],['revision','Revision centre'],['exams','Mock exams'],['exam-coach','Exam Coach'],['lab','Study lab'],['competitions','Competitions'],['roadmap','Study roadmap']]},
 {title:'School & planner',icon:CalendarDays,home:'planner',routes:[['planner','My planner'],['homework','Homework'],['board','Task board'],['school','Grades & school']]},
 {title:'Library',icon:LibraryBig,home:'books',routes:[['books','Book library'],['resources','Course resources'],['research','Research desk'],['writing','Writing studio']]},
 {title:'Buddy & play',icon:Heart,home:'buddy',routes:[['buddy','My buddy'],['arcade','Game room'],['helper','AI helper']]},
 {title:'Community',icon:MessagesSquare,home:'community',routes:[['community','Student lounge']]}
];
export function groupFor(section){return NAV_GROUPS.find(g=>g.routes.some(([r])=>r===section));}
export function SectionTabs({section}){const tr=useT(),group=groupFor(section);if(!group||group.routes.length<2)return null;return <nav className="section-tabs" aria-label={tr(group.title)+' sections'}>{group.routes.map(([path,label])=><a key={path} href={'#/'+path} aria-current={section===path?'page':undefined}>{tr(label)}</a>)}</nav>;}
