/**
 * Lance le CLI Nest avec un PATH contenant System32 sous Windows.
 * Certains environnements (ex. terminal intégré) tronquent le PATH et
 * excluent System32, ce qui casse `nest start --watch` (appel à taskkill).
 */
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');
const nestCli = path.join(backendRoot, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');
const ensureDist = path.join(__dirname, 'ensure-dist-built.mjs');

const ensureResult = spawnSync(process.execPath, [ensureDist], {
  cwd: backendRoot,
  stdio: 'inherit',
});
if (ensureResult.status !== 0) {
  process.exit(ensureResult.status ?? 1);
}

const env = { ...process.env };
if (process.platform === 'win32') {
  const systemRoot = env.SystemRoot ?? env.WINDIR ?? 'C:\\Windows';
  const system32 = path.join(systemRoot, 'System32');
  env.PATH = `${system32}${path.delimiter}${env.PATH ?? ''}`;
}

const child = spawn(process.execPath, [nestCli, ...process.argv.slice(2)], {
  cwd: backendRoot,
  env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  process.exit(signal ? 1 : code ?? 1);
});
