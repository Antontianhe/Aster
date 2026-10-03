// Curated from visible Schoolbox articles on 19 September 2026.
// A local snapshot: these links do not imply an automatic LMS connection.
export const SCHOOL_NEWS = [
  { id:'music-quiz', subject:'music', date:'2026-09-17', title:'Your Music quiz, made manageable', excerpt:'The mid-unit quiz contains 20 questions selected from the 40 guiding questions in Assessment Topics. Start with those and the source list.', url:'https://lms.isr-school.com/news/5125?ref=index', tag:'Assessment prep', icon:'Music2' },
  { id:'grade-update', subject:'homeroom', date:'2026-09-18', title:'A look at the week ahead', excerpt:'The Grade 8 update announces a 45-minute English assessment next Thursday during Periods 1 and 2. Check the notice for assessment-topic guidance.', url:'https://lms.isr-school.com/news/5152?ref=index', tag:'Grade 8 update', icon:'School' },
  { id:'art-project', subject:'art', date:'2026-09-14', title:'Bring the principles of design to life', excerpt:'Create 13 × 13 cm examples in Weeks 2–5. The A3 project in Weeks 6–8 applies three principles of design, with an explanation of your choices.', url:'https://lms.isr-school.com/news/5100?ref=index', tag:'From your classroom', icon:'Palette' },
];

export const EXTRA_HOMEWORK = [
  { id:'news-art-examples', course:'art', title:'Principles of design · small examples', kind:'Creative project', due:null, source:'https://lms.isr-school.com/news/5100?ref=index', sourceStatus:'Weeks 2–5 · exact deadline not listed', details:'Create 13 × 13 cm examples explaining the principles of design. The notice covers Weeks 2–5 and gives no exact hand-in time. Confirm your classroom deadline before adding a reminder.', done:false, remindHours:null, priority:'normal', checklist:['Read the principles of design','Plan the 13 × 13 cm examples','Check the hand-in date in class'] },
  { id:'news-art-final', course:'art', title:'A3 final art project', kind:'Creative project', due:null, source:'https://lms.isr-school.com/news/5100?ref=index', sourceStatus:'Weeks 6–8 · exact deadline not listed', details:'Create an original A3 work using three principles of design. Include which principles you chose and how you used them; the notice says this explanation is 50% of the final mark. Materials: pencil, black pen, and colours. Ask your teacher to clarify the separate wording about three elements and three principles.', done:false, remindHours:null, priority:'normal', checklist:['Choose three principles of design','Sketch the composition','Create the A3 artwork','Explain the design choices'] },
  { id:'news-english-assessment', course:'english', title:'English assessment · 45 minutes', kind:'Assessment', due:'2026-09-24', allDay:true, source:'https://lms.isr-school.com/news/5152?ref=index', sourceStatus:'Thursday, Periods 1–2 · start time not listed', details:'The Grade 8 update dated 18 September announces an English assessment next Thursday, 24 September, during Periods 1 and 2. The assessment lasts 45 minutes. The date is inferred from that dated notice; the precise start time is not supplied. Check Schoolbox and your teacher for the assessment topics.', done:false, remindHours:24, priority:'high', checklist:['Check the assessment topics','Review your lesson materials','Practise a short analytical paragraph'] },
];

export const SUBJECT_META = {
  music:{color:'violet',category:'Creative',short:'Music',hint:'Find your rhythm',estimate:5},
  maths:{color:'blue',category:'Core',short:'Mathematics',hint:'Make it add up',estimate:5},
  science:{color:'mint',category:'Core',short:'Science',hint:'Follow your curiosity',estimate:5},
  english:{color:'peach',category:'Languages',short:'English',hint:'Find the right words',estimate:5},
  computing:{color:'cyan',category:'Core',short:'Computing',hint:'Connect the dots',estimate:5},
  german:{color:'butter',category:'Languages',short:'German',hint:'Wörter öffnen Welten',estimate:5},
  spanish:{color:'coral',category:'Languages',short:'Spanish',hint:'Un poquito cada día',estimate:5},
  social:{color:'sage',category:'Core',short:'Social Studies',hint:'See the bigger picture',estimate:5},
  drama:{color:'pink',category:'Creative',short:'Drama',hint:'Step into a new story',estimate:5},
  art:{color:'lavender',category:'Creative',short:'Art',hint:'Make something yours',estimate:5},
  pe:{color:'orange',category:'Wellbeing',short:'Physical Education',hint:'Move with purpose',estimate:0},
  advising:{color:'sky',category:'Wellbeing',short:'Advising',hint:'Make space to grow',estimate:0},
  homeroom:{color:'stone',category:'Wellbeing',short:'Homeroom',hint:'Your school home base',estimate:0},
};

export const ART_CONTENT = {
  title:'The principles of design',
  description:'Explore how balance, rhythm, and contrast bring an artwork together.',
  unitSource:'https://lms.isr-school.com/news/5100?ref=index',
  topics:['Emphasis & contrast','Balance & movement','Pattern & rhythm','Unity & proportion','Your A3 composition'],
  notes:[['Emphasis & contrast','Emphasis draws attention to an important part of an artwork. Contrast places noticeably different elements together—for example, light beside dark—to create visual interest.'],['Balance & movement','Balance distributes visual weight across an image. It can be symmetrical, asymmetrical, or radial. Movement guides the viewer’s eye through a composition.'],['Pattern & rhythm','Pattern repeats an element or arrangement. Rhythm uses repetition and variation to create a visual beat and guide the eye.'],['Unity & proportion','Unity helps separate parts of an artwork feel connected. Proportion describes how the sizes of parts relate to one another. For the A3 project, explain the principles you have chosen and how they communicate your idea.']],
  resources:[{title:'Art Tasks · principles of design & A3 project',url:'https://lms.isr-school.com/news/5100?ref=index',type:'Assignment instructions'},{title:'G8 Art · class page',url:'https://lms.isr-school.com/homepage/5109',type:'Schoolbox material'}],
  questions:[
    {q:'Which principle draws attention to a focal point?',options:['Emphasis','Proportion','Texture','Repetition alone'],a:0,why:'Emphasis makes one part of the artwork stand out.'},
    {q:'Placing a very dark shape beside a light area creates…',options:['Symmetry','Contrast','A timetable','Perspective automatically'],a:1,why:'Differences in light and dark create contrast.'},
    {q:'What does proportion describe?',options:['The artist’s name','Only the colours','The relative sizes of parts','The number of pencils'],a:2,why:'Proportion concerns the size of one part in relation to another.'},
    {q:'Which kind of balance arranges elements around a centre?',options:['Asymmetrical','Vertical only','Random','Radial'],a:3,why:'Radial balance distributes elements around a central point.'},
    {q:'What should accompany your final A3 artwork?',options:['An explanation of your chosen principles','Only your favourite colour','A different class’s worksheet','Nothing else'],a:0,why:'The teacher asks you to identify which principles of design you used and explain how.'},
  ],
};
