import urllib.request,re,json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
class Links(HTMLParser):
 def __init__(self):super().__init__();self.href=None;self.text=[];self.links=[]
 def handle_starttag(self,tag,attrs):
  if tag=='a':self.href=dict(attrs).get('href');self.text=[]
 def handle_data(self,data):
  if self.href:self.text.append(data)
 def handle_endtag(self,tag):
  if tag=='a' and self.href:self.links.append((self.href,' '.join(' '.join(self.text).split())));self.href=None
def fetch(url):
 p=Links();p.feed(urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Aster study resource directory'}),timeout=40).read().decode('utf-8'));return p.links
base='https://www.cambridgeinternational.org'
url=base+'/programmes-and-qualifications/cambridge-upper-secondary/cambridge-igcse/subjects/'
seen=set();ig=[]
for href,name in fetch(url):
 m=re.search(r'\b(\d{4})\b',name)
 if not m or 'cambridge-igcse-' not in href or m[1] in seen:continue
 seen.add(m[1]);ig.append({'id':'ig-'+m[1],'name':name,'url':urljoin(base,href),'programme':'IGCSE','code':m[1]})
ib=[];seen=set();ibbase='https://ibo.org/programmes/diploma-programme/curriculum/'
for group in ['language-and-literature','language-acquisition','individuals-and-societies','sciences','mathematics','the-arts','dp-core']:
 try:
  links=fetch(ibbase+group+'/')
  for href,name in links:
   absolute=urljoin(ibbase,href)
   if '/curriculum/'+group+'/' not in absolute or absolute.rstrip('/')==(ibbase+group).rstrip('/') or not name or 'Image' in name or absolute in seen:continue
   if absolute.count('/')>10 or '#' in absolute:continue
   seen.add(absolute);slug=absolute.rstrip('/').split('/')[-1];ib.append({'id':'ib-'+slug,'name':name,'url':absolute,'programme':'IB','group':group})
 except Exception as e: print('Check group manually:',group,type(e).__name__)
out=Path('front-end/src/subjectDirectory.json');out.write_text(json.dumps({'igcse':ig,'ib':ib},ensure_ascii=False,indent=2),encoding='utf-8')
print('Official subject links:',len(ig),'IGCSE,',len(ib),'IB')
print('IB titles:',[b['name'] for b in ib])
