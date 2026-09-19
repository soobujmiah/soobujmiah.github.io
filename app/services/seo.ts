import type { Metadata } from 'next';
import { content } from '@/app/content';
import { servicesContent } from '@/app/services-content';
import { SITE_ORIGIN } from '@/app/sections';
import { serviceUrl, type ServiceSlug } from '@/app/services';

/* ═══════════════════════════════════════════════════════════════
   SERVICE ROUTE METADATA + STRUCTURED DATA — derived from content.ts
   like every other route. `Service` with provider → the site's
   existing Person entity; `BreadcrumbList` Sobuj Miah → Services →
   page. No LocalBusiness, no offers, no ratings: nothing the page
   does not visibly say.
   ═══════════════════════════════════════════════════════════════ */

const en = content.en;
const svc = servicesContent.en;
const PERSON_ID = `${SITE_ORIGIN}/#person`;
const OG = { url: '/og.png', width: 1200, height: 630, alt: en.profile.nameFull };

function meta(title: string, description: string, url: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      alternateLocale: 'bn_BD',
      url,
      siteName: en.profile.nameFull,
      title,
      description,
      images: [OG],
    },
    twitter: { card: 'summary_large_image', title, description, images: [OG.url] },
  };
}

export function hubMetadata(): Metadata {
  return meta(svc.hubSeoTitle, svc.hubSeoDescription, serviceUrl());
}

export function pageMetadata(slug: ServiceSlug): Metadata {
  const page = svc.pages.find((p) => p.slug === slug)!;
  return meta(page.seoTitle, page.seoDescription, serviceUrl(slug));
}

const crumb = (items: { name: string; item: string }[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })),
});

export function hubJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${serviceUrl()}#page`,
        url: serviceUrl(),
        name: svc.hubSeoTitle,
        description: svc.hubSeoDescription,
        inLanguage: ['en', 'bn'],
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        about: { '@id': PERSON_ID },
        hasPart: svc.pages.map((p) => ({ '@type': 'Service', '@id': `${serviceUrl(p.slug as ServiceSlug)}#service`, name: p.title, url: serviceUrl(p.slug as ServiceSlug) })),
      },
      crumb([
        { name: en.profile.nameFull, item: `${SITE_ORIGIN}/` },
        { name: svc.labels.hub, item: serviceUrl() },
      ]),
    ],
  };
}

export function pageJsonLd(slug: ServiceSlug) {
  const page = svc.pages.find((p) => p.slug === slug)!;
  const url = serviceUrl(slug);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${url}#service`,
        name: page.title,
        description: page.short,
        url,
        serviceType: page.title,
        provider: { '@id': PERSON_ID },
        /* Service area, not a storefront: Savar/Dhaka is where the work
           happens (see /experience/ — Savar, Dhaka roles), Bangladesh is
           the home country, and delivery is remote worldwide. No address,
           hours, prices or ratings — nothing the page does not say. */
        areaServed: [{ '@type': 'City', name: 'Savar' }, { '@type': 'City', name: 'Dhaka' }, { '@type': 'Country', name: 'Bangladesh' }, { '@type': 'Place', name: 'Worldwide (remote)' }],
        availableChannel: { '@type': 'ServiceChannel', serviceUrl: url, availableLanguage: ['en', 'bn'] },
        inLanguage: ['en', 'bn'],
      },
      ...(page.faq.length > 0
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${url}#faq`,
              mainEntity: page.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
            },
          ]
        : []),
      crumb([
        { name: en.profile.nameFull, item: `${SITE_ORIGIN}/` },
        { name: svc.labels.hub, item: serviceUrl() },
        { name: page.title, item: url },
      ]),
    ],
  };
}
