'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { LanguageProvider, useLang, localizeDigits } from '@/app/language';
import { servicesContent } from '@/app/services-content';
import { serviceHref } from '@/app/services';
import { sectionHref } from '@/app/sections';
import { BrandIcon } from '@/components/social-icons';

/* ═══════════════════════════════════════════════════════════════
   SERVICES SHELL — the chrome shared by /services/ and every service
   page. A client boundary so the language toggle and the stored
   preference work exactly as they do in the pager; the page body
   itself is server-rendered English so crawlers see real content.
   Deliberately simpler than the pager header: no framer-motion, no
   magnetic cursor, no page dots — these are documents, not scenes.
   ═══════════════════════════════════════════════════════════════ */

function Chrome({ children, slug }: { children: React.ReactNode; slug?: string }) {
  const { t, toggleLang, lang } = useLang();
  const s = servicesContent[lang];

  /* Mirror the pager's live metadata swap for this layer: the tab title
     and description follow the active language, from this page's own
     copy (server render = English, as everywhere else on the site). */
  useEffect(() => {
    const page = slug ? s.pages.find((p) => p.slug === slug) : undefined;
    const title = `${page ? page.seoTitle : s.hubSeoTitle} — ${t.profile.nameFull}`;
    const description = page ? page.seoDescription : s.hubSeoDescription;
    /* Child effects run before the provider's own DOM sync; defer one
       tick so this layer's title always lands after it, in both the
       stored-preference load and the live toggle. */
    const id = window.setTimeout(() => {
      try {
        document.title = title;
        document.querySelector('meta[name="description"]')?.setAttribute('content', description);
      } catch {
        /* non-fatal */
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [lang, slug, s, t.profile.nameFull]);
  return (
    <>
      <header className="sticky top-0 z-40 border-b py-3 backdrop-blur-xl" style={{ background: 'rgba(6,6,8,0.7)', borderColor: 'rgba(228,226,223,0.06)' }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6">
          {/* The portfolio's own identity mark, exactly as the main
              header presents it — Services is part of this website, so
              it gets the same brand anchor home, not a breadcrumb
              announcing where you already are. */}
          <a
            href={sectionHref(0)}
            aria-label={t.header.homeLabel}
            className="font-mono text-sm font-medium tracking-tight transition-opacity hover:opacity-100"
            style={{ color: '#e4e2df' }}
          >
            soobujmiah
          </a>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* CV stays reachable inside Services — same pill as the
                portfolio header, same destination */}
            <a
              href="/cv/Sobuj_Miah_CV.pdf"
              download="Sobuj_Miah_CV.pdf"
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
            {/* GitHub — same green outline family as CV/language, exactly
                as in the portfolio header: one system across the site. */}
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
        {children}
      </main>
      {/* Same footer system as the portfolio shell — identical rule,
          wash, blur, type scale and hover — so Services reads as one
          website, not a subsite. The three useful routes stay. */}
      <footer className="border-t py-2.5" style={{ borderColor: 'rgba(228,226,223,0.04)', background: 'rgba(6,6,8,0.6)', backdropFilter: 'blur(12px)' }}>
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-1 px-6 sm:flex-row">
          <p className="font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.35)' }}>
            © {localizeDigits(new Date().getFullYear(), lang)} {t.profile.nameFull}
          </p>
          <span className="flex flex-wrap items-center justify-center gap-4 font-mono text-[10px]" style={{ color: 'rgba(228,226,223,0.35)' }}>
            <Link href={sectionHref(0)} className="transition-colors duration-300 hover:text-[#4ade80]">{s.labels.backHome}</Link>
            <Link href={serviceHref()} className="transition-colors duration-300 hover:text-[#4ade80]">{s.labels.allServices}</Link>
            <Link href={sectionHref(8)} className="transition-colors duration-300 hover:text-[#4ade80]">{s.labels.contactPage}</Link>
          </span>
        </div>
      </footer>
    </>
  );
}

export function ServicesShell({ children, slug }: { children: React.ReactNode; slug?: string }) {
  return (
    <LanguageProvider>
      <div className="services-doc">
        <Chrome slug={slug}>{children}</Chrome>
      </div>
    </LanguageProvider>
  );
}
