/* ═══════════════════════════════════════════════════════════════
   VERIFICATION ROUTES — the public evidence page, outside the pager.

   Same contract as app/services.ts: `/verification/` is a plain
   static document that shares the design tokens, fonts, language
   provider and footer, but never becomes an eighth pager page.
   ═══════════════════════════════════════════════════════════════ */

import { SITE_ORIGIN } from './sections';
import type { Lang } from './content';

export const VERIFICATION_PATH = '/verification/';

/** Canonical href for the public verification page. */
export function verificationHref(lang: Lang = 'en'): string {
  return lang === 'bn' ? `/bn${VERIFICATION_PATH}` : VERIFICATION_PATH;
}

/** Absolute URL (canonical / OG / sitemap / JSON-LD). */
export function verificationUrl(lang: Lang = 'en'): string {
  return new URL(verificationHref(lang), SITE_ORIGIN).href;
}

/** Every public verification route — the sitemap and the build validator derive from this. */
export const VERIFICATION_ROUTES: readonly string[] = [VERIFICATION_PATH];

/** True for the pager's own route matcher so /verification/ is never mistaken for a section. */
export function isVerificationPathname(pathname: string): boolean {
  return /^\/(?:bn\/)?verification(\/|$)/.test(pathname);
}
