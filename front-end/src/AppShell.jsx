import {learningMultiplier} from './activityRewards.js';
import {ProfilePortrait} from './components/buddy/CharacterAvatar.jsx';
import PublicPages from './components/home/PublicPages.jsx';
import { changeTaskStatus, taskStatus } from './taskBoard.js';
import { REVISION_KEY, NOTEBOOK_KEY, normalizeSchedule, seedSchedule, scheduleAttempt } from './revision.js';
import {useEconomy} from './hooks/useEconomy.js';
import Dashboard from './components/home/Dashboard.jsx';
import CelebrationBackground from './components/home/CelebrationBackground.jsx';
import Landing,{PublicHeader,PublicFooter} from './components/home/Landing.jsx';
import {NAV_GROUPS,groupFor,SectionTabs} from './components/home/Navigation.jsx';
import Membership,{ProGate,FREE_ROUTES} from './components/account/Membership.jsx';
import {CookieConsent,LegalPage,DataPrivacy,OwnerInsights} from './components/account/Legal.jsx';
import {storage} from './storage.js';
import {LanguageSelector} from "./i18n.jsx";
import AuthPage,{AccountStatus,useAuth} from "./auth.jsx";
import {AppearanceSettings,ExperienceSwitch,ExperienceSettings} from "./appearance.jsx";
import {FileText} from 'lucide-react';
import { useT } from "./i18n.jsx";
import { LEARNING_KEY, normalizeLearning } from './learning.js';
import React, { useCallback, useEffect, useMemo, useRef, useState, useReducer, lazy, Suspense } from 'react';
import { Home, LayoutGrid, CalendarDays, BookOpen, Layers3, Timer, Search, Bell, Settings, ArrowUpRight, ChevronRight, Plus, X, Check, School, ArrowRight, Command, Bookmark, LogOut, HelpCircle, Download, Sun, Moon, Volume2, CheckCircle2, ExternalLink, Clock3, Menu, Target, Trash2, Heart, Sparkles, Pin, Route, Globe2, Gamepad2, MoreHorizontal, LibraryBig, FlaskConical, MessagesSquare, GraduationCap } from 'lucide-react';
import { AppContext } from './context.jsx';
import { COURSES, SUBJECT_ORDER, RESOURCES, SUBJECT_META, PROGRESS_KEY, PREFS_KEY, SESSIONS_KEY, BOOKMARKS_KEY, DEFAULT_PREFS, loadProgress, readStored, finishReview, dayKey, minutesLabel } from './study.js';
import { HOMEWORK_KEY, loadHomework, sortHomework, dueLabel, dueTimestamp, reminderLabel, isReminderDue, reminderKey, downloadCalendar } from './homework.js';
import { SCHOOL } from './schoolData.js';
import { Overview, Homework, Practice } from './components/Pages.jsx';
import {ConnectedSubjects as Subjects,ConnectedSubject as SubjectPage} from './components/school/SubjectWorkspace.jsx';
import Planner from './components/school/ConnectedPlanner.jsx';
import {SchoolResources as Library} from './components/school/SchoolConnection.jsx';
import { Quiz, Flashcards, FocusRoom } from './components/StudyTools.jsx';
import { Blue, Button, Modal, PageHeading, ColorIcon, SubjectTag, External, TaskEditor, Progress, Empty } from './components/UI.jsx';
import { useApp } from './context.jsx';
import { NeonOverview } from './components/neon/NeonOverview.jsx';
import { ReviewBoundary } from './components/neon/ReviewBoundary.jsx';
import { MatchGame } from './components/neon/MatchGame.jsx';
import { RewardBurst } from './components/neon/RewardBurst.jsx';
import { progressReducer, completePathStage, lessonUnlocked, tierFor } from './progression.js';
import { STUDY_SETS_KEY, loadStudySets } from './studySets.js';
import { useStudyAudio } from './hooks/useStudyAudio.js';
const SchoolHub=lazy(()=>import('./components/school/ConnectedSchoolHub.jsx'));
const Competitions=lazy(()=>import('./components/school/CompetitionHub.jsx'));
const Celebrations=lazy(()=>import('./components/home/Celebrations.jsx'));
const Profile=lazy(()=>import('./components/account/Profile.jsx'));
const BuddyGarden=lazy(()=>import('./components/buddy/BuddyGarden.jsx'));
const BuddyHelper=lazy(()=>import('./components/buddy/BuddyGarden.jsx').then(m=>({default:m.BuddyHelper})));
const StudyLab = lazy(() => import('./components/lab/StudyLab.jsx'));
const Books = lazy(() => import('./components/workspace/Books.jsx'));
const Headlines = lazy(() => import('./components/workspace/Headlines.jsx'));
const Roadmap = lazy(() => import('./components/workspace/Roadmap.jsx'));
const Arcade = lazy(() => import('./components/workspace/Arcade.jsx'));
const Exams=lazy(()=>import('./components/curriculum/Exams.jsx'));
const ConversationRoom=lazy(()=>import('./components/activities/ConversationRoom.jsx'));
const DailyClaw=lazy(()=>import('./components/activities/DailyClaw.jsx'));
const MathSprint=lazy(()=>import('./components/activities/MathSprint.jsx'));
const Science=lazy(()=>import('./components/workspace/Science.jsx'));
const Community=lazy(()=>import('./components/community/Community.jsx'));
const ResearchDesk=lazy(()=>import('./components/workspace/ResearchDesk.jsx'));
const TaskBoard=lazy(()=>import('./components/essentials/TaskBoard.jsx'));
const BackupRecovery=lazy(()=>import('./components/essentials/BackupRecovery.jsx'));
const RevisionCentre=lazy(()=>import('./components/revision/RevisionCentre.jsx'));
const Comprehension=lazy(()=>import('./components/curriculum/Comprehension.jsx'));
const WritingStudio=lazy(()=>import('./components/workspace/WritingStudio.jsx'));

const Curriculum=lazy(()=>import('./components/curriculum/Curriculum.jsx'));
const nav = [['board','Task board',CalendarDays],['backup','Backup & recovery',Download],['overview','Today',Home],['path','Learning path',Route],['subjects','My subjects',LayoutGrid],['curriculum','IGCSE & IB',GraduationCap],['exams','Exams',FileText],['science','Science',FlaskConical],['oral','Speaking room',MessagesSquare],['debate','Speaking room · Debate',MessagesSquare],['claw','Daily claw',Sparkles],['math-game','Number stage',Gamepad2],['writing','Writing studio',FileText],['research','Research desk',Search],['comprehension','English reading room',BookOpen],['homework','Homework',CalendarDays],['planner','My planner',CalendarDays],['school','School hub',School],['practice','Quick review',Layers3],['revision','Revision centre',Target],['lab','Study lab',FlaskConical],['helper','Ask your buddy',Sparkles],['community','Student lounge',MessagesSquare],['competitions','Competitions',Target],['resources','Resource shelf',BookOpen],['books','Book library',LibraryBig],['roadmap','Road to IGCSE & IB',Route],['buddy','Buddy garden',Heart],['headlines','Headlines & weather',Globe2],['arcade','Study arcade',Gamepad2]];
function getRoute() {
  const raw = window.location.hash.slice(2) || 'overview';
  let [path, query = ''] = raw.split('?');
  const params=new URLSearchParams(query);
  if(path==='path'){path='subjects';params.set('view','path');}
  if(path==='comprehension'){path='subjects/english';params.set('tab','english');}
  if(path==='practice'){path='subjects/'+(COURSES[params.get('subject')]?params.get('subject'):'maths');params.set('tab','practice');}
  if(path==='revision'){path='subjects/'+(COURSES[params.get('subject')]?params.get('subject'):'maths');if(params.has('tab'))params.set('reviewtab',params.get('tab'));params.set('tab','revision');}
  if(path==='exams'||path==='exam-coach'){params.set('view',path==='exam-coach'||params.get('tab')==='corrections'?'photos':'exams');path='planner';}
  return {
    path,
    query: params
  };
}
function safePrefs() {
  const value = readStored(PREFS_KEY, {});
  return {
    ...DEFAULT_PREFS,
    ...(value && typeof value === 'object' ? value : {}),
    name: typeof value?.name === 'string' && value.name.trim() ? value.name.slice(0, 30) : 'Anton',
    pinned: Array.isArray(value?.pinned) ? value.pinned.filter(id => COURSES[id]) : DEFAULT_PREFS.pinned,
    theme: value?.theme === 'dark' ? 'dark' : 'light',
    sound: value?.sound === true,
    reduceMotion: value?.reduceMotion === true,
    dailyGoal: [15, 25, 50, 90].includes(value?.dailyGoal) ? value.dailyGoal : 25
  };
}
function safeHistory() {
  const value = readStored(SESSIONS_KEY, []);
  return Array.isArray(value) ? value.filter(s => s && ['focus', 'review'].includes(s.kind) && Number.isFinite(Date.parse(s.finishedAt)) && Number.isFinite(s.minutes) && s.minutes >= 0).slice(-500) : [];
}
function safeFocus() {
  const saved = readStored('dinostudy-focus-v3', null);
  return saved && Number.isFinite(saved.duration) && saved.duration > 0 && saved.duration <= 7200 && Number.isFinite(saved.remaining) ? {
    ...saved,
    running: Boolean(saved.running && Number.isFinite(saved.endsAt)),
    id: saved.id || crypto.randomUUID()
  } : {
    id: crypto.randomUUID(),
    duration: 1500,
    remaining: 1500,
    running: false,
    endsAt: null,
    task: ''
  };
}
export default function App() {
  const tr = useT();
  const {user}=useAuth();
  const [demo,setDemo]=useState(()=>{try{return sessionStorage.getItem('aster-demo-entry')==='true'}catch{return false}});
  const [route, setRoute] = useState(getRoute),
    [progress, dispatchProgress] = useReducer(progressReducer, undefined, loadProgress),
    [homework, setHomework] = useState(loadHomework),
    [prefs, setPrefs] = useState(()=>{const p=safePrefs();return user&&!readStored(PREFS_KEY,null)?{...p,name:user.name}:p;}),
    [sessionHistory, setSessionHistory] = useState(safeHistory),
    [bookmarks, setBookmarks] = useState(() => {
      const v = readStored(BOOKMARKS_KEY, []);
      return Array.isArray(v) ? v.filter(id => RESOURCES.some(r => r.id === id)) : [];
    }),
    [focus, setFocus] = useState(safeFocus);
  const economy=useEconomy(progress,prefs,setPrefs);
  const [now, setNow] = useState(Date.now()),
    [dialog, setDialog] = useState(null),
    [review, setReview] = useState(null),
    [cards, setCards] = useState(null),
    [toast, setToast] = useState(null),
    [mobileMenu, setMobileMenu] = useState(false),
    [notificationPermission, setNotificationPermission] = useState(() => typeof Notification === 'undefined' ? 'unavailable' : Notification.permission);
  const setProgress = useCallback(update => dispatchProgress({
    type: 'update',
    update
  }), []);
  const [studySets, setStudySets] = useState(loadStudySets);
  const [revisionSchedule, setRevisionSchedule] = useState(() => {
    const saved = readStored(REVISION_KEY, null);
    return saved ? normalizeSchedule(saved) : seedSchedule(normalizeLearning(readStored(LEARNING_KEY, {})).attempts);
  });
  const [reviewBatch, setReviewBatch] = useState(null);
  const [learning, setLearning] = useState(() => normalizeLearning(readStored(LEARNING_KEY, {}))),
    [reviewQuestion, setReviewQuestion] = useState(null);
  const logAttempt = useCallback(data => {
    const id = crypto.randomUUID();
    const timestamp = Date.now(), at = new Date(timestamp).toISOString();
    setNow(timestamp);
    setRevisionSchedule(schedule => scheduleAttempt(schedule, { ...data, at }));
    setLearning(v => ({
      ...v,
      attempts: [...v.attempts, {
        ...data,
        id,
        at
      }].slice(-500)
    }));
    return id;
  }, []);
  const updateAttempt = useCallback((id, changes) => setLearning(v => ({
    ...v,
    attempts: v.attempts.map(a => a.id === id ? {
      ...a,
      ...changes
    } : a)
  })), []);
  const saveLabSession = useCallback(data => setLearning(v => ({
    ...v,
    sessions: [...v.sessions, {
      ...data,
      id: crypto.randomUUID(),
      at: new Date().toISOString()
    }].slice(-200)
  })), []);
  const [activity, setActivity] = useState(null),
    [match, setMatch] = useState(null),
    [reward, setReward] = useState(null);
  const playSound = useStudyAudio(prefs.sound);
  const toastTimer = useRef(),
    notified = useRef(new Set()),
    focusCompleted = useRef(new Set());
  const notify = useCallback((message, action = null) => {
    setToast({
      message,
      action
    });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6500);
  }, []);
  const navigate = useCallback(path => {
    window.location.hash = '/' + path;
    setMobileMenu(false);
  }, []);
  useEffect(() => {
    function update() {
      setRoute(getRoute());
      window.scrollTo({
        top: 0,
        behavior: 'instant'
      });
    }
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), focus.running ? 1000 : 30000);
    return () => clearInterval(timer);
  }, [focus.running]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  useEffect(() => {
    document.documentElement.dataset.theme = prefs.theme;
    document.documentElement.dataset.visual = 'aurora';
    document.documentElement.dataset.experience = prefs.experience==='studio'?'studio':'aurora';
    document.documentElement.dataset.accent = ['ocean','violet','rose','forest','amber'].includes(prefs.accent)?prefs.accent:'ocean';
    document.documentElement.dataset.density = prefs.density==='compact'?'compact':'comfortable';
    document.documentElement.dataset.motion = prefs.reduceMotion ? 'calm' : 'full';
  }, [prefs.theme, prefs.reduceMotion,prefs.accent,prefs.density,prefs.experience]);
  useEffect(() => {
    document.title = `${nav.find(n => route.path.startsWith(n[0]))?.[1] || {
      focus: 'Focus room',
      research:'Research desk',writing:'Writing studio',comprehension:'English reading room','exam-coach':'Exam Coach',about:'About Aster',features:'Features',contact:'Contact',welcome:'Welcome',pro:'Membership',data:'Privacy & your data',owner:'Owner insights',terms:'Terms & conditions',privacy:'Privacy notice',profile:'Your profile',science:'Science',celebrations:'Celebrations',exams:'Exams',settings: 'Preferences', signup: 'Create account', login: 'Sign in', account: 'Your account'
    }[route.path] || 'My study space'} · Aster`;
  }, [route.path]);
  useEffect(() => {
    try {
      storage.setItem(REVISION_KEY, JSON.stringify(revisionSchedule));
      storage.setItem(LEARNING_KEY, JSON.stringify(learning));
      storage.setItem(STUDY_SETS_KEY, JSON.stringify(studySets));
      storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      storage.setItem(HOMEWORK_KEY, JSON.stringify(homework));
      storage.setItem(PREFS_KEY, JSON.stringify(prefs));
      storage.setItem(SESSIONS_KEY, JSON.stringify(sessionHistory));
      storage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      storage.setItem('dinostudy-focus-v3', JSON.stringify(focus));
    } catch {
      notify('This browser could not save your latest changes. Keep the page open and export a backup.');
    }
  }, [progress, homework, prefs, sessionHistory, bookmarks, focus, studySets, learning, revisionSchedule, notify]);
  useEffect(() => {
    function key(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setDialog(d => d?.type === 'search' ? null : {
          type: 'search'
        });
      }
    }
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  useEffect(() => {
    const due = homework.filter(t => isReminderDue(t, now) && !notified.current.has(reminderKey(t)));
    if (!due.length) return;
    due.forEach(t => notified.current.add(reminderKey(t)));
    const message = due.length === 1 ? `${COURSES[due[0].course].name}: ${due[0].title} — ${dueLabel(due[0].due, new Date(now), due[0].allDay)}` : `${due.length} homework reminders are ready.`;
    notify(message, {
      label: 'View',
      run: () => navigate('homework')
    });
    if (notificationPermission === 'granted') try {
      new Notification('Aster homework reminder', {
        body: message,
        icon: '/favicon.svg',
        tag: 'dinostudy-homework'
      });
    } catch {}
  }, [homework, now, notify, navigate, notificationPermission]);
  const playTone = useCallback(correct => playSound(correct ? 'correct' : 'error'), [playSound]);
  const finishFocus = useCallback(() => {
    if (!focus.running || focusCompleted.current.has(focus.id)) return;
    focusCompleted.current.add(focus.id);
    const minutes = Math.round(focus.duration / 60),
      finishedAt = new Date().toISOString();
    setFocus(f => ({
      ...f,
      running: false,
      remaining: 0,
      endsAt: null,
      id: crypto.randomUUID(),
      finishedAt
    }));
    setProgress(p => ({
      ...p,
      focusMinutes: p.focusMinutes + minutes
    }));
    setSessionHistory(list => [...list, {
      id: crypto.randomUUID(),
      kind: 'focus',
      minutes,
      task: focus.task,
      finishedAt
    }].slice(-500));
    notify(`${minutes} minutes of focus. Session complete. Make time for a break.`);
    playTone(true);
  }, [focus, prefs.sound, notify]);
  useEffect(() => {
    if (focus.running && focus.endsAt <= now) finishFocus();
  }, [now, focus.running, focus.endsAt, finishFocus]);
  function toggleTask(id) {
    const task = homework.find(t => t.id === id);
    if (!task) return;
    setHomework(list => changeTaskStatus(list, id, task.done ? 'todo' : 'done'));
    if (!task.done) {
      playTone(true);
      notify('Task completed.', {
        label: 'Undo',
        run: () => setHomework(list => changeTaskStatus(list, id, taskStatus(task)))
      });
    }
  }
  function saveTask(item) {
    setHomework(list => list.some(t => t.id === item.id) ? list.map(t => t.id === item.id ? item : t) : [...list, item]);
    setDialog(null);
    notify('Task saved.');
  }
  function removeTask(id) {
    const item = homework.find(t => t.id === id);
    if (!item || !id.startsWith('local-')) return;
    setHomework(list => list.filter(t => t.id !== id));
    setDialog(null);
    notify('Personal task removed.', {
      label: 'Undo',
      run: () => setHomework(list => list.some(t => t.id === id) ? list : [...list, item])
    });
  }
  function updateChecklist(id, index) {
    setHomework(list => list.map(t => t.id === id ? {
      ...t,
      checks: t.checks?.includes(index) ? t.checks.filter(i => i !== index) : [...(t.checks || []), index]
    } : t));
  }
  function toggleBookmark(id) {
    setBookmarks(list => list.includes(id) ? list.filter(v => v !== id) : [...list, id]);
  }
  const openLesson = useCallback((subject, stage) => {
    if (!COURSES[subject]?.questions.length || !Number.isInteger(stage) || stage < 0 || stage > 4 || !lessonUnlocked(progress.paths?.[subject] || [], stage)) return;
    setActivity({
      subject,
      stage
    });
    playSound('click');
    if (stage === 0 || stage === 3) setCards(subject);else if (stage === 2) setMatch(subject);else setReview(subject);
  }, [progress.paths, playSound]);
  const completeCards = useCallback(subject => {
    if (activity?.subject === subject && (activity.stage === 0 || activity.stage === 3)) {
      dispatchProgress({
        type: 'complete-stage',
        subject,
        stage: activity.stage
      });
      setReward({
        id: crypto.randomUUID(),
        tier: null
      });
      playSound('reward');
    }
  }, [activity, playSound]);
  function recordReview(id, score, total, minutes, mode = 'review') {
    const before = tierFor(progress.xp),
      after = tierFor(progress.xp + score * 5),
      newTier = before.name !== after.name ? after.name : null;
    setProgress(p => {
      let next = finishReview({
        ...p,
        course: id
      }, id, score, total);
      if(learningMultiplier(prefs,dayKey())===2) next.gems += Math.max(0,score)*2;
      if (mode !== 'review') next.bestScores = p.bestScores;
      if (activity?.subject === id && score / total >= .6 && (mode === 'match' && activity.stage === 2 || mode === 'review' && [1, 4].includes(activity.stage))) next = completePathStage(next, id, activity.stage);
      return next;
    });
    setSessionHistory(list => [...list, {
      id: crypto.randomUUID(),
      kind: 'review',
      mode,
      subject: id,
      score,
      total,
      minutes,
      finishedAt: new Date().toISOString()
    }].slice(-500));
    if (score > 0) {
      setReward({
        id: crypto.randomUUID(),
        tier: newTier
      });
      playSound(newTier ? 'level' : 'reward');
    }
  }
  useEffect(() => {
    if (!reward) return;
    const timer = setTimeout(() => setReward(null), 6500);
    return () => clearTimeout(timer);
  }, [reward]);
  function exportCalendar() {
    const tasks = homework.filter(t => !t.done && t.due);
    if (!tasks.length) {
      notify('Add a due date to a task first.');
      return;
    }
    downloadCalendar(tasks);
    notify('Calendar downloaded. Import it in your calendar app to activate the reminders.');
  }
  async function enableNotifications() {
    if (typeof Notification === 'undefined') {
      notify('Notifications aren’t available in this browser. Calendar export still works.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      notify(permission === 'granted' ? 'Browser alerts enabled while Aster is open.' : 'On-page reminders and calendar downloads are still available.');
    } catch {
      notify('Browser alerts could not be enabled. Use calendar export instead.');
    }
  }
  function exportBackup() {
    const value = {
      app: 'Aster',
      version: 4,
      exportedAt: new Date().toISOString(),
      progress,
      homework,
      prefs,
      sessionHistory,
      bookmarks,
      studySets,
      focus,
      learning,
      revisionSchedule,
      notebook: readStored(NOTEBOOK_KEY, []),
      roadmap: readStored('aster-roadmap-v1', []),
      arcade: readStored('aster-arcade-v1', {}),
      reading: readStored('aster-reading-v1', {}),
      curriculum: readStored('aster-curriculum-v1', {}),
      gradebook: readStored('aster-gradebook-v1', []),
      examCoach: readStored('aster-exam-coach-v1', []),
      writing: readStored('aster-writing-studio-v1', []),
      research: readStored('aster-research-v1', []),
      readingPractice: readStored('aster-reading-practice-v1', {}),
      mockExams: readStored('aster-mock-exams-v1', [])
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], {
      type: 'application/json'
    }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `aster-backup-${dayKey()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Your study-space backup has been downloaded.');
  }
  function recordFocus(elapsed,task){const timestamp=Date.now();setNow(timestamp);const minutes=Math.round(elapsed/60000);if(minutes>0){setProgress(p=>({...p,focusMinutes:p.focusMinutes+minutes}));setSessionHistory(list=>[...list,{id:crypto.randomUUID(),kind:'focus',minutes,task,finishedAt:new Date(timestamp).toISOString()}].slice(-500));}notify(minutes>0?`${minutes} minutes saved. Take a moment to recharge.`:'Session finished. Focus minutes are counted after 30 seconds.');}
  const context = {
    ...economy, recordFocus, enterDemo:()=>startDemo(),
    learning,
    revisionSchedule,
    startRevision: (subject, ids) => {
      setReviewQuestion(null);
      setReviewBatch(ids);
      setReview(subject);
    },
    logAttempt,
    updateAttempt,
    saveLabSession,
    setReviewQuestion,
    studySets,
    setStudySets,
    route,
    navigate,
    progress,
    setProgress,
    homework,
    setHomework,
    prefs,
    setPrefs,
    sessionHistory,
    bookmarks,
    toggleBookmark,
    focus,
    setFocus,
    finishFocus,
    now,
    notify,
    setDialog,
    setReview,
    setCards,
    toggleTask,
    saveTask,
    removeTask,
    updateChecklist,
    recordReview,
    exportCalendar,
    notificationPermission,
    enableNotifications,
    exportBackup,
    playTone,
    playSound,
    openLesson,
    completeCards,
    setMatch,
    reward,
    activity
  };

  const section = route.path.split('/')[0],
    pending = homework.filter(t => !t.done),
    dueSoon = pending.filter(t => isReminderDue(t, now));
  useEffect(() => {
    const ctx = document.modelContext;
    if (!ctx?.registerTool) return;
    const abort = new AbortController();
    try {
      Promise.resolve(ctx.registerTool({
        name: 'get_study_overview',
        description: 'Read local study progress and homework counts. Does not access Schoolbox.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        },
        annotations: {
          readOnlyHint: true
        },
        execute: input => {
          if (!input || typeof input !== 'object' || Object.keys(input).length) throw new Error('Use an empty object.');
          return {
            subjects: Object.keys(COURSES).length,
            openTasks: pending.length,
            reviews: progress.sessions,
            focusMinutes: progress.focusMinutes,
            schoolboxSnapshot: SCHOOL.checkedAt
          };
        }
      }, {
        signal: abort.signal
      })).catch(() => {});
    } catch {}
    return () => abort.abort();
  }, [pending.length, progress.sessions, progress.focusMinutes]);
  function startDemo(){try{sessionStorage.setItem('aster-demo-entry','true')}catch{}setDemo(true);navigate('overview')}
  const publicPage=route.path==='welcome'||['terms','privacy','about','features','contact'].includes(section)||(!user&&!demo&&section==='overview');
  const authEntry=['login','signup'].includes(section)||(!user&&!demo&&!publicPage&&section!=='pro');
  if(publicPage||authEntry||(!user&&!demo&&section==='pro'))return <AppContext.Provider value={context}>{route.path==='welcome'||(!user&&!demo&&section==='overview')?<Landing/>:<><PublicHeader/>{authEntry?<AuthPage key={section} signup={section==='signup'} onGuest={startDemo}/>:section==='pro'?<Membership/>:['about','features','contact'].includes(section)?<PublicPages page={section}/>:<LegalPage kind={section}/>}<PublicFooter/></>}<CookieConsent/></AppContext.Provider>;
  return <AppContext.Provider value={context}><CookieConsent/><a className="skip-link" href="#main-content">{tr("Skip to main content")}</a><div onClickCapture={e => {
      if (e.target.closest('button:not(:disabled),a')) playSound('click');
    }} className={`app has-celebration-background ${mobileMenu ? 'menu-open' : ''}`}><CelebrationBackground/><aside className="sidebar"><a className="brand" href="#/overview" aria-label={tr("Aster overview")}><span className="brand-mark aster-mark"><svg width="29" height="29" viewBox="0 0 32 32" aria-hidden="true"><path d="m16 2 3.8 10.2L30 16l-10.2 3.8L16 30l-3.8-10.2L2 16l10.2-3.8z" fill="currentColor" /><circle cx="25.5" cy="6.5" r="2" fill="currentColor" opacity=".5" /></svg></span><span>{tr("aster")}<small>{tr("STUDY, WITH INTENTION")}</small></span></a><span className="nav-caption">{tr("MY STUDY SPACE")}</span><nav aria-label={tr("Main navigation")}>{NAV_GROUPS.map(({home:path,title:label,icon:Icon})=><a key={path} aria-label={tr(label)} title={tr(label)} href={`#/${path}`} onClick={()=>setMobileMenu(false)} className={`nav-link ${['overview','subjects','planner','buddy'].includes(path)?'mobile-primary':'mobile-secondary'} ${groupFor(section)?.home===path?'active':''}`} aria-current={groupFor(section)?.home===path?'page':undefined}><Icon size={20}/><span data-mobile={tr({overview:'Today',subjects:'Learn',planner:'Plan',buddy:'Buddy'}[path]||label)}>{tr(label)}</span></a>)}<button className={`nav-link mobile-more ${!['overview', 'subjects', 'planner', 'buddy'].includes(section) ? 'active' : ''}`} aria-label={tr("More sections")} onClick={() => setDialog({
            type: 'navigation'
          })}><MoreHorizontal size={22} /><span data-mobile={tr("More")}>{tr("More")}</span></button></nav><a href="#/pro" className="sidebar-pro"><Sparkles size={18}/><span><strong>Aster Pro</strong><small>{prefs.proPreview?tr('Preview active'):'€4.99 / '+tr('month')}</small></span><ChevronRight size={17}/></a><div className="sidebar-focus"><span><Timer size={19} />{tr("Focus session")}</span><p>{tr(focus.running ? 'Your focus session is running.' : 'Time set aside for what matters.')}</p><button onClick={() => navigate('focus')}>{tr(focus.running ? `${String(Math.floor(Math.max(0, (focus.endsAt - now) / 1000) / 60)).padStart(2, '0')} min remaining` : 'Enter focus room')}<ArrowUpRight size={15} /></button><span className="sidebar-spark" aria-hidden="true">{tr("✳")}</span></div><div className="sidebar-bottom"><button className="nav-link" aria-label={tr("Preferences")} onClick={() => navigate('settings')}><Settings size={19} /><span>{tr("Preferences")}</span></button><button className="nav-link" aria-label={tr("Help & information")} onClick={() => setDialog({
            type: 'help'
          })}><HelpCircle size={19} /><span>{tr("Help & information")}</span></button><div className="school-account"><span className="school-account-icon"><School size={20} /></span><span><strong>{tr("ISR School")}</strong><small>{tr("Grade 8 · Term 1")}</small></span><External href={SCHOOL.url} aria-label={tr("Open ISR Schoolbox")} /></div></div></aside>{tr(mobileMenu && <button className="sidebar-scrim" aria-label={tr("Close navigation")} onClick={() => setMobileMenu(false)} />)}
 <div className="main-shell"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu-button" aria-label={tr("Open navigation")} aria-expanded={mobileMenu} onClick={() => setMobileMenu(v => !v)}><Menu size={22} /></button><span className="topbar-home"><Home size={15} />{tr(" My space ")}<ChevronRight size={13} /><strong>{tr(nav.find(n => n[0] === section)?.[1] || {
                  research:'Research desk',writing:'Writing studio',comprehension:'English reading room','exam-coach':'Exam Coach',about:'About Aster',features:'Features',contact:'Contact',welcome:'Welcome',pro:'Membership',data:'Privacy & your data',owner:'Owner insights',terms:'Terms & conditions',privacy:'Privacy notice',profile:'Your profile',science:'Science',celebrations:'Celebrations',exams:'Exams',settings: 'Preferences', signup: 'Create account', login: 'Sign in', account: 'Your account',
                  focus: 'Focus room'
                }[section] || 'Overview')}</strong></span></div><div className="topbar-actions"><ExperienceSwitch/><LanguageSelector/><button className="icon-button theme-toggle" aria-label={tr(prefs.theme==='dark'?'Switch to light mode':'Switch to dark mode')} onClick={()=>setPrefs(p=>({...p,theme:p.theme==='dark'?'light':'dark'}))}>{prefs.theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><AccountStatus/><button aria-label={tr("Search your workspace")} className="global-search" onClick={() => setDialog({
              type: 'search'
            })}><Search size={17} /><span>{tr("Search your workspace…")}</span><kbd>{tr("Ctrl K")}</kbd></button><button className="notification-button icon-button" aria-label={tr("Open reminders")} onClick={() => setDialog({
              type: 'notifications'
            })}><Bell size={20} />{tr(dueSoon.length > 0 && <i />)}</button><span className="topbar-divider" /><button className="user-menu" onClick={() => navigate('profile')} aria-label={tr("Open profile preferences")}><span className="avatar" aria-hidden="true"><ProfilePortrait prefs={prefs}/></span><span><strong>{tr(prefs.name)}</strong><small>{tr("Grade 8 · ISR")}</small></span></button></div></header><main className="page-container" id="main-content" tabIndex={-1}><SectionTabs section={section}/><div className="page-enter" key={route.path}><Suspense fallback={<div className="route-loading" role="status" aria-label={tr("Loading your workspace")}><span /><span /><span /></div>}>{tr(route.path==='celebrations'?<Celebrations/>:route.path==='profile'?<Profile settings={<SettingsPage embedded/>}/>:route.path==='pro'?<Membership/>:route.path==='data'?<DataPrivacy/>:route.path==='owner'?<OwnerInsights/>:!prefs.proPreview&&!FREE_ROUTES.has(section)?<ProGate/>:['login','signup','account'].includes(route.path)?<AuthPage key={route.path} signup={route.path==='signup'}/>:route.path==='board'?<TaskBoard/>:route.path==='backup'?<BackupRecovery/>:route.path==='revision'?<ReviewBoundary onClose={()=>navigate('overview')}><RevisionCentre/></ReviewBoundary>:route.path==='research'?<ResearchDesk/>:route.path==='comprehension'?<Comprehension/>:route.path==='writing'?<WritingStudio/>:route.path==='oral'||route.path==='debate'?<ReviewBoundary onClose={()=>navigate('subjects')}><ConversationRoom key={route.path} kind={route.path}/></ReviewBoundary>:route.path==='claw'?<DailyClaw/>:route.path==='math-game'?<ReviewBoundary onClose={()=>navigate('arcade')}><MathSprint/></ReviewBoundary>:route.path==='science'?<Science/>:['exam-coach','exams'].includes(route.path)?<Exams/>:route.path==='community'?<Community/>:route.path==='curriculum'?<Curriculum/>:route.path==='school'?<SchoolHub/>:route.path==='competitions'?<Competitions/>:route.path==='buddy'?<BuddyGarden/>:route.path==='helper'?<BuddyHelper/>:route.path === 'overview' ? <Dashboard /> : route.path === 'path' ? <NeonOverview /> : route.path === 'subjects' ? <Subjects /> : route.path.startsWith('subjects/') ? <SubjectPage id={route.path.split('/')[1]} /> : route.path === 'homework' ? <Homework /> : route.path === 'planner' ? <Planner /> : route.path === 'practice' ? <Practice /> : route.path === 'resources' ? <Library /> : route.path === 'lab' ? <StudyLab /> : route.path === 'books' ? <Books /> : route.path === 'headlines' ? <Headlines /> : route.path === 'roadmap' ? <Roadmap /> : route.path === 'arcade' ? <Arcade /> : route.path === 'focus' ? <FocusRoom /> : route.path === 'settings' ? <SettingsPage /> : <Empty title={tr("Let’s get you back to your space")} action={<Button onClick={() => navigate('overview')}>{tr("Go to overview")}</Button>}>{tr("This page doesn’t exist.")}</Empty>)}</Suspense></div><footer className="page-footer"><span><a href="#/about">{tr("About Aster")}</a> · <a href="#/terms">{tr("Terms")}</a> · <a href="#/privacy">{tr("Privacy")}</a> · <a href="#/data">{tr("Your data")}</a> · <button onClick={()=>window.dispatchEvent(new Event('aster-cookie-settings'))}>{tr("Cookies")}</button></span><span>{tr("Aster ")}<i />{tr("Your study workspace")}</span></footer></main></div></div>
 {tr(review && <ReviewBoundary key={'quiz-' + review} onClose={() => {
      setReviewBatch(null);
      setReview(null);
      setReviewQuestion(null);
      setActivity(null);
    }}><Quiz subject={review} selectedQuestion={reviewQuestion} selectedQuestions={reviewBatch} onClose={() => {
      setReviewBatch(null);
        setReview(null);
        setReviewQuestion(null);
        setActivity(null);
      }} /></ReviewBoundary>)}
 {tr(cards && <ReviewBoundary key={'cards-' + cards} onClose={() => {
      setCards(null);
      setActivity(null);
    }}><Flashcards subject={cards} onClose={() => {
        setCards(null);
        setActivity(null);
      }} /></ReviewBoundary>)}
 {tr(match && <ReviewBoundary key={'match-' + match} onClose={() => {
      setMatch(null);
      setActivity(null);
    }}><MatchGame subject={match} onClose={() => {
        setMatch(null);
        setActivity(null);
      }} /></ReviewBoundary>)}
 <RewardBurst event={reward} calm={prefs.reduceMotion} />
 {tr(reward?.tier && <div className="tier-announcement" role="status"><Sparkles size={30} /><div><span>{tr("NEW TIER UNLOCKED")}</span><strong>{tr(reward.tier)}</strong></div></div>)}
 {tr(dialog?.type === 'task-edit' && <TaskEditor item={homework.find(t => t.id === dialog.id) || (dialog.course ? {
      course: dialog.course
    } : undefined)} defaultDate={dialog.date} onClose={() => setDialog(null)} />)}
 {tr(dialog?.type === 'task-detail' && <TaskDetail id={dialog.id} />)}
 {tr(dialog?.type === 'search' && <SearchDialog />)}
 {tr(dialog?.type === 'navigation' && <Modal title={tr("Explore your workspace")} onClose={() => setDialog(null)}><div className="more-navigation">{tr([...nav, ['profile', 'Your profile', Settings], ['focus', 'Focus room', Timer], ['settings', 'Preferences', Settings]].map(([path, label, Icon]) => <button key={path} onClick={() => {
          navigate(path);
          setDialog(null);
        }}><Icon size={21} /><span>{tr(label)}</span><ChevronRight size={17} /></button>))}</div></Modal>)}
 {tr(dialog?.type === 'note' && <Modal title={tr(COURSES[dialog.subject].notes[dialog.index][0])} onClose={() => setDialog(null)}><div className="note-dialog-body"><SubjectTag id={dialog.subject} /><p>{tr(COURSES[dialog.subject].notes[dialog.index][1])}</p><div className="recall-tip"><Sparkles size={20} /><span><strong>{tr("A little active recall")}</strong>{tr("Look away. How would you explain this idea to a friend?")}</span></div><External href={COURSES[dialog.subject].unitSource || COURSES[dialog.subject].source}>{tr("Original Schoolbox topic")}</External><Button className="full" onClick={() => {
          setCards(dialog.subject);
          setDialog(null);
        }}><Layers3 size={16} />{tr("Try the flashcards")}</Button></div></Modal>)}
 {tr(dialog?.type === 'notifications' && <Modal title={tr("Your reminders")} onClose={() => setDialog(null)}><div className="notification-list"><p>{tr("Reminders and dates from your saved homework.")}</p>{tr(sortHomework(pending.filter(t => t.due)).slice(0, 5).map(t => <button key={t.id} onClick={() => setDialog({
          type: 'task-detail',
          id: t.id
        })}><ColorIcon id={t.course} /><span><strong>{tr(t.title)}</strong><small>{tr(dueLabel(t.due, new Date(now), t.allDay))}</small></span><ChevronRight size={17} /></button>))}{tr(!pending.some(t => t.due) && <Empty title={tr("Nothing due on your calendar")} icon={Bell}>{tr("Add a date and reminder to a task when you need a nudge.")}</Empty>)}<p className="field-help">{tr("On-page alerts work while Aster is open. Use calendar export for reminders beyond the browser.")}</p><Button variant="secondary" className="full" onClick={() => {
          navigate('homework');
          setDialog(null);
        }}>{tr("Open homework ")}<ArrowRight size={16} /></Button></div></Modal>)}
 {tr(dialog?.type === 'help' && <Modal title={tr("Help & information")} onClose={() => setDialog(null)}><div className="help-content"><Blue interactive className="help-blue" />{tr([['Find your next step', 'Your overview brings together upcoming homework, favourite subjects, and useful school updates.'], ['Make reminders yours', 'Open a task to check the instructions, add a date, or set a reminder. Changes stay here and never submit work to Schoolbox.'], ['Make learning stick', 'Use quick recall or flashcards to practise. Visit your resource shelf for original teacher materials.'], ['Privacy and storage', 'Guests save in this browser. Accounts save to local MySQL. School connections show their own sync status. Download a backup in Preferences.']].map(([title, text]) => <section key={title}><h3>{tr(title)}</h3><p>{tr(text)}</p></section>))}<External href={SCHOOL.url}>{tr("Go to ISR Schoolbox")}</External></div></Modal>)}
 {tr(toast && <div className="toast" role="status"><span className="toast-icon"><Check size={17} /></span><p>{tr(toast.message)}</p>{tr(toast.action && <button onClick={() => {
        toast.action.run();
        setToast(null);
      }}>{tr(toast.action.label)}</button>)}<button className="icon-button" aria-label={tr("Dismiss notification")} onClick={() => setToast(null)}><X size={16} /></button></div>)}
 </AppContext.Provider>;
}
function TaskDetail({
  id
}) {
  const tr = useT();
  const {
    homework,
    setDialog,
    toggleTask,
    updateChecklist,
    now,
    navigate,
    setFocus
  } = useApp();
  const t = homework.find(task => task.id === id);
  if (!t) return null;
  return <Modal title={tr("Task details")} onClose={() => setDialog(null)}><div className="task-detail"><SubjectTag id={t.course} /><h2>{tr(t.title)}</h2><div className="task-detail-meta"><span><CalendarDays size={16} />{tr(dueLabel(t.due, new Date(now), t.allDay))}</span><span>{tr(t.kind)}</span>{tr(t.priority === 'high' && <span className="high-priority">{tr("High priority")}</span>)}</div><p className="task-detail-description">{tr(t.details || 'No extra notes yet. Add the details that will help you get started.')}</p>{tr(t.checklist?.length > 0 && <div className="task-checklist"><h3>{tr("Task checklist ")}<span>{tr(t.checks?.length || 0)}{tr("/")}{tr(t.checklist.length)}</span></h3>{tr(t.checklist.map((step, i) => <label className={t.checks?.includes(i) ? 'checked' : ''} key={i}><input type="checkbox" checked={Boolean(t.checks?.includes(i))} onChange={() => updateChecklist(t.id, i)} /><span>{tr(step)}</span></label>))}</div>)}<button className="task-reminder-setting" onClick={() => setDialog({
        type: 'task-edit',
        id
      })}><span className="color-icon tone-blue"><Bell size={20} /></span><span><strong>{tr(reminderLabel(t))}</strong><small>{tr(t.allDay ? 'Date-only reminder · Europe/Berlin' : 'A nudge before this task is due')}</small></span><ChevronRight size={18} /></button>{tr(t.source && <div className="task-provenance"><School size={17} /><p>{tr(t.sourceStatus)}<br /><External href={t.source}>{tr("Read the original Schoolbox item")}</External></p></div>)}<div className="task-detail-actions"><Button variant="secondary" onClick={() => setDialog({
          type: 'task-edit',
          id
        })}>{tr("Edit task")}</Button><Button onClick={() => {
          toggleTask(id);
          setDialog(null);
        }}><Check size={17} />{tr(t.done ? 'Mark incomplete' : 'Mark as done')}</Button></div><button className="text-link focus-task-link" onClick={() => {
        setFocus(f => ({
          ...f,
          task: id
        }));
        navigate('focus');
        setDialog(null);
      }}>{tr("Take this to the focus room ")}<ArrowRight size={14} /></button></div></Modal>;
}
function SearchDialog() {
  const tr = useT();
  const {
    setDialog,
    homework,
    navigate
  } = useApp();
  const [query, setQuery] = useState('');
  const text = query.trim().toLowerCase();
  const subjects = SUBJECT_ORDER.filter(id => `${COURSES[id].name} ${COURSES[id].title}`.toLowerCase().includes(text)).slice(0, text ? 5 : 4);
  const sections = [...nav, ['focus', 'Focus room', Timer], ['settings', 'Preferences', Settings]].filter(([path, label]) => text && `${path} ${label}`.toLowerCase().includes(text)).slice(0, 5);
  const tasks = text ? homework.filter(t => t.title.toLowerCase().includes(text)).slice(0, 4) : [];
  const resources = text ? RESOURCES.filter(r => r.title.toLowerCase().includes(text)).slice(0, 5) : [];
  function go(path) {
    setDialog(null);
    navigate(path);
  }
  return <Modal title={tr("Search your workspace")} onClose={() => setDialog(null)} className="search-dialog"><div className="command-search"><Search size={20} /><input autoFocus placeholder={tr("Search subjects, tasks, or resources…")} aria-label={tr("Search your study space")} value={query} onChange={e => setQuery(e.target.value)} /><kbd>{tr("ESC")}</kbd></div><div className="command-results">{tr(sections.length > 0 && <><span className="eyebrow">{tr("WORKSPACE")}</span>{tr(sections.map(([path, label, Icon]) => <button key={path} onClick={() => go(path)}><span className="command-symbol"><Icon size={19} /></span><span><strong>{tr(label)}</strong><small>{tr("Open section")}</small></span><ArrowRight size={17} /></button>))}</>)}{tr(subjects.length > 0 && <><span className="eyebrow">{tr(text ? 'SUBJECTS' : 'YOUR SUBJECTS')}</span>{tr(subjects.map(id => <button key={id} onClick={() => go(`subjects/${id}`)}><ColorIcon id={id} size={19} /><span><strong>{tr(COURSES[id].name)}</strong><small>{tr(COURSES[id].title)}</small></span><ArrowRight size={17} /></button>))}</>)}{tr(tasks.length > 0 && <><span className="eyebrow">{tr("HOMEWORK")}</span>{tr(tasks.map(t => <button key={t.id} onClick={() => setDialog({
          type: 'task-detail',
          id: t.id
        })}><span className="command-symbol"><CalendarDays size={19} /></span><span><strong>{tr(t.title)}</strong><small>{tr(COURSES[t.course].name)}</small></span><ChevronRight size={17} /></button>))}</>)}{tr(resources.length > 0 && <><span className="eyebrow">{tr("SCHOOL RESOURCES")}</span>{tr(resources.map(r => <a href={r.url} target="_blank" rel="noreferrer" key={r.id}><span className="command-symbol"><BookOpen size={19} /></span><span><strong>{tr(r.title)}</strong><small>{tr(COURSES[r.subject].name)}</small></span><ArrowUpRight size={17} /></a>))}</>)}{tr(!sections.length && !subjects.length && !tasks.length && !resources.length && <Empty title={tr("No matching results")} icon={Search}>{tr("Try a subject name or a few words from a task.")}</Empty>)}</div><div className="command-footer"><span><Command size={12} />{tr(" Ctrl K to find your way")}</span><span>{tr("School resources open in a new tab")}</span></div></Modal>;
}
function SettingsPage({embedded=false}) {
  const tr = useT();
  const {
    prefs,
    setPrefs,
    progress,
    homework,
    sessionHistory,
    enableNotifications,
    notificationPermission,
    exportBackup,
    exportCalendar
  } = useApp();
  return <>{!embedded&&<PageHeading eyebrow={tr("YOUR WORKSPACE, YOUR PREFERENCES.")} title={tr("Personalise your workspace.")} description={tr("Adjust appearance, sound, focus goals, and reminders.")} />}<div className="settings-layout"><section className="settings-panel panel"><div className="profile-setting"><span className="avatar large" aria-hidden="true"><ProfilePortrait prefs={prefs}/></span><div><h2>{tr(prefs.name)}{tr("’s study space")}</h2><p>{tr("ISR · Grade 8 · Term 1, 2026–2027")}</p></div></div><label className="setting-label">{tr("Your display name")}<input value={prefs.name} maxLength={30} onChange={e => setPrefs(p => ({
            ...p,
            name: e.target.value || 'Anton'
          }))} /></label><div className="settings-divider" /><h3>{tr("Appearance & interaction")}</h3><LanguageSelector full/><ExperienceSettings/><AppearanceSettings/><div className="theme-options">{tr([['light', 'Light mode', Sun], ['dark', 'Dark mode', Moon]].map(([id, label, Icon]) => <button className={prefs.theme === id ? 'selected' : ''} aria-pressed={prefs.theme === id} onClick={() => setPrefs(p => ({
            ...p,
            theme: id
          }))} key={id}><span className={`theme-preview ${id}`}><i /><i /><i /></span><span><Icon size={16} />{tr(label)}{tr(prefs.theme === id && <Check size={15} />)}</span></button>))}</div><div className="setting-row"><div><strong>{tr("Interaction sounds")}</strong><p>{tr("A short cue after an answer or a completed session.")}</p></div><button role="switch" aria-label={tr("Study sound effects")} aria-checked={prefs.sound} className={`switch ${prefs.sound ? 'on' : ''}`} onClick={() => setPrefs(p => ({
            ...p,
            sound: !p.sound
          }))}><span /></button></div><div className="setting-row"><div><strong>{tr("Reduce motion")}</strong><p>{tr("Keep the color, with quieter movement. Your system preference is also respected.")}</p></div><button role="switch" aria-label={tr("Reduce motion")} aria-checked={Boolean(prefs.reduceMotion)} className={`switch ${prefs.reduceMotion ? 'on' : ''}`} onClick={() => setPrefs(p => ({
            ...p,
            reduceMotion: !p.reduceMotion
          }))}><span /></button></div><div className="setting-row"><div><strong>{tr("Your daily focus goal")}</strong><p>{tr("Choose something that fits your day.")}</p></div><select aria-label={tr("Daily focus goal")} value={prefs.dailyGoal} onChange={e => setPrefs(p => ({
            ...p,
            dailyGoal: Number(e.target.value)
          }))}>{tr([15, 25, 50, 90].map(v => <option key={v} value={v}>{tr(v)}{tr(" minutes")}</option>))}</select></div><div className="settings-divider" /><h3>{tr("Homework notifications")}</h3><p className="settings-copy">{tr("Homework reminders show here while Aster is open. For reminders when it’s closed, import an exported calendar into your calendar app.")}</p><div className="settings-actions"><Button variant="secondary" onClick={enableNotifications} disabled={notificationPermission === 'granted' || notificationPermission === 'denied'}><Bell size={16} />{tr(notificationPermission === 'granted' ? 'Alerts enabled' : notificationPermission === 'denied' ? 'Alerts blocked by browser' : 'Enable browser alerts')}</Button><Button variant="secondary" onClick={exportCalendar}><Download size={16} />{tr("Export calendar")}</Button></div></section><aside><div className="settings-blue-card"><Blue interactive className="settings-blue" /><h3>{tr("Your study companion.")}</h3><p>{tr("Progress on your own terms.")}<br />{tr("That’s what we’re here for.")}</p><span>{tr("Tap Blue for a wave.")}</span></div><div className="panel privacy-panel"><span className="color-icon tone-mint"><School size={23} /></span><h3>{tr("Your space stays yours.")}</h3><p>{tr("Guests save in this browser. Signed-in accounts also save to your local MySQL database. School connections show their current sync status on the school hub.")}</p><Button variant="secondary" className="full" onClick={exportBackup}><Download size={16} />{tr("Download a backup")}</Button><p><a href="#/backup">{tr("Backup & recovery")} <ArrowRight size={13}/></a></p><small>{tr("Keep your JSON backup somewhere safe. Clearing browser storage removes local changes.")}</small></div><div className="personal-totals"><div><strong>{tr(progress.sessions)}</strong><span>{tr("Reviews completed")}</span></div><div><strong>{tr(minutesLabel(progress.focusMinutes))}</strong><span>{tr("Focused so far")}</span></div></div></aside></div></>;
}



