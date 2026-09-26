import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, 'data/verification.json'), 'utf8'));
const content = fs.readFileSync(path.join(root, 'app/content.ts'), 'utf8');
const cvEn = fs.readFileSync(path.join(root, 'tools/make_cv_en.py'), 'utf8');
const cvBn = fs.readFileSync(path.join(root, 'tools/make_cv_bn.py'), 'utf8');

const failures = [];
for (const [id, p] of Object.entries(registry.projects)) {
  if (!content.includes(p.name)) failures.push(`content missing project: ${p.name}`);
  if (!content.includes(p.evidence.en)) failures.push(`EN portfolio evidence drift: ${p.name}`);
  if (!content.includes(p.evidence.bn)) failures.push(`BN portfolio evidence drift: ${p.name}`);
  if (!cvEn.includes(p.name)) failures.push(`EN CV missing project: ${p.name}`);
  const cvName = id === 'songjog' ? 'Songjog' : p.name;
  if (!cvEn.includes(cvName)) failures.push(`EN CV missing project label: ${p.name}`);
  if (id !== 'songjog' && !cvBn.includes(p.name)) failures.push(`BN CV missing project: ${p.name}`);
  if (!cvBn.includes(p.evidence.bn)) failures.push(`BN CV evidence drift: ${p.name}`);
  if (!cvEn.includes(p.evidence.en)) failures.push(`EN CV evidence drift: ${p.name}`);
  if (!/^[0-9a-f]{40}$/.test(p.evidenceCommit) || !/^[0-9a-f]{40}$/.test(p.liveHead)) failures.push(`invalid commit SHA: ${id}`);
}
if (!fs.existsSync(path.join(root, 'app/verification/page.tsx'))) failures.push('EN verification page missing');
if (!fs.existsSync(path.join(root, 'app/(bn)/bn/verification/page.tsx'))) failures.push('BN verification page missing');
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Verification consistency gate passed for ${Object.keys(registry.projects).length} projects.`);
