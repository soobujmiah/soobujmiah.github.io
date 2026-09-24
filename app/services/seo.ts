import type { Metadata } from 'next';
import { content } from '@/app/content';
import { servicesContent } from '@/app/services-content';
import { SITE_ORIGIN } from '@/app/sections';
import { serviceUrl, type ServiceSlug } from '@/app/services';
import type { Lang } from '@/app/content';

/* ═══════════════════════════════════════════════════════════════
   SERVICE ROUTE METADATA + STRUCTURED DATA — derived from content.ts
   like every other route. `Service` with provider → the site's
   existing Person entity; `BreadcrumbList` Sobuj Miah → Services →
   page. No LocalBusiness, no offers, no ratings: nothing the page
   does not visibly say.
   ═══════════════════════════════════════════════════════════════ */

const PERSON_ID = `${SITE_ORIGIN}/#person`;
const OG = { url: '/og.png', width: 1200, height: 630 };

function meta(title: string, description: string, url: string, enUrl: string, bnUrl: string, lang: Lang): Metadata {
  const person = content[lang].profile.nameFull;
  return {
    title,
    description,
    alternates: { canonical: url, languages: { en: enUrl, bn: bnUrl, 'x-default': enUrl } },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      locale: lang === 'en' ? 'en_US' : 'bn_BD',
      alternateLocale: lang === 'en' ? 'bn_BD' : 'en_US',
      url,
      siteName: person,
      title,
      description,
      images: [{ ...OG, alt: person }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [OG.url] },
  };
}

export function hubMetadata(lang: Lang = 'en'): Metadata {
  const svc = servicesContent[lang];
  return meta(svc.hubSeoTitle, svc.hubSeoDescription, serviceUrl(undefined, lang), serviceUrl(), serviceUrl(undefined, 'bn'), lang);
}

export function pageMetadata(slug: ServiceSlug, lang: Lang = 'en'): Metadata {
  const page = servicesContent[lang].pages.find((p) => p.slug === slug)!;
  return meta(page.seoTitle, page.seoDescription, serviceUrl(slug, lang), serviceUrl(slug), serviceUrl(slug, 'bn'), lang);
}

const crumb = (items: { name: string; item: string }[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })),
});

export function hubJsonLd(lang: Lang = 'en') {
  const identity = content[lang];
  const svc = servicesContent[lang];
  const url = serviceUrl(undefined, lang);
  const home = lang === 'en' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}/bn/`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#page`,
        url,
        name: svc.hubSeoTitle,
        description: svc.hubSeoDescription,
        inLanguage: lang,
        isPartOf: { '@id': `${home}#website` },
        about: { '@id': PERSON_ID },
        hasPart: svc.pages.map((p) => ({ '@type': 'Service', '@id': `${serviceUrl(p.slug as ServiceSlug, lang)}#service`, name: p.title, url: serviceUrl(p.slug as ServiceSlug, lang) })),
      },
      crumb([
        { name: identity.profile.nameFull, item: home },
        { name: svc.labels.hub, item: url },
      ]),
    ],
  };
}

export function pageJsonLd(slug: ServiceSlug, lang: Lang = 'en') {
  const identity = content[lang];
  const svc = servicesContent[lang];
  const page = svc.pages.find((p) => p.slug === slug)!;
  const url = serviceUrl(slug, lang);
  const home = lang === 'en' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}/bn/`;
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
        inLanguage: lang,
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
        { name: identity.profile.nameFull, item: home },
        { name: svc.labels.hub, item: serviceUrl(undefined, lang) },
        { name: page.title, item: url },
      ]),
    ],
  };
}
