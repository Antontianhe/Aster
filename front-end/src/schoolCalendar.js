// Read-only event details verified in the signed-in Veracross calendar, 20 September 2026.
// School-wide dates, never personal grades or student records. Recheck the source for changes.
const eventUrl='https://portals.veracross.com/isrschool/student/detail/event/';
export const SCHOOL_CALENDAR_CHECKED='2026-09-20';
export const SCHOOL_EVENTS=[
 {id:'BDB46089-E0F5-4C47-B7CC-C1047E7316FC',date:'2026-10-01',title:'Oktoberfest Spirit Day',time:'08:00–16:00',category:'School community'},
 {id:'F99853B8-7042-4F05-8CD0-EBA3E781F994',date:'2026-10-02',title:'No School',time:'All day',category:'School calendar'},
 {id:'0B23DCDE-E76F-4161-A926-65AC3FC555A3',date:'2026-10-09',title:'Secondary School Coffee Morning',time:'08:30–09:30',category:'Secondary school'},
 {id:'DA64BA34-11FB-470A-AFAD-B29C03B3A538',date:'2026-10-10',title:'ISR Open House',time:'11:00–15:00',category:'School community'},
].map(event=>({...event,url:eventUrl+event.id}));
