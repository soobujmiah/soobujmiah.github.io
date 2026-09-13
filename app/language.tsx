'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { content, type Content, type Lang } from './content';

const STORAGE_KEY = 'sobuj-portfolio-lang';

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

  /* Keep <html lang> and body font-stack in sync for a11y + typography. */
  useEffect(() => {
    try {
      document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
      document.body.classList.toggle('lang-bn', lang === 'bn');
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
