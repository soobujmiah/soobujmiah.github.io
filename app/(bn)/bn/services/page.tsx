import type { Metadata } from 'next';
import { ServicesShell } from '@/components/services/ServicesShell';
import { ServicesHub } from '@/components/services/ServiceViews';
import { hubJsonLd, hubMetadata } from '@/app/services/seo';

export const metadata: Metadata = hubMetadata('bn');

export default function BengaliServicesPage() {
  return (
    <ServicesShell lang="bn">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hubJsonLd('bn')) }} />
      <ServicesHub />
    </ServicesShell>
  );
}
