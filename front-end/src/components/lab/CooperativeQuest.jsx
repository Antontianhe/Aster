import { useT } from "../../i18n.jsx";
import React, { useRef, useState } from 'react';
import { Users, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context.jsx';
import { Button } from '../UI.jsx';
import { PopulationChart } from './ExamBoss.jsx';
import { Rubric, SessionSaved } from './TeachAndRepair.jsx';
import s from './StudyLab.module.css';
import b from './Boss.module.css';
export function CooperativeQuest({
  onClose
}) {
  const tr = useT();
  const {
    saveLabSession,
    playTone
  } = useApp();
  const [phase, setPhase] = useState('intro'),
    [visible, setVisible] = useState(false),
    [choice, setChoice] = useState(null),
    [reason, setReason] = useState(''),
    [checked, setChecked] = useState(false),
    [checks, setChecks] = useState([]),
    [done, setDone] = useState(false);
  const saved = useRef(false);
  function save() {
    if (saved.current) return;
    saved.current = true;
    saveLabSession({
      kind: 'cooperative',
      title: 'Riverton planning council',
      subject: 'social',
      choice,
      correct: choice === 0,
      reason,
      criteria: checks,
      availableCriteria: 2
    });
    setDone(true);
  }
  if (done) return <SessionSaved title={tr("Two perspectives. One explanation.")} onClose={onClose}>{tr("Your shared conclusion is saved on this device. Each partner should be able to explain the other partner’s evidence.")}</SessionSaved>;
  return <div className={s.labBody}><span className={s.eyebrow}>{tr("COOPERATIVE STUDY QUEST · SAME-DEVICE MODE")}</span><h2>{tr("Riverton planning council")}</h2><p>{tr("Two people hold different evidence. Read your card privately, hide it, and explain it to your partner. This is local pass-and-play, with no online room or messaging.")}</p>{tr(phase === 'intro' ? <div className={b.coopPass}><Users size={35} /><h3>{tr("Start with Partner A.")}</h3><p>{tr("Partner A receives the population chart. Partner B receives the school-capacity table. Use both to decide what the council can reasonably conclude.")}</p><Button onClick={() => {
        setPhase('a');
        setVisible(false);
      }}>{tr("Hand the device to Partner A ")}<ArrowRight size={15} /></Button></div> : phase === 'a' || phase === 'b' ? <><span className={b.partnerBadge}>{tr("PARTNER ")}{tr(phase.toUpperCase())}{tr(" · PRIVATE PRACTICE CARD")}</span>{tr(visible ? <>{tr(phase === 'a' ? <><PopulationChart /><p className={s.small}>{tr("Explain the age structure to your partner. In particular, note the share of residents under 15. All values are fictional.")}</p></> : <><table className={b.coopTable}><tbody>{tr([['Total population', '120,000'], ['Residents aged 5–14', '18,000'], ['School places for ages 5–14', '16,000'], ['Period', 'Same year as Partner A’s chart']].map(([label, value]) => <tr key={label}><th>{tr(label)}</th><td>{tr(value)}</td></tr>))}</tbody></table><p className={s.small}>{tr("These are fictional planning figures. Explain the difference between the broad under-15 group and the narrower 5–14 group.")}</p></>)}<Button variant="secondary" onClick={() => setVisible(false)}><EyeOff size={16} />{tr("Hide my evidence")}</Button></> : <div className={b.coopPass}><EyeOff size={30} /><h3>{tr("Evidence hidden.")}</h3><p>{tr("Only Partner ")}{tr(phase.toUpperCase())}{tr(" should look before explaining it.")}</p><Button onClick={() => setVisible(true)}><Eye size={16} />{tr("Reveal Partner ")}{tr(phase.toUpperCase())}{tr("’s card")}</Button></div>)}<div className={s.labActions}><Button disabled={visible} onClick={() => {
          setPhase(phase === 'a' ? 'b' : 'together');
          setVisible(false);
        }}>{tr(phase === 'a' ? 'Pass to Partner B' : 'Work together')}<ArrowRight size={16} /></Button></div></> : <div className={b.coopShared}><h3>{tr("Which conclusion uses both pieces of evidence responsibly?")}</h3><div className={s.choiceButtons}>{tr(['Investigate a possible 2,000-place shortfall for ages 5–14; the broad chart also shows a substantial young population.', 'Build 42,000 school places because every person under 15 needs the same school provision.', 'Close schools because older residents make up only 5% of the population.'].map((text, i) => <button disabled={checked} key={text} aria-pressed={choice === i} onClick={() => setChoice(i)}>{tr(text)}</button>))}</div><label>{tr("Your shared reasoning")}<textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={2000} placeholder={tr("Explain which evidence came from each partner and how it supports the conclusion…")} disabled={checked} /></label>{tr(!checked ? <div className={s.labActions}><Button disabled={choice === null || !reason.trim()} onClick={() => {
          setChecked(true);
          playTone(choice === 0);
        }}>{tr("Check the shared conclusion ")}<ArrowRight size={16} /></Button></div> : <><div className={s.modelAnswer}><span>{tr(choice === 0 ? 'SUPPORTED CONCLUSION' : 'COMPARE THE EVIDENCE AGAIN')}</span><p>{tr("18,000 residents aged 5–14 minus 16,000 places suggests a potential 2,000-place gap. The 35% under-15 group includes younger children, so it cannot be treated as the number needing those school places. Investigate enrolment and existing provision before deciding what to build.")}</p></div><Rubric criteria={['I can explain my partner’s evidence.', 'We distinguished a supported inference from a definite construction decision.']} value={checks} onChange={setChecks} /><div className={s.labActions}><Button onClick={save}>{tr("Save cooperative quest ")}<CheckCircle2 size={16} /></Button></div></>)}</div>)}</div>;
}
