import type { Metadata } from 'next';
import { ServicesShell } from '@/components/services/ServicesShell';
import { ServicesHub } from '@/components/services/ServiceViews';
import { hubJsonLd, hubMetadata } from '@/app/services/seo';

/* /services/ — the service-intent hub. A static document outside the
   pager (see app/services.ts for why). */
export const metadata: Metadata = hubMetadata();

export default function ServicesPage() {
  return (
    <ServicesShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hubJsonLd()) }} />
      <ServicesHub />
    </ServicesShell>
  );
}
