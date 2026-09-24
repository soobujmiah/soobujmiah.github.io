import type { Metadata } from 'next';
import { content, type Lang } from './content';
import { sectionUrl } from './sections';

const ORIGIN = 'https://soobujmiah.github.io';
const OG = { url: '/og.png', width: 1200, height: 630 };

export function sectionMetadata(index: number, lang: Lang): Metadata {
  const tree = content[lang];
  const page = tree.seo.sections[index];
  const enUrl = sectionUrl(index, 'en');
  const bnUrl = sectionUrl(index, 'bn');
  const url = lang === 'en' ? enUrl : bnUrl;
  return {
    title: page.title,
    description: page.description,
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
      title: page.title,
      description: page.description,
      images: [{ ...OG, alt: tree.profile.nameFull }],
    },
    twitter: { card: 'summary_large_image', title: page.title, description: page.description, images: [OG.url] },
  };
}

export function homeMetadata(lang: Lang): Metadata {
  const home = content[lang].seo.sections[0];
  const enUrl = `${ORIGIN}/`;
  const bnUrl = `${ORIGIN}/bn/`;
  return {
    title: home.title,
    description: home.description,
    alternates: {
      canonical: lang === 'en' ? enUrl : bnUrl,
      languages: { en: enUrl, bn: bnUrl, 'x-default': enUrl },
    },
    openGraph: {
      type: 'website',
      locale: lang === 'en' ? 'en_US' : 'bn_BD',
      alternateLocale: lang === 'en' ? 'bn_BD' : 'en_US',
      url: lang === 'en' ? enUrl : bnUrl,
      siteName: content[lang].profile.nameFull,
      title: home.title,
      description: home.description,
      images: [{ ...OG, alt: content[lang].profile.nameFull }],
    },
    twitter: { card: 'summary_large_image', title: home.title, description: home.description, images: [OG.url] },
  };
}
