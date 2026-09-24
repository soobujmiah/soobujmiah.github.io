/* ═══════════════════════════════════════════════════════════════
   SERVICE REGISTRY — the search-intent layer.

   Deliberately NOT part of SECTION_IDS: the seven sections are the
   pager (routes, nav overlay, world-map focus, page dots). Services
   are plain static pages under /services/ that share the design
   tokens, fonts, language provider and footer, but never become a
   tenth pager page. One slug = one search intent = one route.
   ═══════════════════════════════════════════════════════════════ */

import { SITE_ORIGIN } from './sections';
import type { Lang } from './content';

export const SERVICE_SLUGS = [
  'web-development',
  'software-development',
  'computer-support',
  'android-support',
  'business-technology',
  'graphics-design',
  'office-administration',
  'data-entry',
] as const;

export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

export const SERVICES_BASE = '/services/';

export function isServiceSlug(slug: string): slug is ServiceSlug {
  return (SERVICE_SLUGS as readonly string[]).includes(slug);
}

/** Canonical href: the hub or one service page. */
export function serviceHref(slug?: ServiceSlug, lang: Lang = 'en'): string {
  const path = slug ? `${SERVICES_BASE}${slug}/` : SERVICES_BASE;
  return lang === 'bn' ? `/bn${path}` : path;
}

/** Absolute URL (canonical / OG / sitemap / JSON-LD). */
export function serviceUrl(slug?: ServiceSlug, lang: Lang = 'en'): string {
  return new URL(serviceHref(slug, lang), SITE_ORIGIN).href;
}

/** Every public service route, hub first — the sitemap and the build
    validator both derive from this list. */
export const SERVICE_ROUTES: readonly string[] = [serviceHref(), ...SERVICE_SLUGS.map((s) => serviceHref(s))];
