import { COURSES } from '../front-end/src/study.js';
import { CURRICULUM, UNITS } from '../front-end/src/curriculum.js';
import { EXTRA_QUESTIONS } from '../front-end/src/questionBank.js';
import { writeFileSync } from 'node:fs';
const verifiedAlgebra = EXTRA_QUESTIONS.maths.filter(q => /^aster-maths-(equation|bracketEquation)-/.test(q.id));
writeFileSync(new URL('../back-end/src/main/resources/catalogue.json', import.meta.url), JSON.stringify({ courses: COURSES, curriculum: CURRICULUM, units: UNITS, verifiedAlgebra }));
console.log(`Exported ${CURRICULUM.length} curriculum pathways and ${verifiedAlgebra.length} checked algebra questions for Java.`);
