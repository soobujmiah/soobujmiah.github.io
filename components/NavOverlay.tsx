'use client';

/* ═══════════════════════════════════════════════════════════════
   NAVIGATION OVERLAY — the pager's index, made addressable.

   This is not a second navigation system: it is a view onto the same
   sections the pager already owns. Every row is a real anchor to a
   real static route (`/work/`), so it works with middle-click, with
   JavaScript disabled before hydration, and for crawlers — while a
   normal click still drives the cinematic pager without a reload.

   Accessibility
   -------------
   - `role="dialog" aria-modal="true"`, labelled by its heading.
   - Focus moves to the current row on open and returns to the
     trigger on close.
   - Up/Down/Home/End move between rows; Enter/Space activate;
     Escape and backdrop click close; Tab is trapped inside.
   - Arrow keys are handled locally while open, so they do not also
     page the document behind the dialog.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLang, localizeDigits } from '@/app/language';
import { SECTION_IDS, sectionHref } from '@/app/sections';
import { serviceHref } from '@/app/services';

const FOCUSABLE = 'a[href], button:not([disabled])';

export function NavOverlay({
  open,
  onClose,
  index,
  onGo,
}: {
  open: boolean;
  onClose: () => void;
  index: number;
  onGo: (i: number) => void;
}) {
  const { t, lang } = useLang();
  const prefersReduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const restoreRef = useRef<HTMLElement | null>(null);
  const total = SECTION_IDS.length;

  const close = useCallback(() => {
    onClose();
    const el = restoreRef.current;
    restoreRef.current = null;
    if (el && typeof el.focus === 'function') el.focus();
  }, [onClose]);

  /* Remember the trigger so focus can be returned to it. */
  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    restoreRef.current = active instanceof HTMLElement ? active : null;
  }, [open]);

  /* Move focus to the row for the page the visitor is actually on. */
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => rowRefs.current[index]?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open, index]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const rows = rowRefs.current.filter(Boolean) as HTMLAnchorElement[];
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close();
        return;
      }
      if (e.key === 'Tab') {
        const panel = panelRef.current;
        if (!panel) return;
        const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      e.stopPropagation();
      if (rows.length === 0) return;
      const at = rows.indexOf(document.activeElement as HTMLAnchorElement);
      let next = at;
      if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = rows.length - 1;
      else if (e.key === 'ArrowDown') next = at < 0 ? 0 : (at + 1) % rows.length;
      else next = at < 0 ? rows.length - 1 : (at - 1 + rows.length) % rows.length;
      rows[next]?.focus();
    },
    [close]
  );

  /* Lock background paging while the dialog is open. */
  useEffect(() => {
    if (!open) return;
    const stop = (e: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(e.key)) e.stopPropagation();
    };
    window.addEventListener('keydown', stop, true);
    return () => window.removeEventListener('keydown', stop, true);
  }, [open]);

  /* Same instrument as the bottom bar's track: page 1 = 0%, page 7 =
     100%, start anchor fixed. Drawn along the panel's bottom edge —
     the edge that faces the bar the HUD emerged from — so the open
     panel and the closed bar are one continuous progress language. */
  const progress = total > 1 ? index / (total - 1) : 0;

  return (
    <div className="nav-overlay-root" data-open={open ? 'true' : 'false'} aria-hidden={!open}>
      {/* backdrop */}
      <motion.div
        className="nav-overlay-backdrop"
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={close}
      />
      {/* The panel is physically anchored above the bottom bar and
          grows upward from it: transform-origin at its bottom edge,
          entry from a lowered/contracted state, exit reversing into
          the bar. The seam connector (CSS ::after) and the bar's own
          data-nav-open glow keep the origin relationship visible. */}
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nav-overlay-title"
        aria-hidden={!open}
        className="nav-overlay-panel"
        initial={false}
        animate={
          open
            ? { opacity: 1, y: 0, scaleY: 1, scaleX: 1 }
            : { opacity: 0, y: 54, scaleY: 0.68, scaleX: 0.92 }
        }
        transition={
          prefersReduced
            ? { duration: 0 }
            : { duration: 0.42, ease: [0.16, 1, 0.3, 1] }
        }
        style={{ pointerEvents: open ? 'auto' : 'none', transformOrigin: '50% 100%' }}
        onKeyDown={onKeyDown}
      >
        {/* technical framing — segmented corner brackets and edge
            ticks drawn over the panel: HUD geometry, not box UI. The
            panel's own border stays a faint hairline so the frame
            reads as an instrument layer, not a dialog outline. */}
        <span className="nav-overlay-frame" aria-hidden />
        <div className="nav-overlay-head">
          {/* Compact head: the index eyebrow IS the title, with the
              current page named beside it in the same quiet mono.
              No large page number — the page itself carries that. */}
          <span className="nav-overlay-headtext">
            <h2 id="nav-overlay-title" className="nav-overlay-eyebrow">
              {t.ui.navTitle}
            </h2>
            <span className="nav-overlay-current">{t.ui.pageLabels[index]}</span>
          </span>
          <button type="button" className="nav-overlay-close" onClick={close} aria-label={t.ui.navClose}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="nav-overlay-scroll">
          <nav aria-label={t.ui.navTitle} className="nav-overlay-list">
            <ol>
              {SECTION_IDS.map((id, i) => {
                const isCurrent = i === index;
                return (
                  <li key={id}>
                    <a
                      ref={(el) => {
                        rowRefs.current[i] = el;
                      }}
                      href={sectionHref(i, lang)}
                      className={`nav-row${isCurrent ? ' nav-row-current' : ''}`}
                      aria-current={isCurrent ? 'true' : undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        onGo(i);
                        close();
                      }}
                      tabIndex={open ? 0 : -1}
                    >
                      <span className="nav-row-num" aria-hidden>
                        {localizeDigits(String(i + 1).padStart(2, '0'), lang)}
                      </span>
                      <span className="nav-row-label">{t.ui.pageLabels[i]}</span>
                      {isCurrent && <span className="nav-row-here">{t.ui.current}</span>}
                      <span className="nav-row-mark" aria-hidden />
                    </a>
                  </li>
                );
              })}
              {/* Services — the intent layer sits outside the scene
                  sequence, but joins the same row system (and the
                  arrow-key cycle) so it is never a dead end. A real
                  route change, so no pager interception. */}
              <li>
                <a
                  ref={(el) => {
                    rowRefs.current[total] = el;
                  }}
                  href={serviceHref(undefined, lang)}
                  className="nav-row"
                  tabIndex={open ? 0 : -1}
                >
                  <span className="nav-row-num" aria-hidden>
                    —
                  </span>
                  <span className="nav-row-label">{t.header.servicesLabel}</span>
                  <span className="nav-row-mark" aria-hidden />
                </a>
              </li>
            </ol>
          </nav>

          <p className="nav-overlay-hint">{t.ui.navHint}</p>
        </div>

        {/* bottom-edge progress — the HUD border IS the instrument */}
        <span className="nav-overlay-progress" aria-hidden>
          <motion.span
            className="nav-overlay-progress-fill"
            initial={false}
            animate={{ scaleX: progress }}
            transition={
              prefersReduced
                ? { duration: 0 }
                : { type: 'spring', stiffness: 170, damping: 26 }
            }
          />
        </span>
      </motion.div>
    </div>
  );
}
