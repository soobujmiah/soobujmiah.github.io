'use client';

/* ═══════════════════════════════════════════════════════════════
   JOURNEY — the host for "Inside One Device".

   Responsibilities, and deliberately only these:

     · mount exactly ONE environment (`components/Stage.tsx`)
     · render exactly ONE chapter at a time, as the page's <main>
     · turn input (wheel, keys, swipe, rail clicks) into one depth
       change at a time, never a scroll-through of the machine
     · keep the address bar on the chapter being read, because
       `/work/`, `/research/` … are real static routes

   What it deliberately does NOT do: animate the page. The camera
   carries the motion; the chapter's own entrance is one CSS
   animation keyed on the stratum, which costs no JavaScript and
   stops existing under `prefers-reduced-motion`. The previous host
   drove five simultaneous spring systems through framer-motion, and
   the result was the layered soup this rebuild exists to end.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from 'react';
import { MOTION } from '@/app/design-tokens';
import { PAGE_COUNT, SECTION_IDS, indexFromPathname, sectionHref } from '@/app/sections';
import { LanguageProvider, useLang } from '@/app/language';
import { CHAPTERS } from '@/components/chapters';
import { DepthRail } from '@/components/DepthRail';
import { Masthead, SiteFooter } from '@/components/chrome';
import { Stage } from '@/components/Stage';

const { lockMs, wheelDelta, swipePx } = MOTION.input;
/** px of tolerance when deciding whether a scroller is at its edge. */
const EDGE_SLACK = 2;

/** Can this scroller still move in that direction (1 = deeper)? */
function canScroll(el: HTMLElement | null, dir: 1 | -1): boolean {
  if (!el) return false;
  try {
    if (dir > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - EDGE_SLACK;
    return el.scrollTop > EDGE_SLACK;
  } catch {
    return false;
  }
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function JourneyInner({ initialIndex = 0 }: { initialIndex?: number }) {
  const { t, lang } = useLang();
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(initialIndex);
  const indexRef = useRef(initialIndex);
  indexRef.current = index;
  const lastMove = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const urlSynced = useRef(false);

  /* ── One place that changes depth ── */
  const goTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(PAGE_COUNT - 1, next));
    if (clamped === indexRef.current) return;
    indexRef.current = clamped;
    lastMove.current = Date.now();
    setIndex(clamped);
    pageRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const step = useCallback(
    (delta: 1 | -1) => {
      if (Date.now() - lastMove.current < lockMs) return;
      goTo(indexRef.current + delta);
    },
    [goTo]
  );

  /* ── Legacy addresses from the hash-only build ── */
  useEffect(() => {
    try {
      const path = window.location.pathname;
      if (path === '/stack/' || path === '/bn/stack/') window.history.replaceState(null, '', sectionHref(1, lang));
      if (path === '/open-source/' || path === '/bn/open-source/') {
        window.history.replaceState(null, '', sectionHref(4, lang));
      }
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) return;
      const i = (SECTION_IDS as readonly string[]).indexOf(hash);
      if (i < 0) return;
      const href = sectionHref(i, lang);
      if (window.location.pathname !== href) window.history.replaceState(null, '', href);
      indexRef.current = i;
      setIndex(i);
    } catch {
      /* a hostile history implementation is not worth a broken page */
    }
  }, [lang]);

  /* ── Back / forward must move the camera, not just the URL ── */
  useEffect(() => {
    const onPop = () => {
      const i = indexFromPathname(window.location.pathname);
      if (i !== indexRef.current) {
        indexRef.current = i;
        setIndex(i);
      }
      lastMove.current = Date.now();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /* ── Address bar follows the chapter (no history spam) ── */
  useEffect(() => {
    if (!urlSynced.current) {
      urlSynced.current = true;
      return;
    }
    try {
      const href = sectionHref(index, lang);
      if (window.location.pathname !== href) window.history.pushState(null, '', href);
    } catch {
      /* ignore */
    }
  }, [index, lang]);

  /* ── Wheel / trackpad. Native listener, because React delegates
        wheel as passive and preventDefault would warn. ── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return; // pinch-zoom belongs to the browser
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 800 : 1;
      const dx = e.deltaX * unit;
      const dy = e.deltaY * unit;
      if (Math.abs(dy) < wheelDelta || Math.abs(dx) > Math.abs(dy)) return;
      const dir = dy > 0 ? 1 : -1;
      if (canScroll(pageRef.current, dir)) return; // the chapter still has text
      e.preventDefault();
      step(dir);
    };
    root.addEventListener('wheel', onWheel, { passive: false });
    return () => root.removeEventListener('wheel', onWheel);
  }, [step]);

  /* ── Keyboard: paging keys at the edges, real scrolling before ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const paging =
        e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ArrowUp' || e.key === 'PageUp';
      if (!paging && e.key !== 'Home' && e.key !== 'End') return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      e.preventDefault();
      if (e.key === 'Home') return goTo(0);
      if (e.key === 'End') return goTo(PAGE_COUNT - 1);
      const dir = e.key === 'ArrowDown' || e.key === 'PageDown' ? 1 : -1;
      const page = pageRef.current;
      if (page && canScroll(page, dir)) {
        try {
          page.scrollBy({
            top: dir * Math.max(240, page.clientHeight * 0.8),
            behavior: reducedMotion ? 'auto' : 'smooth',
          });
        } catch {
          /* ignore */
        }
        return;
      }
      step(dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, goTo, reducedMotion]);

  /* ── Touch: a vertical swipe at the chapter's edge goes deeper ── */
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dy) < swipePx || Math.abs(dy) < Math.abs(dx) * 1.2) return;
      const dir = dy < 0 ? 1 : -1;
      if (canScroll(pageRef.current, dir)) return;
      step(dir);
    },
    [step]
  );

  const ActiveChapter = CHAPTERS[index] ?? CHAPTERS[0];

  return (
    <div className="journey" ref={rootRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <Stage chapter={index} reducedMotion={reducedMotion} />
      <Masthead />
      {/* One <main> per route, and it is the chapter. `key` remounts it
          so the CSS settle runs once per stratum. */}
      <main
        key={index}
        ref={(el) => {
          pageRef.current = el;
        }}
        className="page"
        data-section={SECTION_IDS[index]}
        data-stratum={index}
        aria-label={t.ui.pageLabels[index]}
      >
        <ActiveChapter index={index} />
      </main>
      <DepthRail index={index} onGo={goTo} />
      <SiteFooter />
    </div>
  );
}

export function Journey({
  initialIndex = 0,
  initialLang = 'en',
}: {
  initialIndex?: number;
  initialLang?: 'en' | 'bn';
}) {
  return (
    <LanguageProvider initialLang={initialLang}>
      <JourneyInner initialIndex={initialIndex} />
    </LanguageProvider>
  );
}
