import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Noto_Sans_Bengali, Space_Grotesk } from 'next/font/google';
import { BRAND } from './design-tokens';
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

const TITLE = 'Sobuj Miah — Software Developer & On-Device AI Systems Builder';
const DESCRIPTION =
  'On-device AI, Android, Linux, ARM64, GPU/NPU acceleration. Self-taught systems builder working from an Android phone — every claim backed by CI or real-device evidence.';
const OG_IMAGE = { url: '/og.png', width: 1200, height: 630, alt: 'Sobuj Miah — on-device AI systems builder' };

export const metadata: Metadata = {
  metadataBase: new URL('https://soobujmiah.github.io'),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'Sobuj Miah', 'on-device AI', 'Android', 'ARM64', 'local LLM',
    'Vulkan', 'NPU', 'Hexagon', 'llama.cpp', 'Flutter', 'Kotlin', 'Termux',
    'সবুজ মিয়া',
  ],
  authors: [{ name: 'Sobuj Miah', url: 'https://soobujmiah.github.io' }],
  creator: 'Sobuj Miah',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'bn_BD',
    url: 'https://soobujmiah.github.io',
    siteName: 'Sobuj Miah',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://soobujmiah.github.io' },
};

export const viewport: Viewport = {
  /* Was '#060608', which matched neither the --bg token nor the page. */
  themeColor: BRAND.bg,
  colorScheme: 'dark',
};

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Sobuj Miah',
  alternateName: 'সবুজ মিয়া',
  url: 'https://soobujmiah.github.io',
  jobTitle: 'Independent Software Developer & On-Device AI Systems Builder',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Dhaka',
    addressCountry: 'BD',
  },
  sameAs: [
    'https://github.com/soobujmiah',
    'https://linkedin.com/in/soobujmiah',
    'https://t.me/soobujmiah',
  ],
  knowsLanguage: ['bn', 'en', 'hi', 'ur', 'ar'],
  knowsAbout: [
    'On-device AI',
    'Android systems',
    'ARM64 Linux',
    'llama.cpp',
    'Vulkan',
    'Flutter',
    'Kotlin',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        {/* The identity mark's reveal is scripted. Without JS the glyphs
            would sit at their pre-reveal opacity, so the name is pinned
            readable rather than left invisible. */}
        <noscript>
          <style>{`.sig-ink{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
      </head>
      <body className={`${inter.variable} ${jetbrains.variable} ${bengali.variable} ${display.variable} noise`}>
        {children}
      </body>
    </html>
  );
}
