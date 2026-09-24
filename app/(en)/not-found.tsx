'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/* App Router 404 (static export renders this to 404.html).
   Renders in the visitor's stored language — pure EN or pure BN. */
const COPY = {
  en: {
    title: 'Page not found',
    body: 'The page you are looking for does not exist.',
    home: 'Return home',
  },
  bn: {
    title: 'পেজ পাওয়া যায়নি',
    body: 'আপনি যে পেজটি খুঁজছেন তা পাওয়া যায়নি।',
    home: 'হোমে ফিরুন',
  },
} as const;

export default function NotFound() {
  const [lang, setLang] = useState<'en' | 'bn'>('en');

  useEffect(() => {
    try {
      if (window.localStorage.getItem('sobuj-portfolio-lang') === 'bn') {
        setLang('bn');
        document.documentElement.lang = 'bn';
        document.body.classList.add('lang-bn');
      }
    } catch {
      /* ignore */
    }
  }, []);

  const t = COPY[lang];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--bg)' }}>
      <p className="font-mono text-xs uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--accent)' }}>
        404
      </p>
      <h1 className="text-4xl font-semibold mb-3" style={{ color: 'var(--fg)' }}>
        {t.title}
      </h1>
      <p className="mb-8" style={{ color: 'var(--muted)' }}>
        {t.body}
      </p>
      <Link
        href="/"
        className="rounded-full border px-6 py-2.5 text-sm font-medium transition-colors duration-300 hover:opacity-80"
        style={{ borderColor: 'rgba(228,226,223,0.15)', color: 'var(--fg)' }}
      >
        {t.home}
      </Link>
    </div>
  );
}
