/* ═══════════════════════════════════════════════════════════════
   STORY WORLD — identity ⇄ service keyword cycle (data only).

   Particles morph between the full name and each canonical service
   title (SERVICE_SLUGS order). Titles are inlined (not imported from
   services-content) so the pager never pulls the service-page tree.

   Each transition uses a distinct morph physics profile. Forward and
   reverse legs of the same beat pair use related but different styles
   so consecutive transitions never feel identical.
   ═══════════════════════════════════════════════════════════════ */

import { SERVICE_SLUGS, type ServiceSlug } from './services';
import type { Lang } from './content';
import type { MorphStyle } from './name-motion';

export type SceneBeat = {
  serviceIndex: number;
  slug: ServiceSlug;
  holdMs: number;
  morphMs: number;
  /** Name → service morph. */
  styleOut: MorphStyle;
  /** Service → name morph (distinct from styleOut). */
  styleBack: MorphStyle;
};

/**
 * Eight outbound + eight return styles — no two consecutive transitions
 * share the same profile. Order locked to SERVICE_SLUGS.
 */
const BEAT_PHYSICS: readonly { out: MorphStyle; back: MorphStyle }[] = [
  { out: 'radial', back: 'horizontal' }, // Website Development
  { out: 'grid', back: 'wave' }, // Custom Software
  { out: 'edge', back: 'vertical' }, // Computer Setup
  { out: 'orbital', back: 'horizontal' }, // Android & Phone
  { out: 'dispersion', back: 'edge' }, // Small-Business Tech
  { out: 'wave', back: 'radial' }, // Graphics Design
  { out: 'vertical', back: 'grid' }, // Office Administration
  { out: 'horizontal', back: 'orbital' }, // Data Entry
];

export const STORY_BEATS: readonly SceneBeat[] = SERVICE_SLUGS.map((slug, serviceIndex) => {
  const phys = BEAT_PHYSICS[serviceIndex] ?? { out: 'radial' as const, back: 'horizontal' as const };
  return {
    serviceIndex,
    slug,
    holdMs: 2500,
    morphMs: 1800,
    styleOut: phys.out,
    styleBack: phys.back,
  };
});

/** Canonical service titles — aligned with services-content. */
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

export function serviceKeywords(lang: Lang): string[] {
  const list = KEYWORDS[lang] ?? KEYWORDS.en;
  return SERVICE_SLUGS.map((_, i) => list[i] ?? SERVICE_SLUGS[i]);
}

export const NAME_HOLD_MS = 3000;
export const KEYWORD_HOLD_MS = 2500;
