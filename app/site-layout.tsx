import type { Metadata, Viewport } from 'next';
import { Anek_Bangla, Chakra_Petch, Inter, JetBrains_Mono, Noto_Sans_Bengali, Space_Grotesk } from 'next/font/google';
import { BRAND } from './design-tokens';
import { content, type Lang } from './content';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });
const bengali = Noto_Sans_Bengali({ subsets: ['bengali'], variable: '--font-bengali', display: 'swap', weight: ['400', '500', '600', '700'] });
const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const wordmark = Chakra_Petch({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-wordmark', display: 'swap' });
const wordmarkBn = Anek_Bangla({ subsets: ['bengali'], weight: ['600', '700'], variable: '--font-wordmark-bn', display: 'swap' });

const ORIGIN = 'https://soobujmiah.github.io';
const HOME_URL: Record<Lang, string> = { en: `${ORIGIN}/`, bn: `${ORIGIN}/bn/` };
const OG_IMAGE = { url: '/og.png', width: 1200, height: 630, alt: 'Sobuj Miah — software, AI and practical technology' };

export const viewport: Viewport = { themeColor: BRAND.bg };

function languages(enUrl: string, bnUrl: string) {
  return { en: enUrl, bn: bnUrl, 'x-default': enUrl };
}

export function homeAlternates(lang: Lang) {
  return {
    canonical: HOME_URL[lang],
    languages: languages(HOME_URL.en, HOME_URL.bn),
  };
}

export function siteMetadata(lang: Lang): Metadata {
  const t = content[lang];
  const home = t.seo.sections[0];
  const rootUrl = HOME_URL[lang];
  const keywords = lang === 'en'
    ? ['Sobuj Miah', 'soobujmiah', 'software', 'on-device AI', 'Android', 'ARM64 Linux', 'automation', 'practical technology']
    : ['সবুজ মিয়া', 'soobujmiah', 'সফটওয়্যার', 'অন-ডিভাইস এআই', 'অ্যান্ড্রয়েড', 'এআরএম ৬৪ লিনাক্স', 'অটোমেশন', 'ব্যবহারিক প্রযুক্তি'];

  return {
    metadataBase: new URL(ORIGIN),
    verification: { google: 'Z7hOImSydB4nMFUCSyYaLVRpIPHu8FJBlIbfVSbhWs8' },
    title: { default: home.title, template: `%s — ${t.profile.nameFull}` },
    description: home.description,
    keywords,
    authors: [{ name: t.profile.nameFull, url: ORIGIN }],
    creator: t.profile.nameFull,
    openGraph: {
      type: 'website',
      locale: lang === 'en' ? 'en_US' : 'bn_BD',
      alternateLocale: lang === 'en' ? 'bn_BD' : 'en_US',
      url: rootUrl,
      siteName: t.profile.nameFull,
      title: home.title,
      description: home.description,
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title: home.title, description: home.description, images: [OG_IMAGE.url] },
    robots: { index: true, follow: true },
    alternates: homeAlternates(lang),
  };
}

function structuredData(lang: Lang) {
  const t = content[lang];
  const en = content.en;
  const localizedHome = HOME_URL[lang];
  const projects = [
    ...en.work.projects.map((p) => ({ name: p.name, description: `${p.tagline}. ${p.description}`, url: p.repo })),
    { name: en.work.nowBuilding.name, description: en.work.nowBuilding.description, url: en.work.nowBuilding.url },
  ];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${localizedHome}#website`,
        url: localizedHome,
        name: t.profile.nameFull,
        publisher: { '@id': `${ORIGIN}/#person` },
        inLanguage: lang,
      },
      {
        '@type': 'ProfilePage',
        '@id': `${localizedHome}#profilepage`,
        url: localizedHome,
        mainEntity: { '@id': `${ORIGIN}/#person` },
        inLanguage: lang,
      },
      {
        '@type': 'Person',
        '@id': `${ORIGIN}/#person`,
        name: en.profile.nameFull,
        alternateName: 'সবুজ মিয়া',
        url: ORIGIN,
        jobTitle: `${t.profile.title} — ${t.profile.tagline}`,
        description: t.meta.description,
        address: { '@type': 'PostalAddress', addressLocality: 'Dhaka', addressCountry: 'BD' },
        sameAs: Array.from(new Set([
          en.profile.github,
          en.profile.linkedin,
          `https://t.me/${en.profile.telegram.replace(/^@/, '')}`,
          ...en.contact.groups.flatMap((g) => g.links.map((l) => l.href)).filter((href) => /^https?:\/\//i.test(href)),
        ])),
        knowsLanguage: ['bn', 'en', 'hi', 'ur', 'ar'],
        knowsAbout: [
          'Software development', 'On-device AI', 'Local LLM inference', 'Android systems',
          'ARM64 Linux', 'Linux on Android', 'Automation', 'Native tooling', 'llama.cpp',
          'GGUF', 'Vulkan', 'Mesa Turnip', 'Zink', 'Adreno', 'Qualcomm Hexagon',
          'Termux', 'PRoot', 'Debian', 'Flutter', 'Dart', 'Kotlin', 'Android NDK',
          'Website development and maintenance', 'Custom software development',
          'Computer setup and troubleshooting', 'Android device configuration and ADB',
          'Remote technical support',
        ],
      },
      {
        '@type': 'ItemList',
        name: lang === 'en' ? 'Showcased projects' : 'নির্বাচিত প্রকল্প',
        description: t.work.heading,
        numberOfItems: projects.length,
        itemListElement: projects.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: { '@type': 'SoftwareApplication', name: p.name, description: p.description, url: p.url, operatingSystem: 'Android' },
        })),
      },
    ],
  };
}

export function SiteDocument({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const fonts = [inter.variable, jetbrains.variable, bengali.variable, display.variable, wordmark.variable, wordmarkBn.variable].join(' ');
  return (
    <html lang={lang} suppressHydrationWarning>
      <head><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(lang)) }} /></head>
      <body className={`${fonts} noise`}>{children}</body>
    </html>
  );
}
