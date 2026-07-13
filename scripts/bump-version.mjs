/**
 * Sube el patch de APP_VERSION (1.0.0 → 1.0.1).
 * Uso: node scripts/bump-version.mjs
 * Saltar: SKIP_VERSION_BUMP=1 git commit ...
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const versionFile = path.join(root, 'src', 'version.ts');
const pkgFile = path.join(root, 'package.json');

if (process.env.SKIP_VERSION_BUMP === '1') {
  console.log('[version] skip (SKIP_VERSION_BUMP=1)');
  process.exit(0);
}

const src = fs.readFileSync(versionFile, 'utf8');
const m = src.match(/export const APP_VERSION = '(\d+)\.(\d+)\.(\d+)'/);
if (!m) {
  console.error('[version] no se encontró APP_VERSION en', versionFile);
  process.exit(1);
}

const next = `${m[1]}.${m[2]}.${Number(m[3]) + 1}`;
fs.writeFileSync(
  versionFile,
  src.replace(/export const APP_VERSION = '\d+\.\d+\.\d+'/, `export const APP_VERSION = '${next}'`),
);

const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
pkg.version = next;
fs.writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(`[version] back ${m[1]}.${m[2]}.${m[3]} → ${next}`);
