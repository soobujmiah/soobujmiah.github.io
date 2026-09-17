'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { LanguageProvider, useLang } from '@/app/language';
import { servicesContent } from '@/app/services-content';
import { serviceHref } from '@/app/services';
import { sectionHref } from '@/app/sections';

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
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-mono text-[11px]" style={{ color: 'rgba(228,226,223,0.45)' }}>
            <Link href={sectionHref(0)} className="transition-opacity hover:opacity-100" style={{ color: '#e4e2df' }}>
              soobujmiah
            </Link>
            <span aria-hidden>/</span>
            <Link href={serviceHref()} className="transition-opacity hover:opacity-100">
              {s.labels.hub}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLang}
              aria-label={t.header.langAria}
              className="rounded-full px-4 py-1.5 font-mono text-[11px] font-medium transition-colors duration-300"
              style={{ border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}
            >
              {t.header.langLabel}
            </button>
            <a
              href="https://github.com/soobujmiah"
              aria-label={t.header.githubAria}
              className="rounded-full px-4 py-1.5 text-[11px] font-medium transition-colors duration-300"
              style={{ border: '1px solid rgba(228,226,223,0.12)', color: '#e4e2df' }}
            >
              {t.header.githubLabel}
            </a>
          </div>
        </div>
      </header>
      <main id="main" lang={lang} className="mx-auto w-full max-w-4xl px-6 pb-24 pt-14">
        {children}
      </main>
      <footer className="border-t py-6" style={{ borderColor: 'rgba(228,226,223,0.05)' }}>
        <div className="mx-auto flex max-w-4xl flex-col gap-2 px-6 font-mono text-[11px] sm:flex-row sm:items-center sm:justify-between" style={{ color: 'rgba(228,226,223,0.4)' }}>
          <span>© {new Date().getFullYear()} {t.profile.nameFull}</span>
          <span className="flex flex-wrap gap-4">
            <Link href={sectionHref(0)} className="hover:text-[#4ade80]">{s.labels.backHome}</Link>
            <Link href={serviceHref()} className="hover:text-[#4ade80]">{s.labels.allServices}</Link>
            <Link href={sectionHref(8)} className="hover:text-[#4ade80]">{s.labels.contactPage}</Link>
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
