/**
 * Instala pre-commit: bump de versión + stage de archivos.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const gitDir = path.join(root, '.git');
const hooksDir = path.join(gitDir, 'hooks');

if (!fs.existsSync(gitDir)) {
  console.log('[hooks] no .git — skip');
  process.exit(0);
}

fs.mkdirSync(hooksDir, { recursive: true });

const hook = `#!/bin/sh
# Auto-bump patch version (Ally Flow API)
if [ "$SKIP_VERSION_BUMP" = "1" ]; then
  exit 0
fi
node scripts/bump-version.mjs || exit 1
git add src/version.ts package.json
`;

const hookPath = path.join(hooksDir, 'pre-commit');
fs.writeFileSync(hookPath, hook.replace(/\r\n/g, '\n'));
try {
  fs.chmodSync(hookPath, 0o755);
} catch {
  /* Windows */
}
console.log('[hooks] pre-commit instalado (bump versión back)');
