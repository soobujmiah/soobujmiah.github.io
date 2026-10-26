import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const files = ['src/App.tsx', 'src/main.tsx', 'src/data/content.ts', 'src/design-tokens.ts', 'src/scene/LabScene.ts', 'src/styles.css', 'index.html', 'scripts/make-og.py', 'DESIGN_SYSTEM.md'];
const optionalPrivateFiles = ['docs/portfolio-content-audit.md'].filter(file => fs.existsSync(path.join(root, file)));
const checkedFiles = [...files, ...optionalPrivateFiles];
const errors = [];
for (const file of checkedFiles) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  if (content.includes('\u0000')) errors.push(`${file}: contains NUL byte`);
  if (content.includes('<<<<<<<') || content.includes('>>>>>>>')) errors.push(`${file}: merge conflict marker found`);
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    if (/console\.(log|debug)\(/.test(content)) errors.push(`${file}: debug logging should not ship`);
  }
}
if (errors.length) { errors.forEach(error => console.error(`FAIL ${error}`)); process.exit(1); }
console.log(`PASS source hygiene (${checkedFiles.length} files)`);
