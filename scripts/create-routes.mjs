import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const rootDocument = path.join(dist, 'index.html');
if (!fs.existsSync(rootDocument)) throw new Error('Build root index.html before generating routes.');

const routes = [
  'work',
  'process',
  'services',
  'about',
  'notes',
  'contact',
  ...['ternux', 'ternuxx', 'adt', 'lai', 'ggen', 'songjog'].map(id => `work/${id}`),
];
for (const route of routes) {
  const directory = path.join(dist, route);
  fs.mkdirSync(directory, { recursive: true });
  fs.copyFileSync(rootDocument, path.join(directory, 'index.html'));
}
console.log(`Generated ${routes.length} direct-load routes, including /about/.`);
