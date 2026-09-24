import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Pager } from '@/components/Pager';
import { SECTION_IDS, indexForSlug } from '@/app/sections';
import { sectionMetadata } from '@/app/route-seo';

/* ═══════════════════════════════════════════════════════════════
   SECTION ROUTES — the smallest change that makes the pager
   addressable.

   The cinematic pager stays exactly as it was; it is now mounted at a
   real URL per section, with the section's own server-rendered HTML,
   its own <title>/description/canonical, and its own social card.
   A visitor can be sent straight to the work page, a crawler can
   index each section directly, and the pager still turns.
   ═══════════════════════════════════════════════════════════════ */

export const dynamicParams = false;

/** Keep old stack/open-source URLs as canonicalized entry routes. */
export function generateStaticParams() {
  return [...SECTION_IDS.filter((id) => id !== 'home'), 'stack', 'open-source'].map((id) => ({ section: id as string }));
}

/* Next 15 made route params asynchronous: await them once, at the top,
   and everything below stays exactly as it was. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const i = indexForSlug(section);
  return i === null ? {} : sectionMetadata(i, 'en');
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const i = indexForSlug(section);
  if (i === null) notFound();
  return <Pager initialIndex={i} />;
}
