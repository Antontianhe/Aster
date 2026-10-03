import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = fileURLToPath(new URL('../front-end/', import.meta.url));
const requireFrontend = createRequire(new URL('../front-end/package.json', import.meta.url));
const command = process.argv[2] || 'dev';
if (!['dev', 'build', 'preview'].includes(command)) throw new Error('Choose dev, build, or preview.');
const vite = join(dirname(requireFrontend.resolve('vite/package.json')), 'bin', 'vite.js');
const args = command === 'dev' ? ['--host', '127.0.0.1'] : [command, ...(command === 'preview' ? ['--host', '127.0.0.1'] : [])];
const child = spawn(process.execPath, [vite, ...args, '--configLoader', 'native', ...process.argv.slice(3)], {
  cwd: frontend, stdio: 'inherit', windowsHide: true,
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
