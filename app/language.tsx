'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { content, type Content, type Lang } from './content';
import { indexFromPathname } from './sections';
import { localizedPath } from './locales';

/** Service routes own their document metadata (components/services);
    the pager's title swap must leave them alone — and must not pull the
    services copy into the pager bundle. */
export function isServicePathname(pathname: string): boolean {
  return /^\/(?:bn\/)?services(\/|$)/.test(pathname);
}

interface LanguageValue {
  lang: Lang;
  t: Content;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageValue>({
  lang: 'en',
  t: content.en,
  setLang: () => {},
  toggleLang: () => {},
});

export function LanguageProvider({ children, initialLang = 'en' }: { children: ReactNode; initialLang?: Lang }) {
  const [lang] = useState<Lang>(initialLang);

  /* Keep <html lang>, tab title, meta description, and body font-stack
     in sync so each language is fully itself. Title and description
     follow the section the visitor is on (seo.sections, aligned with
     SECTION_IDS) so the live document matches the server-rendered
     metadata of the current route in either language. */
  useEffect(() => {
    try {
      document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
      document.body.classList.toggle('lang-bn', lang === 'bn');
      const pathname = window.location.pathname;
      /* The service-intent layer lives outside the pager and re-titles
         itself (ServicesShell); never re-title a service page as Home. */
      if (isServicePathname(pathname)) return;
      let i = 0;
      try {
        i = indexFromPathname(pathname);
      } catch {
        /* fall back to home metadata */
      }
      const seo = content[lang].seo.sections[i] ?? content[lang].seo.sections[0];
      /* Mirror the server's metadata template: home keeps its full
         title; section topics get the name appended. */
      document.title = i === 0 ? seo.title : `${seo.title} — ${content[lang].profile.nameFull}`;
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute('content', seo.description);
    } catch {
      /* non-fatal: document unavailable */
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    if (next === lang || typeof window === 'undefined') return;
    window.location.assign(localizedPath(window.location.pathname, next));
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'bn' : 'en');
  }, [lang, setLang]);

  const value = useMemo<LanguageValue>(
    () => ({ lang, t: content[lang], setLang, toggleLang }),
    [lang, setLang, toggleLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageValue {
  return useContext(LanguageContext);
}

/* Render counters in the active script — Bengali digits in BN mode,
   Latin digits otherwise. For UI chrome only; technical figures
   (benchmarks, versions, test counts) stay Latin in content. */
export function localizeDigits(value: string | number, lang: Lang): string {
  const s = String(value);
  if (lang !== 'bn') return s;
  return s.replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
}
