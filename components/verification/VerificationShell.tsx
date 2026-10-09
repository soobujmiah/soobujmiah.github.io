'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { LanguageProvider, useLang, localizeDigits } from '@/app/language';
import { verificationCopy } from '@/app/verification-copy';
import { sectionHref } from '@/app/sections';
import { serviceHref } from '@/app/services';
import { BrandIcon } from '@/components/social-icons';
import { DocumentMotion } from '@/components/DocumentMotion';
import { SiliconDocumentBackdrop } from '@/components/SiliconDocumentBackdrop';
import type { Lang } from '@/app/content';

/* ═══════════════════════════════════════════════════════════════
   VERIFICATION SHELL — the chrome for /verification/.

   Same contract as ServicesShell: a static document outside the
   pager that shares the design tokens, fonts, language provider and
   footer, so the proof page reads as one website rather than a
   subsite. No framer-motion, no magnetic cursor, no page dots.
   ═══════════════════════════════════════════════════════════════ */

function Chrome({ children }: { children: ReactNode }) {
  const { t, toggleLang, lang } = useLang();
  const v = verificationCopy[lang];

  /* Mirror the pager's live metadata swap for this layer: the tab
     title and description follow the active language, from this
     page's own copy (server render = English, as everywhere else). */
  useEffect(() => {
    const title = `${v.heading} — ${t.profile.nameFull}`;
    const description = v.intro;
    const id = window.setTimeout(() => {
      try {
        document.title = title;
        document.querySelector('meta[name="description"]')?.setAttribute('content', description);
      } catch {
        /* non-fatal */
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [lang, v.heading, v.intro, t.profile.nameFull]);

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b py-3 backdrop-blur-xl"
        style={{ background: 'rgba(6,6,8,0.7)', borderColor: 'rgba(228,226,223,0.06)' }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6">
          <a
            href={sectionHref(0, lang)}
            aria-label={t.header.homeLabel}
            className="font-mono text-sm font-medium tracking-tight transition-opacity hover:opacity-100"
            style={{ color: '#e4e2df' }}
          >
            soobujmiah
          </a>
          <div className="flex items-center gap-1 sm:gap-2">
            <a
              href={lang === 'bn' ? '/cv/Sobuj_Miah_CV_BN.pdf' : '/cv/Sobuj_Miah_CV_EN.pdf'}
              download={lang === 'bn' ? 'Sobuj_Miah_CV_BN.pdf' : 'Sobuj_Miah_CV_EN.pdf'}
              aria-label={t.header.cvAria}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3.5 py-1.5 font-mono text-[11px] font-medium transition-colors duration-300"
              style={{ border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {t.header.cvLabel}
            </a>
            <button
              type="button"
              onClick={toggleLang}
              aria-label={t.header.langAria}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-4 py-1.5 font-mono text-[11px] font-medium transition-colors duration-300"
              style={{ border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}
            >
              <BrandIcon id="portfolio" size={12} />
              {lang === 'en' ? 'EN' : 'বাং'}
            </button>
            <a
              href="https://github.com/soobujmiah"
              aria-label={t.header.githubAria}
              className="inline-flex items-center rounded-full px-2.5 sm:px-3 py-1.5 transition-colors duration-300"
              style={{ border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}
            >
              <BrandIcon id="github" size={14} />
            </a>
          </div>
        </div>
      </header>
      <main id="main" lang={lang} className="mx-auto w-full max-w-4xl px-6 pb-24 pt-14">
        <DocumentMotion />
        {children}
      </main>
      <footer
        className="border-t py-2.5"
        style={{ borderColor: 'rgba(228,226,223,0.04)', background: 'rgba(6,6,8,0.6)', backdropFilter: 'blur(12px)' }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-1 px-6 sm:flex-row">
          <p className="font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.35)' }}>
            © {localizeDigits(new Date().getFullYear(), lang)} {t.profile.nameFull}
          </p>
          <span className="flex flex-wrap items-center justify-center gap-4 font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.35)' }}>
            <Link href={sectionHref(0, lang)} className="transition-colors duration-300 hover:text-[#4ade80]">
              {lang === 'bn' ? 'হোম' : 'Home'}
            </Link>
            <Link href={serviceHref(undefined, lang)} className="transition-colors duration-300 hover:text-[#4ade80]">
              {lang === 'bn' ? 'সেবা' : 'Services'}
            </Link>
            <Link href={sectionHref(6, lang)} className="transition-colors duration-300 hover:text-[#4ade80]">
              {lang === 'bn' ? 'যোগাযোগ' : 'Contact'}
            </Link>
          </span>
        </div>
      </footer>
    </>
  );
}

export function VerificationShell({ children, lang = 'en' }: { children: ReactNode; lang?: Lang }) {
  return (
    <LanguageProvider initialLang={lang}>
      <div className="services-doc">
        <SiliconDocumentBackdrop sceneIndex={8} />
        <Chrome>{children}</Chrome>
      </div>
    </LanguageProvider>
  );
}
