'use client';

/* ═══════════════════════════════════════════════════════════════
   DEPTH RAIL — the navigation IS the instrument.

   The previous build answered "where am I?" with a bottom pill that
   opened an overlay panel: a second surface on top of the page, with
   its own brackets, scan sweep and stagger. In a machine the reader
   is travelling *into*, the honest answer is a depth gauge — eight
   ticks down one side, the current stratum lit, the ones ahead still
   visible so the reader can see there is more machine below.

   Every tick is a real anchor to a real static route, so the rail
   works with JavaScript disabled, is crawlable, and middle-clicks
   into a new tab like any link. The click handler only intercepts
   to fly the camera instead of reloading the document.
   ═══════════════════════════════════════════════════════════════ */

import { useLang, localizeDigits } from '@/app/language';
import { PAGE_COUNT, SECTION_IDS, sectionHref } from '@/app/sections';

export function DepthRail({ index, onGo }: { index: number; onGo: (next: number) => void }) {
  const { t, lang } = useLang();
  return (
    <nav className="rail" aria-label={t.ui.depthLabel}>
      <p className="rail-head" aria-hidden="true">
        <span className="rail-head-label">{t.ui.depthLabel}</span>
        <span className="rail-head-value">
          {localizeDigits(String(index + 1).padStart(2, '0'), lang)}
          <span className="rail-head-total">/{localizeDigits(String(PAGE_COUNT).padStart(2, '0'), lang)}</span>
        </span>
      </p>
      <ol className="rail-list">
        {SECTION_IDS.map((id, i) => {
          const current = i === index;
          return (
            <li className="rail-item" key={id} data-state={current ? 'current' : i < index ? 'behind' : 'ahead'}>
              <a
                className="rail-tick"
                href={sectionHref(i, lang)}
                aria-current={current ? 'page' : undefined}
                onClick={(e) => {
                  /* Let the browser handle anything that means "open
                     this somewhere else". */
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  e.preventDefault();
                  onGo(i);
                }}
              >
                <span className="rail-index">{localizeDigits(String(i + 1).padStart(2, '0'), lang)}</span>
                <span className="rail-stratum">{t.ui.strata[i]}</span>
                <span className="rail-label">{t.ui.pageLabels[i]}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
