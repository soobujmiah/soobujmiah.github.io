import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

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

export const metadata: Metadata = {
  metadataBase: new URL('https://soobujmiah.github.io'),
  title: 'Sobuj Miah — Software Developer & On-Device AI Systems Builder',
  description:
    'On-device AI, Android, Linux, ARM64, GPU/NPU acceleration. Self-taught systems builder working from an Android phone — every claim backed by CI or real-device evidence.',
  keywords: [
    'Sobuj Miah', 'on-device AI', 'Android', 'ARM64', 'local LLM',
    'Vulkan', 'NPU', 'Hexagon', 'llama.cpp', 'Flutter', 'Kotlin', 'Termux',
    'সবুজ মিয়া',
  ],
  authors: [{ name: 'Sobuj Miah' }],
  creator: 'Sobuj Miah',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'bn_BD',
    url: 'https://soobujmiah.github.io',
    siteName: 'Sobuj Miah',
    title: 'Sobuj Miah — Software Developer & On-Device AI Systems Builder',
    description:
      'On-device AI, Android, Linux, ARM64, GPU/NPU acceleration. Self-taught systems builder.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sobuj Miah — Software Developer & On-Device AI Systems Builder',
    description: 'On-device AI, Android, Linux, ARM64, GPU/NPU acceleration.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://soobujmiah.github.io' },
};

export const viewport: Viewport = {
  themeColor: '#060608',
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
      </head>
      <body className={`${inter.variable} ${jetbrains.variable} noise`}>
        {children}
      </body>
    </html>
  );
}
