'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { content, type Content, type Lang } from './content';
import { indexFromPathname } from './sections';

const STORAGE_KEY = 'sobuj-portfolio-lang';

/** Service routes own their document metadata (components/services);
    the pager's title swap must leave them alone — and must not pull the
    services copy into the pager bundle. */
export function isServicePathname(pathname: string): boolean {
  return /^\/services(\/|$)/.test(pathname);
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

/* Read the stored preference defensively: localStorage can throw
   (private mode) or be absent (old WebViews). Never let preference
   loading break rendering. */
function readStoredLang(): Lang {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return 'en';
    return window.localStorage.getItem(STORAGE_KEY) === 'bn' ? 'bn' : 'en';
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  /* Hydrate the stored preference after mount (avoids SSR mismatch). */
  useEffect(() => {
    setLangState(readStoredLang());
  }, []);

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
    setLangState(next);
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
    } catch {
      /* private mode: preference simply won't persist */
    }
  }, []);

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
