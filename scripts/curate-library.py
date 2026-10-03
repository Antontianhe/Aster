import json,re,html,urllib.request,concurrent.futures
from pathlib import Path
r=Path(__file__).resolve().parents[1];file=r/'front-end/src/libraryExpansion.json';books=json.loads(file.read_text(encoding='utf-8'));old=json.loads((r/'.work/existing-books.json').read_text(encoding='utf-8'))
def key(title):return re.sub(r'[^\w]','',re.sub(r'^(the|a|an) ','',title.lower()).split(':')[0].split(';')[0].replace('’',"'"))
seen=[(key(b['title']),b['language']) for b in old];out=[]
skip=r'index of|linked index|household words|forerunner, volume|fables.*volume|portrait of a lady.*volume|war and peace, book|words of one syllable|young folks.*edition|biographical notes|^if$|^jabberwocky$|charles frohmann|personal reminiscences|complete project gutenberg'
for b in books:
 k=key(b['title']);lang=b['language']
 if re.search(skip,b['title'],re.I) or any(lang==l and (k==v or len(v)>8 and k.startswith(v)) for v,l in seen):continue
 n=b['url'].rsplit('/',1)[1];page=(r/'.work/library-primary'/f'{n}.html').read_text(encoding='utf-8')
 authors=re.findall(r'<a href="/ebooks/author/\d+" rel="marcrel:aut"[^>]*>(.*?)</a>',page,re.S)
 if authors:
  cleaned=[]
  for a in authors:
   a=html.unescape(re.sub('<[^>]*>',' ',a)).strip();a=re.sub(r',\s*\d{3,4}.*$','',a);parts=a.split(', ');cleaned.append(' '.join(parts[1:]+parts[:1]) if len(parts)>1 else a)
  b['author']='; '.join(cleaned)
 b['stages']=['Grade 8','IGCSE'] if 'Juvenile fiction' in page else ['IGCSE','IB'] if b['topics'][0] in ['Adventure','Mystery','Fantasy','Science fiction'] else ['IB']
 seen.append((k,lang));out.append(b)
reading=['Anne of Avonlea','Anne of the Island','The Marvelous Land of Oz','The Prince and the Pauper','Little Men','The Book of Dragons','The Story of the Treasure Seekers','The Phoenix and the Carpet','The Story of the Amulet','A Study in Scarlet','The Sign of the Four','Northanger Abbey','Mansfield Park','The Happy Prince, and Other Tales','The Canterville Ghost','As You Like It']
def download(b):
 if b['title'] not in reading:return b
 n=b['url'].rsplit('/',1)[1];p=r/'front-end/public/books'/f'{n}.txt'
 try:
  if not p.exists():
   raw=urllib.request.urlopen(f'https://www.gutenberg.org/cache/epub/{n}/pg{n}.txt',timeout=25).read()
   if b'*** START OF THE PROJECT GUTENBERG EBOOK' not in raw:raise ValueError('Missing full-text marker')
   p.write_bytes(raw)
  b['local']='/books/'+n+'.txt'
 except Exception as e:print('External reader retained:',n,type(e).__name__,flush=True)
 return b
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:out=list(pool.map(download,out))
file.write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print('Additional curated titles:',len(out),'with',sum('local' in b for b in out),'additional complete readers.',flush=True)
