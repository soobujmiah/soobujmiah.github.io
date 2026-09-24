import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Pager } from '@/components/Pager';
import { SECTION_IDS, indexForSlug } from '@/app/sections';
import { sectionMetadata } from '@/app/route-seo';

export const dynamicParams = false;

export function generateStaticParams() {
  return SECTION_IDS.filter((id) => id !== 'home').map((section) => ({ section }));
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params;
  const index = indexForSlug(section);
  return index === null ? {} : sectionMetadata(index, 'bn');
}

export default async function BengaliSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const index = indexForSlug(section);
  if (index === null || index === 0) notFound();
  return <Pager initialIndex={index} initialLang="bn" />;
}
