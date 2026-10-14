'use client';

import { useEffect, type ReactNode } from 'react';
import { LanguageProvider, useLang } from '@/app/language';
import { verificationCopy } from '@/app/verification-copy';
import { Masthead, SiteFooter } from '@/components/chrome';
import type { Lang } from '@/app/content';

/* ═══════════════════════════════════════════════════════════════
   VERIFICATION SHELL — the chrome for /verification/.

   Same contract as ServicesShell, and now literally the same
   chrome: the site's one masthead and one footer in their document
   variant. The footer's proof line is generated from the very
   summary this page expands, so the number in the chrome and the
   table in the body can never disagree.
   ═══════════════════════════════════════════════════════════════ */

function Chrome({ children }: { children: ReactNode }) {
  const { t, lang } = useLang();
  const v = verificationCopy[lang];

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
      <Masthead variant="document" />
      <main id="main" lang={lang} className="mx-auto w-full max-w-4xl px-6 pb-20 pt-12">
        {children}
      </main>
      <SiteFooter variant="document" />
    </>
  );
}

export function VerificationShell({ children, lang = 'en' }: { children: ReactNode; lang?: Lang }) {
  return (
    <LanguageProvider initialLang={lang}>
      <div className="services-doc">
        <Chrome>{children}</Chrome>
      </div>
    </LanguageProvider>
  );
}
