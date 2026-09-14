import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Pager } from '@/components/Pager';
import { SECTION_IDS, SITE_ORIGIN, indexForSlug, sectionHref } from '@/app/sections';
import { content } from '@/app/content';

/* ═══════════════════════════════════════════════════════════════
   SECTION ROUTES — the smallest change that makes the pager
   addressable.

   The cinematic pager stays exactly as it was; it is now mounted at a
   real URL per section, with the section's own server-rendered HTML,
   its own <title>/description/canonical, and its own social card.
   A visitor can be sent straight to the work page, a crawler can
   index nine real pages instead of one, and the pager still turns.
   ═══════════════════════════════════════════════════════════════ */

export const dynamicParams = false;

/** Home is served by `app/page.tsx`; the other eight are generated here. */
export function generateStaticParams() {
  return SECTION_IDS.filter((id) => id !== 'home').map((id) => ({ section: id as string }));
}

export function generateMetadata({ params }: { params: { section: string } }): Metadata {
  const i = indexForSlug(params.section);
  if (i === null) return {};
  const label = content.en.ui.pageLabels[i];
  const url = new URL(sectionHref(i), SITE_ORIGIN).href;
  const title = `${label} — ${content.en.profile.nameFull}`;
  const description = `${label} — ${content.en.profile.title}. ${content.en.hero.intro}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      alternateLocale: 'bn_BD',
      url,
      siteName: content.en.profile.nameFull,
      title,
      description,
      images: [{ url: '/og.png', width: 1200, height: 630, alt: content.en.profile.nameFull }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og.png'],
    },
  };
}

export default function SectionPage({ params }: { params: { section: string } }) {
  const i = indexForSlug(params.section);
  if (i === null) notFound();
  return <Pager initialIndex={i} />;
}
