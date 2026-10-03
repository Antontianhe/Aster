import { useT } from "../../i18n.jsx";
import React, { useState } from 'react';
import { FlaskConical, MessageCircle, Network, Shield, LineChart, Timer, History, PenTool, Users, ArrowUpRight, ArrowRight, ScanSearch } from 'lucide-react';
import { PageHeading, Modal, Button } from '../UI.jsx';
import { ReviewBoundary } from '../neon/ReviewBoundary.jsx';
import { useApp } from '../../context.jsx';
import { COURSES, SUBJECT_ORDER } from '../../study.js';
import { TeachStudent, RepairAnswer } from './TeachAndRepair.jsx';
import { TopicPlayground } from './TopicPlayground.jsx';
import { ExamBoss } from './ExamBoss.jsx';
import { CooperativeQuest } from './CooperativeQuest.jsx';
import { SessionPlanner } from './SessionPlanner.jsx';
import { PastSelf } from './PastSelf.jsx';
import { KnowledgeProgress } from './KnowledgeProgress.jsx';
import w from '../workspace/Workspace.module.css';
import s from './StudyLab.module.css';
const TOOLS = [{
  id: 'teach',
  title: 'Teach the AI',
  tag: 'EXPLAIN TO UNDERSTAND',
  text: 'Teach Blue, a scripted student who asks follow-ups and makes deliberate mistakes for you to catch.',
  icon: MessageCircle,
  color: '#ab8ed9',
  action: 'Take the teacher’s seat'
}, {
  id: 'detective',
  title: 'Mistake detective',
  tag: 'FIND THE REASON',
  text: 'Diagnose a wrong answer, work through a targeted follow-up, and keep the explanation for your next attempt.',
  icon: ScanSearch,
  color: '#dfad8b',
  action: 'Start a diagnostic review'
}, {
  id: 'knowledge',
  title: 'Knowledge map',
  tag: 'SEE WHAT NEEDS A CHECK',
  text: 'Explore current course questions, previous attempts, self-rated explanations, and your next challenge.',
  icon: Network,
  color: '#8acbcd',
  action: 'Explore your understanding'
}, {
  id: 'boss',
  title: 'Exam boss battles',
  tag: 'COMBINE YOUR SKILLS',
  text: 'Take on a larger challenge with calculation, interpretation, and writing. Choose timed or untimed practice.',
  icon: Shield,
  color: '#daa0c8',
  action: 'Choose a mixed-skill challenge'
}, {
  id: 'playground',
  title: 'Topic playground',
  tag: 'PREDICT. CHANGE. INVESTIGATE.',
  text: 'Move the coefficients of a quadratic, watch its graph respond, and test a prediction before revealing it.',
  icon: LineChart,
  color: '#9ebbf1',
  action: 'Explore a live graph'
}, {
  id: 'plan',
  title: 'I have 12 minutes',
  tag: 'A FINISHABLE SESSION',
  text: 'Set your available time, subject, and energy. Get a small plan that includes practice and reflection.',
  icon: Timer,
  color: '#a2d2b2',
  action: 'Make the time count'
}, {
  id: 'past',
  title: 'Beat your past self',
  tag: 'CONFIDENCE + ACCURACY',
  text: 'Compare your own reasoning, confidence, hint use, and answers across repeated attempts.',
  icon: History,
  color: '#c4a0e7',
  action: 'Look at your learning record'
}, {
  id: 'repair',
  title: 'Repair the answer',
  tag: 'MAKE THE THINKING STRONGER',
  text: 'Find the flaw in a solution or paragraph, improve it, and compare against transparent criteria.',
  icon: PenTool,
  color: '#ddb794',
  action: 'Fix a flawed response'
}, {
  id: 'cooperative',
  title: 'Cooperative quests',
  tag: 'TWO PEOPLE. SHARED REASONING.',
  text: 'Each partner sees different evidence. Explain it to each other, then make a supported conclusion together.',
  icon: Users,
  color: '#83c8d5',
  action: 'Start a pass-and-play quest'
}];
export default function StudyLab() {
  const tr = useT();
  const {
    learning,
    setReview,
    setReviewQuestion
  } = useApp();
  const [active, setActive] = useState(null),
    [exit, setExit] = useState(false);
  const tool = TOOLS.find(t => t.id === active);
  const close = () => {
    setActive(null);
    setExit(false);
  };
  function open(id) {
    if (id === 'detective') {
      setReviewQuestion(null);
      setReview('maths');
    } else setActive(id);
  }
  return <><PageHeading eyebrow={tr("THINK DEEPER. LEARN WITH INTENTION.")} title={tr("The study lab.")} description={tr("A place to explain, investigate, make mistakes, and turn them into better understanding.")} /><div className={w.pageHero}><div><span className={w.kicker}>{tr("YOUR THINKING IS THE MAIN EVENT")}</span><h2>{tr("Beyond remembering")}<br />{tr("the right answer.")}</h2><p>{tr("Explore ideas from different angles. Your confidence and explanations help you decide what deserves another look.")}</p><span className={w.pill}>{tr(learning.sessions.length)}{tr(" lab sessions · ")}{tr(learning.attempts.length)}{tr(" recorded question attempts")}</span></div><div className={w.heroIcon}><FlaskConical size={55} /></div></div><div className={s.labGrid}>{tr(TOOLS.map(item => {
        const Icon = item.icon;
        return <button key={item.id} className={s.labCard} style={{
          '--lab-color': item.color
        }} onClick={() => open(item.id)}><Icon size={28} /><span>{tr(item.tag)}</span><h3>{tr(item.title)}</h3><p>{tr(item.text)}</p><small>{tr(item.action)}<ArrowUpRight size={16} /></small></button>;
      }))}</div><div className={w.notice}><span>{tr("Confidence checks and mistake diagnosis are part of every quick-recall review. Blue uses prepared prompts; written explanations are self-assessed with clear criteria. Study records remain in this browser.")}</span></div>{tr(learning.sessions.length > 0 && <section className={w.studySets}><div className={w.sectionHead}><div><span className={w.kicker}>{tr("YOUR RECENT WORK")}</span><h2>{tr("Learning beyond the score.")}</h2></div></div><div className={w.deckGrid}>{tr(learning.sessions.slice(-6).reverse().map(session => <article className={w.panel} key={session.id}><span className={w.kicker}>{tr(session.kind.toUpperCase())}{tr(" · ")}{tr(new Date(session.at).toLocaleDateString('en-GB'))}</span><h3>{tr(session.title)}</h3><p>{tr(COURSES[session.subject]?.name || 'Personal study')}{tr(" · saved on this device")}</p><SessionDetails session={session} /></article>))}</div></section>)}{tr(tool && <ReviewBoundary key={active} onClose={close}><Modal title={tr(tool.title)} size="large" onClose={() => ['teach', 'repair', 'boss', 'cooperative', 'plan'].includes(active) ? setExit(true) : close()}>{tr(active === 'teach' ? <TeachStudent onClose={close} /> : active === 'repair' ? <RepairAnswer onClose={close} /> : active === 'boss' ? <ExamBoss onClose={close} /> : active === 'cooperative' ? <CooperativeQuest onClose={close} /> : active === 'playground' ? <TopicPlayground /> : active === 'plan' ? <SessionPlanner onClose={close} /> : active === 'past' ? <PastSelf /> : <KnowledgeExplorer />)}</Modal></ReviewBoundary>)}{tr(exit && <Modal title={tr("Return to the study lab?")} size="small" onClose={() => setExit(false)}><div className={w.dialogBody}><p>{tr("Saved records stay available. Any unfinished writing in this activity will be discarded.")}</p><div className={w.actions}><Button variant="secondary" onClick={() => setExit(false)}>{tr("Keep exploring")}</Button><Button onClick={close}>{tr("Return to lab")}</Button></div></div></Modal>)}</>;
}
function KnowledgeExplorer() {
  const tr = useT();
  const [subject, setSubject] = useState('maths');
  const {
    navigate
  } = useApp();
  return <div className={s.labBody}><span className={s.eyebrow}>{tr("CURRENT COURSE KNOWLEDGE")}</span><label>{tr("Subject")}<select value={subject} onChange={e => setSubject(e.target.value)}>{tr(SUBJECT_ORDER.filter(id => COURSES[id].questions.length).map(id => <option key={id} value={id}>{tr(COURSES[id].name)}</option>))}</select></label><h2>{tr(COURSES[subject].title)}</h2><p>{tr("Your current unit’s practice questions form this map. It is not a complete future IGCSE or IB syllabus.")}</p><KnowledgeProgress key={subject} subject={subject} /></div>;
}
function SessionDetails({
  session
}) {
  const tr = useT();
  return <details className={s.history}><summary>{tr("Read saved work")}</summary>{tr(session.responses?.map((r, i) => <p key={i}><strong>{tr(r.prompt)}</strong><span>{tr(r.answer)}</span><span>{tr(r.criteria?.length || 0)}{tr(" / ")}{tr(r.availableCriteria)}{tr(" self-checks")}</span></p>))}{tr((session.answer || session.writing || session.reflection || session.reason) && <p>{tr(session.answer || session.writing || session.reflection || session.reason)}</p>)}{tr(Number.isFinite(session.score) && <p>{tr(session.score)}{tr(" / ")}{tr(session.total)}{tr(" objective checks correct")}</p>)}{tr(session.kind === 'playground' && <p>{tr("Prediction: ")}{tr({
        up: 'up by 2',
        down: 'down by 2',
        wide: 'wider'
      }[session.choice] || 'not recorded')}{tr(". ")}{tr(session.correct ? 'Correct prediction.' : 'Revisit vertical translations.')}</p>)}{tr(session.criteria && <p>{tr(session.criteria.length)}{tr(" / ")}{tr(session.availableCriteria)}{tr(" criteria self-assessed")}</p>)}{tr(session.kind === 'plan' && <p>{tr(session.minutes)}{tr(" minutes · ")}{tr(session.energy)}{tr(" energy · completed plan")}</p>)}</details>;
}
