import json,re,urllib.parse
from pathlib import Path
root=Path(__file__).resolve().parents[1];raw=json.loads((root/'.work/learning-links.json').read_text(encoding='utf8'));papers=[];videos=[]
names={'ig-0500':'English · First Language 0500','ig-0580':'Mathematics 0580','ig-0610':'Biology 0610','ig-0620':'Chemistry 0620','ig-0625':'Physics 0625','ig-0478':'Computer Science 0478'}
for key,name in names.items():
 links=[];seen=set()
 for row in raw[key]['links']:
  if '.pdf' in row['url'] and row['url'] not in seen:
   seen.add(row['url']);links.append({'title':re.sub(r'\s*\(PDF.*','',row['title'].replace('-->','')).strip(),'url':row['url']})
 papers.append({'id':key,'title':name,'programme':'IGCSE','provider':'Cambridge International','description':'Official released question papers, specimen papers, inserts, and mark schemes. Match the syllabus year and paper number before marking.','source':raw[key]['source'],'links':links})
sets={}
for key,value in raw.items():
 if not key.startswith('cemc'):continue
 for row in value.get('links',[]):
  filename=urllib.parse.unquote(row['url'].split('/')[-1]);match=re.match(r'(20\d\d)(Euclid|Fryer|Galois|Hypatia|Gauss|BCC)',filename)
  if not match or not filename.lower().endswith('.pdf') or 'result' in filename.lower():continue
  year,name=match.groups();suffix=re.search(r'(?:5_6|7_8|9_10|[78])(?=\.pdf)',filename);grade=' · Grades '+suffix[0].replace('_','–') if suffix else ''
  identifier=(year,name,grade);item=sets.setdefault(identifier,{'id':'contest-'+year+'-'+name+grade.replace(' ','-'),'title':name+grade+' · '+year,'programme':'Competition','provider':'Waterloo CEMC','description':'English contest paper and official worked solutions. Try the paper before opening the solution.','source':'https://cemc.uwaterloo.ca/resources/past-contests','links':[]})
  if row['url'] not in [x['url'] for x in item['links']]:item['links'].append({'title':'Worked solutions' if re.search(r'soln|solution',filename,re.I) else 'Question paper','url':row['url']})
papers+=list(sets.values())
ib='https://ibo.org/programmes/diploma-programme/assessment-and-exams/sample-exam-papers/'
for key,title,url in [
 ('aa','Mathematics: Analysis & Approaches','https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-analysis-and-approaches-specimen-papers-en.pdf'),
 ('ai','Mathematics: Applications & Interpretation','https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-specimen-papers-en.pdf'),
 ('english-a','English A: Literature · HL Paper 1','https://ibo.org/globalassets/new-structure/programmes/dp/pdfs/english-a-literature-hl-paper-1-en.pdf'),
 ('english-b','English B · SL & HL','https://ibo.org/globalassets/new-structure/programmes/dp/pdfs/english-b-hl-sl-specimen-papers-en.pdf')]:
 papers.append({'id':'ib-'+key,'title':title,'programme':'IB','provider':'International Baccalaureate','description':'Official specimen bundle with papers and marking guidance. Older specimens may differ from your current syllabus; check the first-assessment year.','source':ib,'links':[{'title':'Specimen papers & marking guidance','url':url}]})
papers.append({'id':'ib-directory','title':'IB · Official sample paper directory','programme':'IB','provider':'International Baccalaureate','description':'More official samples for English, geography, history, digital society, and mathematics. This is a public sample collection, not a complete past-paper archive.','source':ib,'links':[{'title':'Browse official samples','url':ib}]})
papers.append({'id':'checkpoint','title':'Lower Secondary · English & Checkpoint','programme':'Secondary','provider':'Cambridge International','description':'Find public specimens and the official route to further school-only papers. Ask your teacher for access to restricted support resources.','source':'https://help.cambridgeinternational.org/hc/en-gb/articles/360000055098-Where-can-I-find-past-papers-for-Cambridge-Lower-Secondary-Checkpoint','links':[{'title':'Official guidance & specimen links','url':'https://help.cambridgeinternational.org/hc/en-gb/articles/360000055098-Where-can-I-find-past-papers-for-Cambridge-Lower-Secondary-Checkpoint'}]})
papers.append({'id':'ukmt','title':'UKMT · Challenges & Olympiads','programme':'Competition','provider':'UK Mathematics Trust','description':'Search the official paper library for challenge and olympiad questions and solutions. Availability differs by paper.','source':'https://ukmt.org.uk/competition-papers','links':[{'title':'Papers & solutions library','url':'https://ukmt.org.uk/competition-papers'}]})
for row in raw['crash']['links']:
 if '/topic/' not in row['url'] or row['title'] in ['Sex Ed','Biología','Fundamentos de Química']:continue
 title=row['title'];subject='Science' if any(w in title.lower() for w in ['biology','chemistry','physics','anatomy','botany','ecology','astronomy','zoology','geology']) else 'Computing' if any(w in title.lower() for w in ['computer','artificial','engineering','ai']) else 'English' if any(w in title.lower() for w in ['literature','linguistics']) else 'Mathematics' if title=='Statistics' else 'Humanities'
 videos.append({'id':'video-'+row['url'].split('/')[-2],'title':title,'subject':subject,'provider':'Crash Course','kind':'Video collection','url':row['url'],'tags':[title.lower()]})
videos[:0]=[
 {'id':'calculus','title':'The essence of calculus','subject':'Mathematics','provider':'3Blue1Brown','kind':'Video lesson','youtube':'WUvTyaaNkzM','url':'https://www.youtube.com/watch?v=WUvTyaaNkzM','tags':['calculus','derivatives','integration','functions']},
 {'id':'derivatives','title':'Derivative formulas through geometry','subject':'Mathematics','provider':'3Blue1Brown','kind':'Video lesson','youtube':'S0_qX4VJhMQ','url':'https://www.youtube.com/watch?v=S0_qX4VJhMQ','tags':['calculus','derivatives','geometry']},
 {'id':'supply','title':'The supply curve','subject':'Humanities','provider':'Marginal Revolution University','kind':'Video lesson','youtube':'nKvrbOq1OfI','url':'https://www.youtube.com/watch?v=nKvrbOq1OfI','tags':['economics','supply','market']},
 {'id':'photosynthesis','title':'Photosynthesis','subject':'Science','provider':'Khan Academy','kind':'Video lesson','url':'https://www.khanacademy.org/science/biology/v/photosynthesis','tags':['photosynthesis','biology','plants']},
 {'id':'atoms','title':'Elements and atoms','subject':'Science','provider':'Khan Academy','kind':'Video lesson','url':'https://www.khanacademy.org/science/chemistry/v/elements-and-atoms','tags':['atoms','chemistry','elements']},
 {'id':'quadratic','title':'The quadratic formula','subject':'Mathematics','provider':'Khan Academy','kind':'Video lesson','url':'https://www.khanacademy.org/math/revision-term-1-mh-math-class-10/x041ca11815640a3a%3Aweek-2/x041ca11815640a3a%3Aquadratic-equations/v/the-quadratic-formula-indian-accent','tags':['quadratic','algebra','equations']}
]
videos=list({v['url']:v for v in videos}.values())
(root/'front-end/src/learningCatalog.js').write_text('// Official public resource links checked 20 September 2026.\nexport const PAPER_COLLECTIONS='+json.dumps(papers,ensure_ascii=False,indent=1)+';\nexport const TOPIC_VIDEOS='+json.dumps(videos,ensure_ascii=False,indent=1)+';\n',encoding='utf8')
print(len(papers),'paper collections;',sum(len(x['links']) for x in papers),'paper/resource links;',len(videos),'video lessons and collections')
