/**
 * Builds public/social-icons.svg — an external <symbol> sprite of the brand
 * marks used on the contact page.
 *
 * Keeping the marks in a sprite file rather than the React bundle means the
 * ~21 logos cost the JavaScript bundle nothing at all: the browser only
 * fetches the file on the pages that actually render a social icon, and it is
 * cached after the first request.
 *
 * Source: simple-icons (ISC). LinkedIn is not shipped by simple-icons, so it is
 * supplied below as a hand-written path.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as icons from 'simple-icons';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const LINKEDIN = {
  title: 'LinkedIn',
  path: 'M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z',
};

/** id in the sprite -> simple-icons export name */
const WANTED = [
  ['x', 'siX'],
  ['instagram', 'siInstagram'],
  ['threads', 'siThreads'],
  ['facebook', 'siFacebook'],
  ['youtube', 'siYoutube'],
  ['linkedin', LINKEDIN],
  ['telegram', 'siTelegram'],
  ['whatsapp', 'siWhatsapp'],
  ['github', 'siGithub'],
  ['devdotto', 'siDevdotto'],
  ['medium', 'siMedium'],
  ['hashnode', 'siHashnode'],
  ['stackoverflow', 'siStackoverflow'],
  ['huggingface', 'siHuggingface'],
  ['aboutme', 'siAboutdotme'],
  ['peerlist', 'siPeerlist'],
  ['wordpress', 'siWordpress'],
  ['producthunt', 'siProducthunt'],
  ['buymeacoffee', 'siBuymeacoffee'],
  ['patreon', 'siPatreon'],
  ['gravatar', 'siGravatar'],
];

const symbols = WANTED.map(([id, source]) => {
  const icon = typeof source === 'string' ? icons[source] : source;
  if (!icon?.path) throw new Error(`Missing brand path for "${id}"`);
  return `  <symbol id="si-${id}" viewBox="0 0 24 24"><title>${icon.title}</title><path d="${icon.path}" /></symbol>`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" aria-hidden="true">\n${symbols.join('\n')}\n</svg>\n`;

mkdirSync(join(root, 'public'), { recursive: true });
const target = join(root, 'public', 'social-icons.svg');
writeFileSync(target, svg);

console.log(`social sprite: ${WANTED.length} marks, ${(svg.length / 1024).toFixed(1)} KiB -> public/social-icons.svg`);
