// Import complete, verified text editions from Project Gutenberg's official mirror.
// Run manually. Existing local editions are preserved so saved passage anchors remain stable.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = 'https://gutenberg.pglaf.org/cache/epub';
const checked = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
const latestContributorDeath = Number(checked.slice(0, 4)) - 71;
const { BOOK_CATALOGUE } = await import('../front-end/src/books.js');
const candidates = BOOK_CATALOGUE.filter(book => /gutenberg.org\/ebooks\/\d+/.test(book.url));
const cache = resolve(root, '.work/reader-import');
await mkdir(cache, { recursive: true });
await mkdir(resolve(root, 'front-end/public/books'), { recursive: true });
const extra = {
  science: [1228, 944, 2300, 14474, 4719, 5726, 15491, 33504, 5001, 398, 1932, 3755],
  maths: [97, 33283, 38769, 31001],
  social: [1497, 1656, 1232, 2009, 7370, 2680, 61, 20203, 52190, 4363, 5740, 5],
  english: [37134, 16328, 1064, 5200, 2814, 1080, 140, 408, 145, 203, 45, 1342, 1514, 1513, 1450, 1727, 135, 996, 160, 1250, 1322, 3825, 2684, 1200, 382, 132, 829, 4517, 1597, 1614, 1001, 205, 4361, 201, 1059, 1060, 1051, 1695, 28520, 375],
  german: [22367, 7849, 2229, 2407, 6788, 7406, 6341, 6640, 7205, 6500, 8226, 2406, 7499],
  spanish: [2000, 1619, 15532, 24536, 16059, 11018, 37067],
};
const known = new Set(candidates.map(b => b.url.match(/ebooks\/(\d+)/)?.[1]));
for (const [subject, ids] of Object.entries(extra)) for (const number of ids) {
  if (known.has(String(number))) continue;
  known.add(String(number));
  candidates.push({ id: `local-pg-${number}`, subject, url: `https://www.gutenberg.org/ebooks/${number}`, extra: true });
}

const exists = async file => { try { await access(file); return true; } catch { return false; } };
const decode = value => value.replace(/<[^>]*>/g, '').replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const tag = (xml, name) => decode(xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`))?.[1] || '');
const sleep = ms => new Promise(done => setTimeout(done, ms));
const skipped = [], result = [];
let completed = 0, downloaded = 0;

async function fetchFile(url, file) {
  if (await exists(file)) return readFile(file, 'utf8');
  if (process.argv.includes('--cached-only')) throw new Error('Edition not available in the verified download cache');
  let last;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(35000), headers: { 'User-Agent': 'AsterLocalLibrary/1.0 (personal complete-edition import)' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      await writeFile(file, text, 'utf8');
      await sleep(2000);
      return text;
    } catch (error) { last = error; if (attempt === 0) await sleep(2000); }
  }
  throw last;
}

function cachedMetadata(html) {
  const people = [...html.matchAll(/<a[^>]*rel="marcrel:(aut|trl|edt|adp)"[^>]*>([\s\S]*?)<\/a>/g)].map(match => {
    const name = decode(match[2]);
    const years = name.match(/(-?\d{3,4})\??\s*[-–]\s*(\d{3,4})\??(?:\s*BCE)?/);
    const ancient = /BCE/.test(name);
    return { role: match[1], name, death: years ? Number(years[2]) * (ancient ? -1 : 1) : null };
  });
  return { people, rights: /Public domain in the USA/.test(html) };
}

function rdfMetadata(xml) {
  const people = [...xml.matchAll(/<(dcterms:creator|marcrel:(?:trl|edt|adp))>([\s\S]*?)<\/\1>/g)].map(match => ({
    role: match[1] === 'dcterms:creator' ? 'aut' : match[1].split(':')[1],
    name: tag(match[2], 'pgterms:name'), death: Number(tag(match[2], 'pgterms:deathdate')) || null,
  }));
  const langXml = xml.match(/<dcterms:language>([\s\S]*?)<\/dcterms:language>/)?.[1] || '';
  const subjects = [...xml.matchAll(/<dcterms:subject>([\s\S]*?)<\/dcterms:subject>/g)].map(match => tag(match[1], 'rdf:value')).filter(v => v.length > 3);
  return { people, rights: tag(xml, 'dcterms:rights') === 'Public domain in the USA.', title: tag(xml, 'dcterms:title'), language: tag(langXml, 'rdf:value'), subjects };
}

function fullTextInfo(raw) {
  const start = raw.indexOf('*** START OF THE PROJECT GUTENBERG EBOOK');
  const end = raw.indexOf('*** END OF THE PROJECT GUTENBERG EBOOK');
  if (start < 0 || end <= start) throw new Error('Missing complete-edition boundaries');
  const body = raw.slice(raw.indexOf('\n', start) + 1, end).replace(/\r/g, '').trim();
  if (body.length < 1200 || /<!doctype html|<html/i.test(raw.slice(0, 500))) throw new Error('Incomplete or non-text edition');
  return { characters: body.length, words: body.split(/\s+/u).length, sha256: createHash('sha256').update(raw).digest('hex') };
}

async function importBook(book) {
  const number = book.url.match(/ebooks\/(\d+)/)[1];
  try {
    let meta;
    for (const folder of ['book-sources', 'library-primary', 'library-catalogue']) {
      const file = resolve(root, `.work/${folder}/${number}.html`);
      if (await exists(file)) { meta = cachedMetadata(await readFile(file, 'utf8')); break; }
    }
    if (book.extra || !meta || !meta.people.length || !meta.rights || meta.people.some(person => person.death === null)) {
      meta = rdfMetadata(await fetchFile(`${source}/${number}/pg${number}.rdf`, resolve(cache, `${number}.rdf`)));
    }
    if (!meta.rights || !meta.people.length || meta.people.some(person => person.death === null || person.death > latestContributorDeath)) throw new Error('Edition rights/contributor dates need further review');
    if (book.extra) {
      const languages = { en: 'English', de: 'German', es: 'Spanish', zh: 'Chinese' };
      if (!languages[meta.language]) throw new Error('Edition language outside this library');
      if (['german', 'spanish'].includes(book.subject) && meta.language !== (book.subject === 'german' ? 'de' : 'es')) throw new Error('Not the requested language edition');
      const subjects = meta.subjects.join(' ');
      const languageSubject = { de: 'german', es: 'spanish' }[meta.language];
      const subject = languageSubject || (/Mathematics|Calculus|Geometry|Fourth dimension/i.test(subjects) ? 'maths' : /Evolution \(Biology\)|Natural history|Physics|Chemistry|Microscopy|Optics|Natural sciences/i.test(subjects) && !/Science fiction/i.test(subjects) ? 'science' : /History|Philosophy|Ethics|Politics|Political science|Government|Economics|Religion|Bible|Constitution|Communism/i.test(subjects) && !/Fiction/i.test(subjects) ? 'social' : /Drama/i.test(subjects) ? 'drama' : 'english');
      if (/\b(?:Volume|Vol\.|Band|tomo)\s*(?:\d+|[IVX]+)\b/i.test(meta.title)) throw new Error('Separate volume of a multi-volume work');
      book = { ...book, subject, title: meta.title.replace(/\s*\$[a-z]\s*/gi, ' '), author: meta.people.filter(p => p.role === 'aut').map(p => { const parts = p.name.split(', '); return parts.length === 2 ? `${parts[1]} ${parts[0]}` : p.name; }).join('; '), language: languages[meta.language], catalogueSubjects: meta.subjects, stages: ['IGCSE', 'IB'], topics: subject === 'science' ? ['Science history', 'Discovery'] : subject === 'maths' ? ['Mathematics', 'Reasoning'] : subject === 'social' ? ['History', 'Ideas'] : ['Literature', 'Close reading'], description: ['science', 'maths', 'social'].includes(subject) ? 'A complete historical work for exploring ideas and their context. Read critically alongside current course materials.' : 'Read the complete original edition and explore its language, characters, and ideas.', connection: 'Optional wider reading' };
    }
    if (!book.title || book.title.length > 240 || /index of|linked index|biographical notes|^if$|^jabberwocky$|complete project gutenberg/i.test(book.title)) throw new Error('Not a standalone reading edition');
    const local = book.local || `/books/pg-${number}.txt`;
    const destination = resolve(root, `front-end/public${local}`);
    const raw = book.local && await exists(destination) ? await readFile(destination, 'utf8') : await fetchFile(`${source}/${number}/pg${number}.txt`, resolve(cache, `${number}.txt`));
    const info = fullTextInfo(raw);
    if (!await exists(destination)) { await writeFile(destination, raw, 'utf8'); downloaded++; }
    const { extra: _, preview, school, ...metadata } = book;
    result.push({ ...metadata, access: 'public-domain', local, source: book.url, rights: 'Complete public-domain text edition. Original credits and source licence are included in the downloadable file.', verifiedOn: checked, gutenbergId: Number(number), contributors: meta.people, textSource: `${source}/${number}/pg${number}.txt`, ...info });
  } catch (error) { skipped.push({ id: book.id, title: book.title || number, reason: error.message }); }
  completed++;
  if (completed % 20 === 0 || completed === candidates.length) console.log(JSON.stringify({ checked: completed, candidates: candidates.length, readable: result.length, skipped: skipped.length, downloaded }));
}

let next = 0;
await Promise.all(Array.from({ length: 3 }, async () => { while (next < candidates.length) await importBook(candidates[next++]); }));
const order = new Map(candidates.map((book, index) => [book.id, index]));
result.sort((a, b) => order.get(a.id) - order.get(b.id));
const titleKey = b => `${b.language}:${b.title.toLowerCase().replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, '')}`;
const seen = new Set();
const unique = result.filter(book => { const key = titleKey(book); if (seen.has(key)) return false; seen.add(key); return true; });
await writeFile(resolve(root, 'front-end/src/localLibrary.json'), JSON.stringify(unique, null, 2) + '\n');
await writeFile(resolve(cache, 'report.json'), JSON.stringify({ checked, count: unique.length, downloaded, skipped }, null, 2));
console.log(JSON.stringify({ finished: true, books: unique.length, downloaded, languages: [...new Set(unique.map(b => b.language))], skipped: skipped.length }));
