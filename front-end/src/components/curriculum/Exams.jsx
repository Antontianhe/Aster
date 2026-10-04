import React from 'react';
import {FileText,Camera} from 'lucide-react';
import {useApp} from '../../context.jsx';
import {useT} from '../../i18n.jsx';
import MockExams from './MockExams.jsx';
import ExamCoach from './ExamCoach.jsx';
import s from './Exams.module.css';
export default function Exams(){
  const {route}=useApp(),tr=useT();
  const corrections=route.path==='exam-coach'||route.query.get('tab')==='corrections';
  return <><nav className={s.tabs} aria-label={tr('Exam sections')}>
    <a href="#/exams" aria-current={!corrections?'page':undefined}><FileText size={19}/><span><strong>{tr('Mock exams')}</strong><small>{tr('Prepare before your exam')}</small></span></a>
    <a href="#/exams?tab=corrections" aria-current={corrections?'page':undefined}><Camera size={19}/><span><strong>{tr('Corrections')}</strong><small>{tr('Upload photos & fix mistakes')}</small></span></a>
  </nav>{corrections?<ExamCoach/>:<MockExams/>}</>;
}
