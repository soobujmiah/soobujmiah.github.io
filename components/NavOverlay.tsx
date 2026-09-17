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

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
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

  const progress = useMemo(() => (index + 1) / total, [index, total]);

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
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nav-overlay-title"
        aria-hidden={!open}
        className="nav-overlay-panel"
        initial={false}
        animate={open ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -14, scale: 0.985 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
        onKeyDown={onKeyDown}
      >
        <div className="nav-overlay-head">
          <div>
            <p className="nav-overlay-eyebrow">{t.ui.navTitle}</p>
            <h2 id="nav-overlay-title" className="nav-overlay-title">
              {t.ui.pageLabels[index]}
            </h2>
          </div>
          <button type="button" className="nav-overlay-close" onClick={close} aria-label={t.ui.navClose}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="nav-overlay-rail" aria-hidden>
          <motion.span
            className="nav-overlay-rail-fill"
            initial={false}
            animate={{ scaleX: progress }}
            transition={{ type: 'spring', stiffness: 140, damping: 22, mass: 1 }}
          />
        </div>

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
                    href={sectionHref(i)}
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
                href={serviceHref()}
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
      </motion.div>
    </div>
  );
}
