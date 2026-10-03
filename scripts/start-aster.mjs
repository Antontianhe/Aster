import { spawn, execFile } from 'node:child_process';
import { existsSync, mkdirSync, openSync, closeSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';

const project = fileURLToPath(new URL('../', import.meta.url));
const privateRoot = join(process.env.LOCALAPPDATA || project, 'Aster');
const site = 'http://127.0.0.1:5173/';
const runFile = promisify(execFile);
const noBrowser = process.argv.includes('--no-browser');

async function responds(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
    await response.body?.cancel();
    return response.ok;
  } catch {
    return false;
  }
}

async function waitUntil(check, name, timeout = 30000) {
  const deadline = Date.now() + timeout;
  do {
    if (await check()) return;
    await delay(500);
  } while (Date.now() < deadline);
  throw new Error(`${name} did not become ready. Logs are in ${privateRoot}.`);
}

// Detached, hidden processes keep the local site running after this launcher closes.
async function launch(executable, args, logName, extraEnv = {}, workingDirectory = project) {
  const stdout = openSync(join(privateRoot, `${logName}.out.log`), 'a');
  let stderr;
  try {
    stderr = openSync(join(privateRoot, `${logName}.err.log`), 'a');
    await new Promise((resolve, reject) => {
      const child = spawn(executable, args, {
        cwd: workingDirectory,
        env: { ...process.env, ...extraEnv },
        detached: true,
        windowsHide: true,
        stdio: ['ignore', stdout, stderr],
      });
      child.once('error', reject);
      child.once('spawn', () => { child.unref(); resolve(); });
    });
  } finally {
    closeSync(stdout);
    if (stderr !== undefined) closeSync(stderr);
  }
}

async function startWebsite() {
  if (await responds(site)) return;
  await launch(process.execPath, [
    'scripts/frontend.mjs', 'dev', '--strictPort',
  ], 'frontend');
  await waitUntil(() => responds(site), 'The website');
}

async function startDatabase() {
  const instance = join(privateRoot, 'mysql-instance');
  const bin = join(privateRoot, 'mysql-8.4.11-winx64', 'bin');
  if (!existsSync(join(instance, 'configured.json'))) {
    throw new Error('The local database is not configured. See database/README.md.');
  }
  const ping = async () => {
    try {
      await runFile(join(bin, 'mysqladmin.exe'), [
        `--defaults-extra-file=${join(instance, 'root.cnf')}`, 'ping',
      ], { windowsHide: true, timeout: 2000 });
      return true;
    } catch { return false; }
  };
  if (await ping()) return;
  await launch(join(bin, 'mysqld.exe'), [
    `--defaults-file=${join(instance, 'my.ini')}`,
  ], 'mysql-start', {}, privateRoot);
  await waitUntil(ping, 'The database');
}

async function startApi() {
  const health = 'http://127.0.0.1:5174/api/health';
  if (await responds(health)) return;
  await launch(process.execPath, ['scripts/backend.mjs', 'run'], 'api');
  await waitUntil(() => responds(health), 'The Java account service', 120000);
}

async function startAi() {
  const health = 'http://127.0.0.1:11434/api/tags';
  if (await responds(health)) return;
  await launch(join(privateRoot, 'ollama-0.34.2', 'ollama.exe'), ['serve'], 'ollama-start', {
    OLLAMA_HOST: '127.0.0.1:11434',
    OLLAMA_MODELS: join(privateRoot, 'ai-models'),
    OLLAMA_NO_CLOUD: '1',
    OLLAMA_CONTEXT_LENGTH: '4096',
  });
  await waitUntil(() => responds(health), 'The local AI', 20000);
}

try {
  mkdirSync(privateRoot, { recursive: true });
  console.log('Starting Aster...');
  await startWebsite();
  await startDatabase();
  await startApi();
  try { await startAi(); }
  catch { console.warn('Local AI is unavailable. You can still use the learning website.'); }
  console.log(`Aster is ready: ${site}`);
  if (!noBrowser) {
    await launch('rundll32.exe', ['url.dll,FileProtocolHandler', site], 'browser-start');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
