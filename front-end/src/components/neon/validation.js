export function requireFunction(value,name){if(typeof value!=='function')throw new TypeError(`${name} must be a function`);}
export function requireText(value,name){if(typeof value!=='string'||!value.trim())throw new TypeError(`${name} must be nonempty text`);}
export function requireFinite(value,name){if(!Number.isFinite(value)||value<0)throw new TypeError(`${name} must be a nonnegative number`);}
export function requireCourse(course){
  if(!course||typeof course!=='object')throw new TypeError('A course is required');
  requireText(course.name,'course.name');requireText(course.title,'course.title');
  if(!Array.isArray(course.notes)||!course.notes.every(n=>Array.isArray(n)&&n.length===2&&n.every(v=>typeof v==='string')))throw new TypeError('Course notes must contain title and explanation pairs');
}
