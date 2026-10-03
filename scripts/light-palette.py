import re,colorsys
from pathlib import Path
colors={}
def transform(prop,value):
 def replace(m):
  h=m.group()[1:]
  if len(h) in (3,4):h=''.join(c*2 for c in h)
  if len(h) not in (6,8):return m.group()
  r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
  hue,light,sat=colorsys.rgb_to_hls(r,g,b)
  kind='fg' if prop in ('color','fill','stroke') else 'bg' if prop.startswith('background') else 'border'
  if kind=='fg':
   if light<.43:return m.group()
   rr,gg,bb=colorsys.hls_to_rgb(hue,.30 if light<.78 else .22,min(sat,.62))
  elif kind=='bg':
   if light>.42:return m.group()
   rr,gg,bb=colorsys.hls_to_rgb(hue,.975-max(0,.25-light)*.04,min(sat,.7))
  else:
   rr,gg,bb=colorsys.hls_to_rgb(hue,.56,min(sat,.5))
  new='#'+''.join(f'{round(c*255):02x}' for c in (rr,gg,bb))+(h[6:] if len(h)==8 else '')
  key='--light-'+kind+'-'+h
  colors[key]=new
  return 'var('+key+','+m.group()+')'
 return re.sub(r'#[0-9a-fA-F]{3,8}\b',replace,value)
paths=[Path('front-end/src/neon-shell.css'),*Path('front-end/src/components').rglob('*.module.css')]
for p in paths:
 if p.name=='Account.module.css':continue
 text=p.read_text(encoding='utf-8')
 if '--light-fg-' in text:continue
 def declaration(m):
  prop,value=m.group(1),m.group(2)
  return prop+':'+transform(prop,value)
 text=re.sub(r'(?<![-\w])(color|fill|stroke|background(?:-color)?|border(?:-color|-top-color|-bottom-color|-right-color|-left-color)?)\s*:\s*([^;}]+)',declaration,text)
 p.write_text(text,encoding='utf-8')
Path('front-end/src/light-palette.css').write_text(':root[data-visual=aurora][data-theme=light]{\n'+''.join(k+':'+v+';\n' for k,v in colors.items())+'}\n',encoding='utf-8')
p=Path('front-end/src/main.jsx');s=p.read_text();s=s.replace("import './appearance.css';","import './light-palette.css';\nimport './appearance.css';");p.write_text(s)
print('Generated',len(colors),'scoped light-theme colors.')
