// Dates are calendar days in the user's school timezone, not 24-hour countdowns.
export const SCENES = ['spring', 'summer', 'autumn', 'winter', 'halloween', 'christmas', 'lunar', 'birthday', 'newyear', 'blossom'];
export function validBirthday(value) {
  if (typeof value !== 'string' || !/^\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`2000-${value}T12:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(5, 10) === value;
}
export function seasonFor(day, southern = false) {
  const month = Number(day.slice(5, 7));
  const index = month >= 3 && month <= 5 ? 0 : month >= 6 && month <= 8 ? 1 : month >= 9 && month <= 11 ? 2 : 3;
  return ['spring', 'summer', 'autumn', 'winter'][(index + (southern ? 2 : 0)) % 4];
}
export function daysUntil(day, target) { return Math.round((Date.parse(target + 'T12:00:00Z') - Date.parse(day + 'T12:00:00Z')) / 86400000); }
const pad = n => String(n).padStart(2, '0');
function lunarDates(year) {
  // HKO civil-calendar tables override known ICU astronomical boundary differences.
  // Source: https://www.hko.gov.hk/en/gts/time/conversion.htm
  const verified = {
    2026: ['02-17','03-03','06-19','09-25'],
    2027: ['02-06','02-20','06-09','09-15'],
    2028: ['01-26','02-09','05-28','10-03'],
  };
  if (verified[year]) return Object.fromEntries(['lunar','lantern','dragonboat','midautumn'].map((id,i)=>[id,`${year}-${verified[year][i]}`]));
  const found = {};
  try {
    const fmt = new Intl.DateTimeFormat('en-u-ca-chinese', { month: 'numeric', day: 'numeric', timeZone: 'Asia/Shanghai' });
    // Midnight UTC is safely within the corresponding Chinese civil date.
    for (let date = new Date(Date.UTC(year, 0, 1)); date.getUTCFullYear() === year; date.setUTCDate(date.getUTCDate() + 1)) {
      const parts = Object.fromEntries(fmt.formatToParts(date).map(p => [p.type, p.value]));
      for (const [key, month, day] of [['lunar', '1', '1'], ['lantern', '1', '15'], ['dragonboat', '5', '5'], ['midautumn', '8', '15']])
        if (parts.month === month && parts.day === day) found[key] = date.toISOString().slice(0, 10);
    }
  } catch { /* Fixed-date celebrations still work if this browser has no Chinese calendar. */ }
  return found;
}
function easter(year) {
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),n=h+l-7*m+114;
  return `${year}-${pad(Math.floor(n/31))}-${pad(n%31+1)}`;
}
const cache = new Map();
export function festivalsForYear(year) {
  if (cache.has(year)) return cache.get(year);
  const fixed = [
    ['newyear', 'New Year', '01-01', 'newyear'], ['valentine', 'Valentine’s Day', '02-14', 'blossom'],
    ['earth', 'Earth Day', '04-22', 'spring'], ['halloween', 'Halloween', '10-31', 'halloween'],
    ['christmas', 'Christmas', '12-25', 'christmas'], ['yearseve', 'New Year’s Eve', '12-31', 'newyear'],
  ].map(([id, name, date, scene]) => ({ id, name, date: `${year}-${date}`, scene }));
  const lunar = lunarDates(year);
  for (const [id, name, scene] of [['lunar', 'Lunar New Year', 'lunar'], ['lantern', 'Lantern Festival', 'lunar'], ['dragonboat', 'Dragon Boat Festival', 'summer'], ['midautumn', 'Mid-Autumn Festival', 'autumn']])
    if (lunar[id]) fixed.push({ id, name, date: lunar[id], scene });
  fixed.push({ id: 'easter', name: 'Easter Sunday', date: easter(year), scene: 'spring' });
  cache.set(year, fixed);
  return fixed;
}
export function upcomingCelebrations(day, birthday, custom = []) {
  const year = Number(day.slice(0,4));
  if (!Number.isInteger(year)) return [];
  const all = [...festivalsForYear(year), ...festivalsForYear(year + 1)];
  if (validBirthday(birthday)) for (const y of [year, year+1]) {
    // A 29 February birthday is celebrated on 28 February in non-leap years.
    const leap = y%4 === 0 && (y%100 !== 0 || y%400 === 0);
    all.push({ id:'birthday', name:'Your birthday', date:`${y}-${birthday === '02-29' && !leap ? '02-28' : birthday}`, scene:'birthday' });
  }
  if (Array.isArray(custom)) all.push(...custom.filter(e => e && typeof e.name === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && Number.isFinite(Date.parse(e.date + 'T12:00:00Z')) && new Date(e.date + 'T12:00:00Z').toISOString().slice(0,10) === e.date).map(e => ({ ...e, scene:SCENES.includes(e.scene) ? e.scene : 'newyear', custom:true })));
  const seen = new Set();
  return all.filter(e => e.date >= day).sort((a,b) => a.date.localeCompare(b.date)).filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true; }).map(e => ({...e, days:daysUntil(day,e.date)}));
}
export function sceneFor(day, prefs = {}) {
  const events = upcomingCelebrations(day, prefs.birthday, prefs.celebrations);
  const birthday = prefs.birthdayCelebration !== false && events.find(e => e.id === 'birthday' && e.days === 0);
  const occasion = birthday || events.find(e => e.days === 0 && e.id !== 'birthday') || events.find(e => e.id === 'christmas' && e.days === 1);
  return { scene: SCENES.includes(prefs.backgroundScene) ? prefs.backgroundScene : occasion?.scene || seasonFor(day, prefs.southernSeasons), occasion, next: events[0] };
}
