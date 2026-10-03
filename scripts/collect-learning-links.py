"""Collect public resource links, never copies of restricted papers."""
import urllib.request,urllib.parse,re,json,concurrent.futures,html
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
URLS={
 'cemc':'https://cemc.uwaterloo.ca/resources/past-contests?academic_year=All',
 'ib':'https://ibo.org/programmes/diploma-programme/assessment-and-exams/sample-exam-papers/',
 'crash':'https://thecrashcourse.com/courses/',
 'ukmt':'https://ukmt.org.uk/competitions',
 'ig-0500':'https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-english-first-language-0500/past-papers/',
 'ig-0580':'https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-mathematics-0580/past-papers/',
 'ig-0610':'https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-biology-0610/past-papers/',
 'ig-0620':'https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-chemistry-0620/past-papers/',
 'ig-0625':'https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-physics-0625/past-papers/',
 'ig-0478':'https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-computer-science-0478/past-papers/'
}
def collect(item):
 key,url=item
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'Aster-learning-resource-check/1.0'})
  page=urllib.request.urlopen(req,timeout=35).read().decode('utf8',errors='replace')
  links=[]
  for href,label in re.findall(r'<a\b[^>]*href=[\"\']([^\"\']+)[\"\'][^>]*>(.*?)</a>',page,re.S|re.I):
   text=html.unescape(re.sub('<[^>]+>',' ',label));text=' '.join(text.split())
   links.append({'url':urllib.parse.urljoin(url,html.unescape(href)),'title':text})
  return key,{'source':url,'links':links}
 except Exception as e:return key,{'source':url,'error':type(e).__name__}
if (ROOT/'.work'/'learning-links.json').exists():
 out=json.loads((ROOT/'.work'/'learning-links.json').read_text(encoding='utf8'))
else:out={}
out.update(dict(concurrent.futures.ThreadPoolExecutor(max_workers=5).map(collect,[(k,v) for k,v in URLS.items() if k not in out])))
page=urllib.request.urlopen(URLS['cemc'],timeout=30).read().decode()
categories=re.findall(r'data-bef-value="(\d+)">([^<]+)</a>',page)
extra={}
for cat,label in categories:
 if any(term in label for term in ['Euclid','Fryer','Galois','Hypatia','Pascal','Cayley','Fermat','Gauss','Senior','Intermediate']):
  for page_index in range(3):extra['cemc-'+cat+'-'+str(page_index)]='https://cemc.uwaterloo.ca/resources/past-contests?contest_category='+cat+'&academic_year=All&page='+str(page_index)
for i in range(3):extra['cemc-25-'+str(i)]='https://cemc.uwaterloo.ca/resources/past-contests?contest_category=25&academic_year=All&page='+str(i)
extra['checkpoint']='https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-lower-secondary/assessment/cambridge-checkpoint/'
out.update(dict(concurrent.futures.ThreadPoolExecutor(max_workers=5).map(collect,extra.items())))
(ROOT/'.work').mkdir(exist_ok=True)
(ROOT/'.work'/'learning-links.json').write_text(json.dumps(out,indent=2,ensure_ascii=False),encoding='utf8')
for key,value in out.items():print(key,len(value.get('links',[])),value.get('error',''))
