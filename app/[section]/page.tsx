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
  /* Unique, factual per-route metadata. Titles and descriptions are
     authored once in app/content.ts (seo.sections, aligned with
     SECTION_IDS) so the route, the sitemap, the nav and the metadata
     can never drift apart. */
  const seo = content.en.seo.sections[i];
  const url = new URL(sectionHref(i), SITE_ORIGIN).href;
  const title = seo.title;
  const description = seo.description;
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
