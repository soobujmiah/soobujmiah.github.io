'use client';

import { useEffect } from 'react';
import { LanguageProvider, useLang } from '@/app/language';
import { servicesContent } from '@/app/services-content';
import { Masthead, SiteFooter } from '@/components/chrome';
import type { Lang } from '@/app/content';

/* ═══════════════════════════════════════════════════════════════
   SERVICES SHELL — the chrome shared by /services/ and every service
   page. A client boundary so the language toggle and the stored
   preference work exactly as they do in the journey; the page body
   itself is server-rendered English so crawlers see real content.

   2026-10 rebuild: this shell no longer carries its own header and
   footer. It mounts the site's one masthead and one footer
   (`components/chrome.tsx`) in their document variant, so crossing
   from a chapter into a service page changes the document, not the
   website. The environment stays out of here on purpose — these are
   documents to read, not a stratum to fly into, so they get the
   static depth wash in `app/globals.css` and no canvas at all.
   ═══════════════════════════════════════════════════════════════ */

function Chrome({ children, slug }: { children: React.ReactNode; slug?: string }) {
  const { t, lang } = useLang();
  const s = servicesContent[lang];

  /* Mirror the journey's live metadata swap for this layer: the tab
     title and description follow the active language, from this
     page's own copy (server render = English, as everywhere else). */
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
      <Masthead variant="document" />
      <main id="main" lang={lang} className="mx-auto w-full max-w-4xl px-6 pb-20 pt-12">
        {children}
      </main>
      <SiteFooter variant="document" />
    </>
  );
}

export function ServicesShell({ children, slug, lang = 'en' }: { children: React.ReactNode; slug?: string; lang?: Lang }) {
  return (
    <LanguageProvider initialLang={lang}>
      <div className="services-doc">
        <Chrome slug={slug}>{children}</Chrome>
      </div>
    </LanguageProvider>
  );
}
