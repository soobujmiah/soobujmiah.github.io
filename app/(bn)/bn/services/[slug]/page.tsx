import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SERVICE_SLUGS, isServiceSlug } from '@/app/services';
import { ServicesShell } from '@/components/services/ServicesShell';
import { ServiceDetail } from '@/components/services/ServiceViews';
import { pageJsonLd, pageMetadata } from '@/app/services/seo';

export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return isServiceSlug(slug) ? pageMetadata(slug, 'bn') : {};
}

export default async function BengaliServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isServiceSlug(slug)) notFound();
  return (
    <ServicesShell slug={slug} lang="bn">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd(slug, 'bn')) }} />
      <ServiceDetail slug={slug} />
    </ServicesShell>
  );
}
