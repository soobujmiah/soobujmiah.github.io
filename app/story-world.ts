/* ═══════════════════════════════════════════════════════════════
   STORY WORLD — identity ⇄ service keyword cycle (data only).

   Particles morph between the full name and each canonical service
   title (SERVICE_SLUGS order). Each transition uses a distinct morph
   family; forward and reverse legs differ. Seeded MorphParams add
   controlled variation without consecutive repetition.
   ═══════════════════════════════════════════════════════════════ */

import { SERVICE_SLUGS, type ServiceSlug } from './services';
import type { Lang } from './content';
import type { MorphStyle } from './name-motion';

export type SceneBeat = {
  serviceIndex: number;
  slug: ServiceSlug;
  holdMs: number;
  morphMs: number;
  styleOut: MorphStyle;
  styleBack: MorphStyle;
};

/**
 * Outbound + return families — no two consecutive transitions share a
 * primary style. Includes crossflow/focal for richer variety.
 */
const BEAT_PHYSICS: readonly { out: MorphStyle; back: MorphStyle }[] = [
  { out: 'radial', back: 'horizontal' }, // Website Development
  { out: 'grid', back: 'wave' }, // Custom Software
  { out: 'edge', back: 'vertical' }, // Computer Setup
  { out: 'orbital', back: 'crossflow' }, // Android & Phone
  { out: 'dispersion', back: 'focal' }, // Small-Business Tech
  { out: 'wave', back: 'radial' }, // Graphics Design
  { out: 'vertical', back: 'grid' }, // Office Administration
  { out: 'crossflow', back: 'orbital' }, // Data Entry
];

export const STORY_BEATS: readonly SceneBeat[] = SERVICE_SLUGS.map((slug, serviceIndex) => {
  const phys = BEAT_PHYSICS[serviceIndex] ?? { out: 'radial' as const, back: 'horizontal' as const };
  return {
    serviceIndex,
    slug,
    holdMs: 2600,
    morphMs: 1900,
    styleOut: phys.out,
    styleBack: phys.back,
  };
});

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
export const KEYWORD_HOLD_MS = 2600;
