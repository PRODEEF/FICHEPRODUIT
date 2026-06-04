/**
 * Si dist/ a été supprimé manuellement, le watch Nest peut afficher « 0 errors »
 * sans réémettre les fichiers (cache tsconfig.build.tsbuildinfo).
 * Ce script force un build complet tant que dist/main.js est absent.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');
const mainJs = path.join(backendRoot, 'dist', 'main.js');
const tsbuildinfo = path.join(backendRoot, 'tsconfig.build.tsbuildinfo');
const nestCli = path.join(backendRoot, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');

if (fs.existsSync(mainJs)) {
  process.exit(0);
}

// dist/ absent mais cache incrémental présent → tsc/nest croient que tout est à jour
try {
  fs.unlinkSync(tsbuildinfo);
} catch {
  // absent : OK
}
try {
  fs.rmSync(path.join(backendRoot, 'dist'), { recursive: true, force: true });
} catch {
  // absent : OK
}

const result = spawnSync(process.execPath, [nestCli, 'build'], {
  cwd: backendRoot,
  stdio: 'inherit',
});

if (!fs.existsSync(mainJs)) {
  console.error('[ensure-dist-built] Échec : dist/main.js introuvable après le build.');
  process.exit(result.status === 0 ? 1 : (result.status ?? 1));
}

process.exit(0);
