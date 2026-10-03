import json,re,html,urllib.request,concurrent.futures
from pathlib import Path
root=Path(__file__).resolve().parents[1];cache=root/'.work/library-primary';cache.mkdir(parents=True,exist_ok=True)
old=json.loads((root/'front-end/src/bookExpansion.js').read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
def clean(s):return html.unescape(re.sub('<[^>]+>',' ',s)).strip()
def fetch(url,file):
 if not file.exists():file.write_bytes(urllib.request.urlopen(url,timeout=22).read())
 return file.read_text(encoding='utf-8')
authors={};existing={int(i) for i in re.findall(r'gutenberg.org/ebooks/(\d+)',(root/'front-end/src/books.js').read_text(encoding='utf-8')+(root/'front-end/src/bookExpansion.js').read_text(encoding='utf-8'))};existing.update([84,1342,1514])
for b in old:
 n=b['id'].split('-')[-1];f=root/'.work/book-sources'/f'{n}.html'
 if not f.exists():continue
 m=re.search(r'<a href="(/ebooks/author/\d+)" rel="marcrel:aut"[^>]*>(.*?)</a>',f.read_text(encoding='utf-8'),re.S)
 if m:authors[m[1]]=b
def author_books(pair):
 path,b=pair
 try:
  page=fetch('https://www.gutenberg.org'+path,cache/(path.rsplit('/',1)[1]+'-author.html'))
  numbers=list(dict.fromkeys(map(int,re.findall(r'href="/ebooks/(\d+)"',page))))
  return[(n,b) for n in numbers if n not in existing][:9]
 except Exception as e:print('Author catalogue unavailable:',b['author'],type(e).__name__,flush=True);return[]
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:groups=list(pool.map(author_books,authors.items()))
candidates=[];seen=set(existing)
for group in groups:
 for n,b in group:
  if n not in seen:seen.add(n);candidates.append((n,b))
print('Catalogue titles to verify:',len(candidates),flush=True)
def verify(pair):
 n,original=pair
 try:
  page=fetch(f'https://www.gutenberg.org/ebooks/{n}',cache/f'{n}.html')
  language=re.search(r'property="dcterms:language"[^>]*content="([^"]+)"',page)
  if not language or language[1] not in ['en','de','es','zh']:return None
  lang={'en':'English','de':'German','es':'Spanish','zh':'Chinese'}[language[1]]
  h=re.search(r'<h1[^>]*>(.*?)</h1>',page,re.S);canonical=clean(h[1]) if h else ''
  title=re.search(r'<td[^>]*itemprop="headline"[^>]*>(.*?)</td>',page,re.S)
  if not title:title=re.search(r'<td[^>]*property="dcterms:title"[^>]*>(.*?)</td>',page,re.S)
  name=clean(title[1]) if title else canonical.rsplit(' by ',1)[0]
  if not name or len(name)>220 or re.search('complete works|collected works|volume [IVX]+|vol\. [IVX0-9]+',name,re.I):return None
  b={**original,'id':f'pg-more-{n}','title':name,'url':f'https://www.gutenberg.org/ebooks/{n}','source':f'https://www.gutenberg.org/ebooks/{n}','verifiedTitle':canonical,'language':lang,'stages':['Grade 8','IGCSE'] if 'Juvenile fiction' in page else ['IGCSE','IB'] if original['stages']==['Grade 8','IGCSE'] else original['stages']}
  b.pop('local',None);b['connection']='Optional wider reading'
  b['subject']={'German':'german','Spanish':'spanish','Chinese':'english'}.get(lang,original['subject'])
  return b
 except Exception as e:print('Title skipped:',n,type(e).__name__,flush=True);return None
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:books=list(filter(None,pool.map(verify,candidates)))
def key(b):return(re.sub('[^a-z0-9]','',b['title'].lower().split(':')[0].replace('’',"'")),b['language'])
names={key(b) for b in old};unique=[]
for b in books:
 if key(b) not in names:unique.append(b);names.add(key(b))
(root/'front-end/src/libraryExpansion.json').write_text(json.dumps(unique,ensure_ascii=False,indent=2),encoding='utf-8')
print('Verified additional books:',len(unique),flush=True)
print('Languages:',{lang:sum(b['language']==lang for b in unique) for lang in ['English','German','Spanish','Chinese']},flush=True)
