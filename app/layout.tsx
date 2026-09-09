import type { Metadata } from 'next';
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
  title: 'Sobuj Miah — Independent Software & AI Systems Engineer',
  description:
    'On-device AI, Android, Linux, ARM64, GPU/NPU acceleration. Self-taught systems builder working from an Android phone — every claim backed by CI or real-device evidence.',
  keywords: [
    'Sobuj Miah',
    'on-device AI',
    'Android',
    'ARM64',
    'local LLM',
    'Vulkan',
    'NPU',
    'Hexagon',
    'llama.cpp',
    'Flutter',
    'Kotlin',
    'Termux',
    'Bangla AI',
  ],
  authors: [{ name: 'Sobuj Miah' }],
  creator: 'Sobuj Miah',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://soobujmiah.github.io',
    siteName: 'Sobuj Miah',
    title: 'Sobuj Miah — Independent Software & AI Systems Engineer',
    description:
      'On-device AI, Android, Linux, ARM64, GPU/NPU acceleration. Self-taught systems builder working from an Android phone.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sobuj Miah — Independent Software & AI Systems Engineer',
    description:
      'On-device AI, Android, Linux, ARM64, GPU/NPU acceleration. Self-taught systems builder.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://soobujmiah.github.io',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrains.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
