import {spawn} from 'node:child_process';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const project=fileURLToPath(new URL('../',import.meta.url));
const backend=join(project,'back-end');
const manifest=join(process.env.LOCALAPPDATA || process.env.HOME,'Aster','toolchains','tools.json');
const jar=join(backend,'target','aster-backend.jar');
function execute(command,args){return new Promise((resolve,reject)=>{
  const child=spawn(command,args,{cwd:backend,stdio:'inherit',windowsHide:true});
  const interrupt=signal=>child.kill(signal);
  process.on('SIGINT',interrupt);process.on('SIGTERM',interrupt);
  child.once('error',reject);
  child.once('exit',(code,signal)=>{process.off('SIGINT',interrupt);process.off('SIGTERM',interrupt);if(code===0)resolve();else reject(new Error(`Backend command failed (${code ?? signal}).`));});
});}
function latestSource(path){return Math.max(statSync(path).mtimeMs,...(statSync(path).isDirectory()?readdirSync(path).map(name=>latestSource(join(path,name))):[]));}
async function maven(args){await execute('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',join(backend,'maven.ps1'),'-B','-ntp',...args]);}
try{
  if(!existsSync(manifest))await execute('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',join(backend,'install-tools.ps1')]);
  const command=process.argv[2]||'run';
  if(command==='build')await maven(['-DskipTests','package',...process.argv.slice(3)]);
  else if(command==='test')await maven(['test',...process.argv.slice(3)]);
  else if(command==='run'){
    if(!existsSync(jar)||Math.max(latestSource(join(backend,'src','main')),statSync(join(backend,'pom.xml')).mtimeMs)>statSync(jar).mtimeMs)await maven(['-DskipTests','package']);
    const tools=JSON.parse(readFileSync(manifest,'utf8').replace(/^\uFEFF/,''));
    await execute(join(tools.javaHome,'bin','java.exe'),['-Xmx512m','-Duser.timezone=UTC','-jar',jar,...process.argv.slice(3)]);
  }else throw new Error('Use backend.mjs run, build, or test.');
}catch(error){console.error(error.message);process.exitCode=1;}
