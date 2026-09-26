import type { Metadata } from 'next';
import { content, type Lang } from './content';
import { verificationCopy } from './verification-copy';
import { verificationUrl } from './verification-routes';

const ORIGIN = 'https://soobujmiah.github.io';
const OG = { url: '/og.png', width: 1200, height: 630 };

/** /verification/ — a static document outside the pager, like /services/. */
export function verificationMetadata(lang: Lang): Metadata {
  const tree = content[lang];
  const v = verificationCopy[lang];
  const enUrl = verificationUrl('en');
  const bnUrl = verificationUrl('bn');
  const url = lang === 'en' ? enUrl : bnUrl;
  return {
    title: `${v.heading} — ${tree.profile.nameFull}`,
    description: v.intro,
    alternates: {
      canonical: url,
      languages: { en: enUrl, bn: bnUrl, 'x-default': enUrl },
    },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      locale: lang === 'en' ? 'en_US' : 'bn_BD',
      alternateLocale: lang === 'en' ? 'bn_BD' : 'en_US',
      url,
      siteName: tree.profile.nameFull,
      title: `${v.heading} — ${tree.profile.nameFull}`,
      description: v.intro,
      images: [{ ...OG, alt: tree.profile.nameFull }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${v.heading} — ${tree.profile.nameFull}`,
      description: v.intro,
      images: [OG.url],
    },
  };
}

export function verificationJsonLd(lang: Lang) {
  const tree = content[lang];
  const v = verificationCopy[lang];
  const url = verificationUrl(lang);
  const name = lang === 'en' ? 'Verification' : 'যাচাই';
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: `${v.heading} — ${tree.profile.nameFull}`,
        description: v.intro,
        inLanguage: lang,
        isPartOf: { '@id': `${ORIGIN}/#website` },
        about: { '@id': `${ORIGIN}/#person` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: tree.profile.nameFull, item: `${ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name, item: url },
        ],
      },
    ],
  };
}
