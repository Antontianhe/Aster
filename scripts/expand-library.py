import json,re,urllib.request,html,concurrent.futures
from pathlib import Path
root=Path(__file__).resolve().parents[1];cache=root/'.work/library-catalogue';cache.mkdir(parents=True,exist_ok=True)
headers={'User-Agent':'Aster personal reading catalogue (educational metadata)'}
def get(url,file):
 if not file.exists():file.write_bytes(urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=35).read())
 return file.read_text(encoding='utf-8')
existing=(root/'front-end/src/books.js').read_text(encoding='utf-8')+(root/'front-end/src/bookExpansion.js').read_text(encoding='utf-8')
seen={int(i) for i in re.findall(r'gutenberg.org/ebooks/(\d+)',existing)}
seen.update({84,1342,1514})
allowed=re.compile(r'Austen|Dickens|Shakespeare|Carroll|Montgomery|Nesbit|Burnett|Stevenson|Twain|Alcott|Doyle|Wells|Verne|Baum|Kipling|London|Bront|Hawthorne|Poe,|Melville|Dumas|Hugo,|Tolstoy|Dostoyevsky|Chekhov|Gogol|Turgenev|Eliot, George|Hardy, Thomas|Gaskell|Forster|Wharton|Woolf|Shelley|Stoker|Collins, Wilkie|Wilde, Oscar|Chesterton|Saki|Conan|Homer|Sophocles|Plato|Aristotle|Marcus Aurelius|Darwin|Faraday|Douglass|Du Bois|Wollstonecraft|Dickinson|Whitman|Keats|Wordsworth|Coleridge|Tennyson|Burns,|Browning|Tagore|Andersen|Grimm|Aesop|Sewell|Defoe|Swift, Jonathan|Scott, Walter|Cooper|Bunyan|Barrie|Pyle, Howard|Ballantyne|MacDonald, George|Spyri|Lagerl|Milne|Collodi|Saint-Exup|Goethe|Schiller|Kafka|Hesse|Storm, Theodor|Fontane|Hoffmann|Cervantes|Lorca|B\u00e9cquer|Mart\u00ed|P\u00e9rez Gald|Lu, Xun|Lu Xun|Cao, Xueqin|Luo, Guanzhong|Wu, Cheng|Pu, Songling|Shi, Nai',re.I)
records=[]
for language,pages in [('en',13),('de',2),('es',2),('zh',2)]:
 for page in range(1,pages+1):
  try:
   payload=json.loads(get(f'https://gutendex.com/books/?languages={language}&copyright=false&mime_type=text&sort=popular&page={page}',cache/f'{language}-{page}.json'))
   for b in payload.get('results',[]):
    if b['id'] in seen or not b.get('authors') or not any(allowed.search(a['name']) for a in b['authors']):continue
    seen.add(b['id']);records.append(b)
  except Exception as e: print('Catalogue page unavailable:',language,page,type(e).__name__,flush=True);break
print('Candidate titles:',len(records),flush=True)
descriptions={'Fantasy':'Follow an imagined world and examine how its rules, characters, and language develop meaning.','Adventure':'Trace a journey, identify important decisions, and compare the storyteller’s perspective with your own.','Mystery':'Follow the evidence and test competing explanations as the story develops.','Poetry':'Read aloud, compare patterns of sound and imagery, and develop an interpretation supported by the text.','Drama':'Explore dialogue, conflict, and dramatic structure. Compare how different performance choices affect meaning.','Science fiction':'Explore how imagined discoveries raise questions about responsibility, society, and the future.','History & ideas':'Read a primary text closely and evaluate its arguments, context, and limitations.','Coming of age':'Follow changing relationships and examine ideas about identity, belonging, and independence.','Classic literature':'Develop close-reading skills through narrative voice, character, setting, and the social context of the work.'}
def verify(b):
 try:
  n=b['id'];page=get(f'https://www.gutenberg.org/ebooks/{n}',cache/f'pg-{n}.html');m=re.search(r'<h1[^>]*>(.*?)</h1>',page,re.S)
  if not m:return None
  verified=html.unescape(re.sub('<.*?>','',m[1])).strip();title=b['title'].replace('\n',' ').strip()
  subjects=' '.join(b.get('subjects',[])+b.get('bookshelves',[])).lower();genre='Classic literature'
  for words,name in [('fantasy|fairy','Fantasy'),('adventure','Adventure'),('detective|mystery','Mystery'),('poetry|poems','Poetry'),('drama|plays','Drama'),('science fiction','Science fiction'),('philosophy|history|essays|science --','History & ideas'),('juvenile|children|bildungsroman','Coming of age')]:
   if re.search(words,subjects):genre=name;break
  young='juvenile' in subjects or "children's" in subjects
  author='; '.join(' '.join(a['name'].split(', ')[1:]+[a['name'].split(', ')[0]]) if ', ' in a['name'] else a['name'] for a in b['authors'])
  lang=next((x for x in b['languages'] if x in ['en','de','es','zh']),'en');language={'en':'English','de':'German','es':'Spanish','zh':'Chinese'}[lang]
  return{'id':f'pg-more-{n}','title':title,'author':author,'subject':{'en':'drama' if genre=='Drama' else 'english','de':'german','es':'spanish','zh':'english'}[lang],'stages':['Grade 8','IGCSE'] if young else ['IGCSE','IB'] if genre in ['Adventure','Mystery','Fantasy','Science fiction'] else ['IB'],'description':descriptions[genre],'topics':[genre,'Wider reading',language],'access':'public-domain','url':f'https://www.gutenberg.org/ebooks/{n}','source':f'https://www.gutenberg.org/ebooks/{n}','connection':'Optional wider reading','rights':'Project Gutenberg provides this edition as public domain in the USA. Check the edition and local copyright rules. Historical attitudes and mature themes may need discussion; reading-stage labels are suggestions, not assigned school reading.','language':language,'verifiedTitle':verified}
 except Exception as e:print('Book not added:',b['id'],type(e).__name__,flush=True);return None
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:books=list(filter(None,pool.map(verify,records)))
# Keep one edition of a title per language, including the existing library.
old=json.loads((root/'front-end/src/bookExpansion.js').read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
def key(b):return(re.sub('[^a-z0-9]','',b['title'].lower().split(':')[0].replace('’',"'")),b['language'])
names={key(b) for b in old};unique=[]
for b in books:
 if key(b) not in names:unique.append(b);names.add(key(b))
(root/'front-end/src/libraryExpansion.json').write_text(json.dumps(unique,ensure_ascii=False,indent=2),encoding='utf-8')
print('Verified additional titles:',len(unique),flush=True)
