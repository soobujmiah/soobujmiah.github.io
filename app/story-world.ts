/* ═══════════════════════════════════════════════════════════════
   STORY WORLD — compact service-keyword cycle (data only).

   The Hero no longer draws large service illustrations. Identity
   particles morph geometrically between the full name and each
   canonical service title (SERVICE_SLUGS order).

   Titles are inlined here (not imported from services-content) so the
   pager JS graph never pulls the full service-page copy tree.
   ═══════════════════════════════════════════════════════════════ */

import { SERVICE_SLUGS, type ServiceSlug } from './services';
import type { Lang } from './content';

export type SceneBeat = {
  /** Index into the service keyword list for the active language. */
  serviceIndex: number;
  slug: ServiceSlug;
  holdMs: number;
  morphMs: number;
  motion: 'gentle' | 'precise' | 'settle';
};

/** Deterministic service order = SERVICE_SLUGS (Services registry). */
export const STORY_BEATS: readonly SceneBeat[] = SERVICE_SLUGS.map((slug, serviceIndex) => ({
  serviceIndex,
  slug,
  holdMs: 2200,
  morphMs: 1600,
  motion: 'precise' as const,
}));

/** Canonical service titles — must stay aligned with services-content. */
const KEYWORDS: Record<Lang, readonly string[]> = {
  en: [
    'Website Development',
    'Custom Software Development',
    'Computer Setup & Troubleshooting',
    'Android & Phone Software Support',
    'Small-Business Technology Support',
    'Graphics Design',
    'Office Administration & Operations Support',
    'Data Entry & Data Work',
  ],
  bn: [
    'ওয়েবসাইট তৈরি',
    'কাস্টম সফটওয়্যার তৈরি',
    'কম্পিউটার সেটআপ ও সমস্যা সমাধান',
    'অ্যান্ড্রয়েড ও ফোন সফটওয়্যার সহায়তা',
    'ছোট ব্যবসার প্রযুক্তি সহায়তা',
    'গ্রাফিক্স ডিজাইন',
    'অফিস প্রশাসন ও অপারেশনস সহায়তা',
    'ডেটা এন্ট্রি ও ডেটা কাজ',
  ],
};

/** Canonical service titles for a language, in SERVICE_SLUGS order. */
export function serviceKeywords(lang: Lang): string[] {
  const list = KEYWORDS[lang] ?? KEYWORDS.en;
  // Length is locked to SERVICE_SLUGS; never invent extras.
  return SERVICE_SLUGS.map((_, i) => list[i] ?? SERVICE_SLUGS[i]);
}

/** Hold the name between each service keyword (ms). */
export const NAME_HOLD_MS = 2800;
/** Hold each service keyword (ms) — overridden per beat when needed. */
export const KEYWORD_HOLD_MS = 2200;
