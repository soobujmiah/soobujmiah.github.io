import type { Metadata, Viewport } from 'next';
import { Anek_Bangla, Chakra_Petch, Inter, JetBrains_Mono, Noto_Sans_Bengali, Space_Grotesk } from 'next/font/google';
import { BRAND } from './design-tokens';
import { content } from './content';
import './globals.css';

/* Latin UI + mono, loaded through next/font. */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

/* Bangla gets a real webfont rather than a hoped-for system fallback.
   The previous build named 'Noto Sans Bengali' in CSS while only
   Inter/JetBrains were ever loaded, so Bengali text fell through to a
   Latin-only face on most devices. `--font-bengali` is consumed by
   `body.lang-bn` in globals.css. */
const bengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  variable: '--font-bengali',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

/* Display face for the identity mark. Latin-only on purpose: Bengali
   codepoints are absent from this subset, so the name falls through to
   `--font-bengali` and both scripts get a deliberate display treatment
   instead of a Latin default stretched over Bengali. */
const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

/* The identity wordmark gets its own display face: Chakra Petch is a
   squared, technical face built for exactly this register — signal
   systems, terminals, experimental work. Latin-only subset here too,
   so Bengali falls through to `--font-bengali`. Self-hosted woff2 via
   next/font: no runtime third-party request. */
const wordmark = Chakra_Petch({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-wordmark',
  display: 'swap',
});

/* The Bengali half of the identity mark gets a display face of its own.
   Without it the English name is a brand mark while the Bengali name is
   body copy — the same word in two different registers. Anek Bangla is a
   contemporary geometric Bengali family, deliberately not the body face
   (Noto Sans Bengali), so both scripts carry the same "this is the name"
   weight. 600/700 are real instances: synthetic bold is what smears
   Indic shaping. */
const wordmarkBn = Anek_Bangla({
  subsets: ['bengali'],
  weight: ['600', '700'],
  variable: '--font-wordmark-bn',
  display: 'swap',
});

/* ── Metadata derives from content.ts — the single source of truth.
      Home title/description come from seo.sections[0] (kept identical
      to meta), so the server render and the client-side language
      switch can never drift apart. Section routes override via
      app/[section]/page.tsx. ────────────────────────────────────── */
const en = content.en;
const HOME = en.seo.sections[0];
const ORIGIN = 'https://soobujmiah.github.io';
const OG_IMAGE = { url: '/og.png', width: 1200, height: 630, alt: 'Sobuj Miah — independent systems builder, on-device AI and ARM64 systems' };

export const metadata: Metadata = {
  metadataBase: new URL(ORIGIN),
  /* Home carries the full identity title; section routes return their
     topic title and the template appends the name, so every route's
     <title> names the author (a rule check-build enforces). */
  title: {
    default: HOME.title,
    template: `%s — ${en.profile.nameFull}`,
  },
  description: HOME.description,
  /* Identity + specialization cluster. Site-level only; pages carry no
     keyword stuffing. */
  keywords: [
    'Sobuj Miah', 'সবুজ মিয়া', 'soobujmiah',
    'independent systems builder', 'on-device AI', 'local LLM', 'local AI',
    'Android systems', 'ARM64 Linux', 'Linux on Android', 'native tooling',
    'Android development on ARM64', 'mobile systems',
    'llama.cpp', 'GGUF', 'Vulkan', 'Mesa', 'Turnip', 'Adreno',
    'Qualcomm', 'Hexagon', 'QNN', 'Termux', 'PRoot', 'Debian',
    'Flutter', 'Dart', 'Kotlin', 'JNI', 'Android NDK', 'GitHub Actions',
  ],
  authors: [{ name: en.profile.nameFull, url: ORIGIN }],
  creator: en.profile.nameFull,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'bn_BD',
    url: ORIGIN,
    siteName: en.profile.nameFull,
    title: HOME.title,
    description: HOME.description,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME.title,
    description: HOME.description,
    images: [OG_IMAGE.url],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: ORIGIN },
};

export const viewport: Viewport = {
  /* Was '#060608', which matched neither the --bg token nor the page. */
  themeColor: BRAND.bg,
  colorScheme: 'dark',
};

/* ── Structured data: one graph that names the entity, the profile,
      the site, and the showcased work. Every value is visible on the
      pages — nothing here is a claim the site does not make. ────── */
const projects = [
  ...en.work.projects.map((p) => ({ name: p.name, description: `${p.tagline}. ${p.description}`, url: p.repo })),
  { name: en.work.nowBuilding.name, description: en.work.nowBuilding.description, url: en.work.nowBuilding.url },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${ORIGIN}/#website`,
      url: ORIGIN,
      name: en.profile.nameFull,
      publisher: { '@id': `${ORIGIN}/#person` },
      inLanguage: ['en', 'bn'],
    },
    {
      '@type': 'ProfilePage',
      '@id': `${ORIGIN}/#profilepage`,
      url: ORIGIN,
      mainEntity: { '@id': `${ORIGIN}/#person` },
    },
    {
      '@type': 'Person',
      '@id': `${ORIGIN}/#person`,
      name: en.profile.nameFull,
      alternateName: 'সবুজ মিয়া',
      url: ORIGIN,
      jobTitle: `${en.profile.title} — ${en.profile.tagline}`,
      description: en.meta.description,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Dhaka',
        addressCountry: 'BD',
      },
      /* Derived from the same content tree the contact page renders, so
         structured data and the visible ecosystem can never disagree.
         De-duplicated: GitHub, LinkedIn and Telegram are both primary
         fields and members of a group. */
      sameAs: Array.from(
        new Set([
          en.profile.github,
          en.profile.linkedin,
          `https://t.me/${en.profile.telegram.replace(/^@/, '')}`,
          ...en.contact.groups.flatMap((g) => g.links.map((l) => l.href)),
        ])
      ),
      knowsLanguage: ['bn', 'en', 'hi', 'ur', 'ar'],
      knowsAbout: [
        'On-device AI',
        'Local LLM inference',
        'Android systems',
        'ARM64 Linux',
        'Linux on Android',
        'Native tooling',
        'Consent-driven Android automation',
        'llama.cpp',
        'GGUF',
        'Vulkan',
        'Mesa Turnip',
        'Zink',
        'Adreno',
        'Qualcomm Hexagon',
        'Termux',
        'PRoot',
        'Debian',
        'Flutter',
        'Dart',
        'Kotlin',
        'Android NDK',
        'GitHub Actions',
      ],
    },
    {
      '@type': 'ItemList',
      name: 'Showcased projects',
      description: 'Flagship and active projects presented on the work page.',
      numberOfItems: projects.length,
      itemListElement: projects.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'SoftwareApplication',
          name: p.name,
          description: p.description,
          url: p.url,
          operatingSystem: 'Android',
        },
      })),
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${jetbrains.variable} ${bengali.variable} ${display.variable} ${wordmark.variable} ${wordmarkBn.variable} noise`}>
        {children}
      </body>
    </html>
  );
}
