/* ═══════════════════════════════════════════════════════════════
   STORY WORLD — compact service-keyword cycle (data only).

   Identity particles morph geometrically between the full name and
   each canonical service title (SERVICE_SLUGS order). Titles are
   inlined (not imported from services-content) so the pager JS
   graph never pulls the full service-page copy tree.

   Morph styles are deliberate per beat — same visual language,
   controlled variation, never random service order.
   ═══════════════════════════════════════════════════════════════ */

import { SERVICE_SLUGS, type ServiceSlug } from './services';
import type { Lang } from './content';
import type { MorphStyle } from './name-motion';

export type SceneBeat = {
  /** Index into the service keyword list for the active language. */
  serviceIndex: number;
  slug: ServiceSlug;
  holdMs: number;
  morphMs: number;
  /** Deliberate geometric morph language for this beat (and its reverse). */
  style: MorphStyle;
};

/**
 * Morph style rotation across the service sequence — each beat gets a
 * distinct but related motion so the cycle never feels mechanical.
 * Order is locked to SERVICE_SLUGS; styles do not shuffle services.
 */
const BEAT_STYLES: readonly MorphStyle[] = [
  'axis', // Website Development
  'sweep', // Custom Software
  'compress', // Computer Setup
  'converge', // Android & Phone
  'wave', // Small-Business Tech
  'axis', // Graphics Design
  'sweep', // Office Administration
  'compress', // Data Entry
];

/** Deterministic service order = SERVICE_SLUGS (Services registry). */
export const STORY_BEATS: readonly SceneBeat[] = SERVICE_SLUGS.map((slug, serviceIndex) => ({
  serviceIndex,
  slug,
  holdMs: 2400,
  morphMs: 1750,
  style: BEAT_STYLES[serviceIndex] ?? 'axis',
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
  return SERVICE_SLUGS.map((_, i) => list[i] ?? SERVICE_SLUGS[i]);
}

/** Hold the name between each service keyword (ms). */
export const NAME_HOLD_MS = 3000;
/** Hold each service keyword (ms) — overridden per beat when needed. */
export const KEYWORD_HOLD_MS = 2400;
