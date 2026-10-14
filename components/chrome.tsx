'use client';

/* ═══════════════════════════════════════════════════════════════
   CHROME — one masthead and one footer for the whole website.

   The previous build had three: the pager's framer-motion header,
   the services shell's sticky header and the verification shell's
   near-copy of it. They drifted, and a visitor crossing from a
   chapter into /services/ changed websites without changing site.
   There is one of each now; the journey and the documents differ
   only in how the element is pinned, which is a CSS concern.

   The footer is a readout, not a sign-off: the proof line's counts
   and date come from `app/verification-summary.json`, the same
   generated projection the stage's marks and /verification/ read.
   If a machine check fails, this line says so on every page.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react';
import { useLang, localizeDigits } from '@/app/language';
import { sectionHref } from '@/app/sections';
import { serviceHref } from '@/app/services';
import { verificationHref } from '@/app/verification-routes';
import { formatVerifiedDate, lastVerifiedAt, machineClaimCount, verifiedCount } from '@/app/verification';
import { BrandIcon } from '@/components/social-icons';

type Variant = 'journey' | 'document';

export function Masthead({ variant = 'journey' }: { variant?: Variant }) {
  const { t, lang, toggleLang } = useLang();
  /* The glyph names the ACTIVE language, so the English server render
     stays pure English and the Bangla glyph only appears after a
     client-side switch. The action itself is in the aria-label. */
  const langGlyph = lang === 'en' ? 'EN' : 'বাং';
  const cv = lang === 'bn' ? '/cv/Sobuj_Miah_CV_BN.pdf' : '/cv/Sobuj_Miah_CV_EN.pdf';

  return (
    <header className="masthead" data-variant={variant}>
      <a className="masthead-mark" href={sectionHref(0, lang)} aria-label={t.header.homeLabel}>
        soobujmiah
      </a>
      <nav className="masthead-nav" aria-label={t.header.servicesLabel}>
        <a className="masthead-link" href={serviceHref(undefined, lang)}>
          {t.header.servicesLabel}
        </a>
        <a className="masthead-link" href={cv} download={cv.split('/').pop()} aria-label={t.header.cvAria}>
          {t.header.cvLabel}
        </a>
        <button className="masthead-link" type="button" onClick={toggleLang} aria-label={t.header.langAria}>
          {langGlyph}
        </button>
        <a
          className="masthead-link masthead-link--icon"
          href={t.profile.github}
          aria-label={t.header.githubAria}
          target="_blank"
          rel="noreferrer noopener"
        >
          <BrandIcon id="github" size={13} />
        </a>
      </nav>
    </header>
  );
}

export function SiteFooter({ variant = 'journey' }: { variant?: Variant }) {
  const { t, lang } = useLang();
  const footRef = useRef<HTMLElement>(null);
  const checks = `${localizeDigits(verifiedCount, lang)}/${localizeDigits(machineClaimCount, lang)}`;
  const verifiedOn = formatVerifiedDate(lastVerifiedAt, lang);

  /* The journey's chapter page and depth rail sit above this footer, and
     its height is not fixed: on a narrow phone the proof line wraps to
     three lines, and in Bangla it wraps differently again. Measuring it
     into `--chrome-foot` is the only way the rail can sit exactly on top
     of it without either overlapping the text or reserving dead space.
     CSS keeps `--foot-height` as the fallback, so the first paint and
     the no-JavaScript render are both correct. */
  useEffect(() => {
    if (variant !== 'journey') return;
    const foot = footRef.current;
    if (!foot || typeof ResizeObserver !== 'function') return;
    const measure = () => {
      document.documentElement.style.setProperty('--chrome-foot', `${Math.round(foot.offsetHeight)}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(foot);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--chrome-foot');
    };
  }, [variant]);

  return (
    <footer className="site-foot" data-variant={variant} ref={footRef}>
      <p className="site-foot-line">
        © {localizeDigits(new Date().getFullYear(), lang)} {t.profile.nameFull} · {t.footer.built}
      </p>
      {/* The proof line: generated numbers, never typed by hand. */}
      <a className="site-foot-proof" href={verificationHref(lang)} aria-label={t.footer.proofLink}>
        <span className="site-foot-proof-label">{t.footer.proofLabel}</span>
        <span className="site-foot-proof-value">
          {checks} {t.footer.checksPassing}
        </span>
        {verifiedOn && (
          <span className="site-foot-proof-value">
            {t.footer.lastVerified} {verifiedOn}
          </span>
        )}
        <span className="ref-arrow" aria-hidden="true">
          →
        </span>
      </a>
    </footer>
  );
}
