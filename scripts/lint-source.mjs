import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const files = [
  'src/App.tsx', 'src/main.tsx', 'src/data/site-content.json',
  'src/scene/WorkbenchScene.ts', 'src/styles.css', 'index.html',
  'scripts/create-routes.mjs', 'scripts/verify-portfolio.mjs', 'scripts/make-og.py',
  'README.md', 'DESIGN_SYSTEM.md',
];
const errors = [];
for (const file of files) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) { errors.push(`${file}: required source file is missing`); continue; }
  const content = fs.readFileSync(full, 'utf8');
  if (content.includes('\u0000')) errors.push(`${file}: contains NUL byte`);
  if (content.includes('<<<<<<<') || content.includes('>>>>>>>')) errors.push(`${file}: merge conflict marker found`);
  if (/\.(?:tsx?|mjs)$/.test(file) && /console\.(?:log|debug)\(/.test(content) && !file.endsWith('create-routes.mjs') && !file.endsWith('verify-portfolio.mjs')) errors.push(`${file}: debug logging should not ship`);
}
try { JSON.parse(fs.readFileSync(path.join(root, 'src/data/site-content.json'), 'utf8')); }
catch (error) { errors.push(`site-content.json: ${error.message}`); }
if (errors.length) { errors.forEach(error => console.error(`FAIL ${error}`)); process.exit(1); }
console.log(`PASS source hygiene (${files.length} files)`);
