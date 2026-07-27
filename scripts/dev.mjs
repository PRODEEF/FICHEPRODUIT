import { spawn } from 'node:child_process';

/**
 * Lance backend + frontend en parallèle (compatible Windows / macOS / Linux).
 * Remplace `cmd1 & cmd2`, qui ne fonctionne pas sous l’interpréteur npm Windows.
 */
const scripts = ['dev:backend', 'dev:frontend'];

const children = scripts.map((script) => {
  const child = spawn('npm', ['run', script], {
    stdio: 'inherit',
    shell: true,
  });

  child.on('exit', (code, signal) => {
    for (const other of children) {
      if (other !== child && !other.killed) {
        other.kill(signal ?? undefined);
      }
    }
    if (code !== 0 && code !== null) {
      process.exitCode = code;
    }
  });

  return child;
});
