/* ═══════════════════════════════════════════════════════════════
   SECTION REGISTRY — one list that drives the pager, the routes,
   the navigation overlay, the sitemap, and the build validators.

   Adding a section here is the only edit needed for it to gain a
   real, static, shareable URL (`/work/`), an entry in the nav
   overlay, and a sitemap line. The pager stays the presentation
   layer; the route is the address.
   ═══════════════════════════════════════════════════════════════ */

export const SECTION_IDS = [
  'home',
  'presence',
  'about',
  'work',
  'research',
  'stack',
  'open-source',
  'experience',
  'contact',
] as const;

export type SectionId = (typeof SECTION_IDS)[number];
export type SectionLanguage = 'en' | 'bn';

export const PAGE_COUNT = SECTION_IDS.length;

/** Index of a section slug, or null when the slug is not a section. */
export function indexForSlug(slug: string): number | null {
  const i = (SECTION_IDS as readonly string[]).indexOf(slug);
  return i >= 0 ? i : null;
}

/** Canonical, shareable href for a section. Home is the site root. */
export function sectionHref(index: number, lang: SectionLanguage = 'en'): string {
  const id = SECTION_IDS[index];
  const path = id === undefined || id === 'home' ? '/' : `/${id}/`;
  return lang === 'bn' ? (path === '/' ? '/bn/' : `/bn${path}`) : path;
}

/** Absolute URL (canonical/OG/sitemap). */
export const SITE_ORIGIN = 'https://soobujmiah.github.io';

export function sectionUrl(index: number, lang: SectionLanguage = 'en'): string {
  return new URL(sectionHref(index, lang), SITE_ORIGIN).href;
}

/** Resolve a browser pathname back to a section index. */
export function indexFromPathname(pathname: string): number {
  const cleaned = pathname.replace(/^\/bn(?=\/|$)/, '').replace(/^\/+|\/+$/g, '');
  if (cleaned === '') return 0;
  const i = indexForSlug(cleaned);
  return i === null ? 0 : i;
}
