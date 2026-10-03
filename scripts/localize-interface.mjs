import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {parse} from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
const traverse=traverseModule.default||traverseModule,generate=generateModule.default||generateModule;
const files=['front-end/src/AppShell.jsx'];
function scan(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())scan(full);else if(full.endsWith('.jsx')&&!full.endsWith('ReviewBoundary.jsx'))files.push(full);}}
scan('front-end/src/components');
const words=new Set();
const attributes=new Set(['aria-label','title','placeholder','alt','label','description','eyebrow']);
const wrap=node=>({type:'CallExpression',callee:{type:'Identifier',name:'tr'},arguments:[node]});
const clean=text=>{const lines=text.split(/\r\n|\n|\r/);let last=0;for(let i=0;i<lines.length;i++)if(/[^ \t]/.test(lines[i]))last=i;let out='';lines.forEach((line,i)=>{let v=line.replace(/\t/g,' ');if(i!==0)v=v.replace(/^ +/,'');if(i!==lines.length-1)v=v.replace(/ +$/,'');if(v){if(i!==last)v+=' ';out+=v;}});return out;};
for(const file of files){
 const source=readFileSync(file,'utf8');
 if(source.includes("const tr = useT()")||source.includes('const tr=useT()'))continue;
 const ast=parse(source,{sourceType:'module',plugins:['jsx']});
 const components=new Set();
 traverse(ast,{Function(p){let name=p.node.id?.name;if(!name&&p.parentPath.isVariableDeclarator())name=p.parentPath.node.id.name;if(name&&/^[A-Z]/.test(name)&&p.node.body.type==='BlockStatement')components.add(p.node);}});
 function owner(p){for(let x=p.parentPath;x;x=x.parentPath)if(components.has(x.node))return x.node;return null;}
 traverse(ast,{
  JSXText(p){if(!owner(p))return;const value=clean(p.node.value);if(!value.trim())return;words.add(value.trim());p.replaceWith({type:'JSXExpressionContainer',expression:wrap({type:'StringLiteral',value})});p.skip();},
  JSXExpressionContainer:{exit(p){if(!owner(p)||p.node.expression.type==='JSXEmptyExpression')return;if(p.node.expression.type==='CallExpression'&&p.node.expression.callee.name==='tr')return;if(p.parentPath.isJSXAttribute()&&!attributes.has(p.parentPath.node.name.name))return;p.node.expression=wrap(p.node.expression);}},
  JSXAttribute(p){if(!owner(p)||!attributes.has(p.node.name.name)||p.node.value?.type!=='StringLiteral')return;words.add(p.node.value.value);p.node.value={type:'JSXExpressionContainer',expression:wrap(p.node.value)};},
 });
 for(const component of components){component.body.body.unshift({type:'VariableDeclaration',kind:'const',declarations:[{type:'VariableDeclarator',id:{type:'Identifier',name:'tr'},init:{type:'CallExpression',callee:{type:'Identifier',name:'useT'},arguments:[]}}]});}
 if(components.size){let relative=path.relative(path.dirname(file),'front-end/src/i18n.jsx').replace(/\\/g,'/');if(!relative.startsWith('.'))relative='./'+relative;ast.program.body.unshift({type:'ImportDeclaration',specifiers:[{type:'ImportSpecifier',imported:{type:'Identifier',name:'useT'},local:{type:'Identifier',name:'useT'}}],source:{type:'StringLiteral',value:relative}});writeFileSync(file,generate(ast,{compact:false,jsescOption:{minimal:true}},source).code+'\n');}
}
mkdirSync('.work/i18n',{recursive:true});
writeFileSync('.work/i18n/ui-strings.json',JSON.stringify([...words].sort(),null,2));
console.log('Converted '+files.length+' components; collected '+words.size+' interface strings.');
