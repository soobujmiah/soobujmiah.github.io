'use client';

/* ═══════════════════════════════════════════════════════════════
   DISCRETE PAGER — one full-screen page at a time. Pages turn like
   dark technical paper: subtle tilt + depth scale + spring slide.
   Each page centers when it fits and scrolls internally when it
   doesn't — gestures yield to the inner scroller until its edges,
   then flip exactly one page.

   The pager is the *presentation*; `/work/`, `/research/` … are the
   addresses. Every page it renders is reachable, shareable, and
   server-rendered at its own static route.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MOTION } from '@/app/design-tokens';
import { PAGE_COUNT, SECTION_IDS, indexFromPathname, sectionHref } from '@/app/sections';
import { WorldMap } from '@/components/WorldMap';
import { LanguageProvider, useLang } from '@/app/language';
import {
  NavProvider,
  CustomCursor,
  Preloader,
  Header,
  Footer,
  HudControl,
} from '@/components/ui';
import { NavOverlay } from '@/components/NavOverlay';
import { PullToRefresh } from '@/components/PullToRefresh';
import {
  HeroScene,
  StatsScene,
  AboutScene,
  WorkScene,
  ResearchScene,
  StackScene,
  OpenSourceScene,
  ExperienceScene,
  ContactScene,
} from '@/components/sections';

const WHEEL_THRESHOLD = 24;
const SWIPE_THRESHOLD = 60;
const EDGE_SLACK = 2; // px tolerance for scroll-edge detection

type PageProps = { reducedMotion: boolean; pageIndex: number; armed: boolean };

function PageBody({ index, reducedMotion, armed }: { index: number; reducedMotion: boolean; armed: boolean }) {
  const props: PageProps = { reducedMotion, pageIndex: index, armed };
  switch (index) {
    case 0:
      return <HeroScene {...props} />;
    case 1:
      return <StatsScene />;
    case 2:
      return <AboutScene />;
    case 3:
      return <WorkScene />;
    case 4:
      return <ResearchScene />;
    case 5:
      return <StackScene />;
    case 6:
      return <OpenSourceScene />;
    case 7:
      return <ExperienceScene />;
    case 8:
      return <ContactScene />;
    default:
      return <HeroScene {...props} />;
  }
}

/* Paper turn. Every number comes from the shared motion tokens, so the
   docs, this component, and any future project site cannot drift. */
const PT = MOTION.pageTurn;

const pageVariants = {
  enter: (dir: number) => ({
    y: dir >= 0 ? `${PT.yPercent}%` : `-${PT.yPercent}%`,
    rotateX: dir >= 0 ? PT.rotateX : -PT.rotateX,
    scale: PT.scale,
    opacity: 0,
    transformPerspective: PT.perspective,
  }),
  center: { y: '0%', rotateX: 0, scale: 1, opacity: 1, transformPerspective: PT.perspective },
  exit: (dir: number) => ({
    y: dir >= 0 ? `-${PT.yPercent}%` : `${PT.yPercent}%`,
    rotateX: dir >= 0 ? -PT.rotateX : PT.rotateX,
    scale: PT.scale,
    opacity: 0,
    transformPerspective: PT.perspective,
  }),
};

/* Can the page's inner scroller move further in this direction?
   dir = 1 means "toward next page" (scroll down), -1 "toward prev". */
function canScrollInner(el: HTMLDivElement | null, dir: 1 | -1): boolean {
  if (!el) return false;
  try {
    if (dir > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - EDGE_SLACK;
    return el.scrollTop > EDGE_SLACK;
  } catch {
    return false;
  }
}

function PagerInner({ initialIndex = 0 }: { initialIndex?: number }) {
  const prefersReduced = useReducedMotion();
  const reducedMotion = prefersReduced ?? false;
  const { t, lang } = useLang();
  const [ready, setReady] = useState(false);
  /* True only while the boot splash is actually covering the page. The
     hero's signature construction waits for this to clear, so the
     wordmark is not assembled behind an opaque splash where nobody can
     see it. False for deep links and for reduced-motion users, who
     never get a splash at all. */
  const splashActive = !ready && !reducedMotion && initialIndex === 0;
  const [index, setIndex] = useState(initialIndex);
  const [dir, setDir] = useState(1);
  const [navOpen, setNavOpen] = useState(false);
  const lastFlip = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRefs = useRef<Array<HTMLDivElement | null>>([]);
  const activeScroller = useRef<HTMLDivElement | null>(null);
  const indexRef = useRef(initialIndex);
  indexRef.current = index;
  const urlSynced = useRef(false);

  /* Legacy `#work` deep links from the previous hash-only build are
     rewritten to their real route so old shares keep working. */
  useEffect(() => {
    try {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) return;
      const i = (SECTION_IDS as readonly string[]).indexOf(hash);
      if (i < 0) return;
      const href = sectionHref(i, lang);
      if (window.location.pathname !== href) window.history.replaceState(null, '', href);
      indexRef.current = i;
      setIndex(i);
      setDir(1);
    } catch {
      /* ignore */
    }
  }, [lang]);

  /* Back/forward must move the pager, not just the URL. */
  useEffect(() => {
    const onPop = () => {
      const i = indexFromPathname(window.location.pathname);
      const prev = indexRef.current;
      if (i !== prev) {
        indexRef.current = i;
        setDir(i > prev ? 1 : -1);
        setIndex(i);
      }
      lastFlip.current = Date.now();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /* Keep the address bar on the visible section (no history spam). */
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

  const goToScene = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(PAGE_COUNT - 1, next));
    const prev = indexRef.current;
    if (clamped === prev) return;
    indexRef.current = clamped;
    setDir(clamped > prev ? 1 : -1);
    lastFlip.current = Date.now();
    setIndex(clamped);
  }, []);

  const tryFlip = useCallback((delta: 1 | -1) => {
    const now = Date.now();
    if (now - lastFlip.current < PT.flipLockMs) return;
    const next = Math.max(0, Math.min(PAGE_COUNT - 1, indexRef.current + delta));
    if (next === indexRef.current) return;
    lastFlip.current = now;
    indexRef.current = next;
    setDir(delta);
    setIndex(next);
  }, []);

  /* Touch: dominant-axis vertical swipes. If the page has further to
     scroll in that direction, native scrolling owns the gesture and
     no flip happens; at the edges, the swipe turns the page. */
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t0 = e.touches[0];
    if (t0) touchStart.current = { x: t0.clientX, y: t0.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;
      const t0 = e.changedTouches[0];
      if (!t0) return;
      const dx = t0.clientX - start.x;
      const dy = t0.clientY - start.y;
      if (Math.abs(dy) < SWIPE_THRESHOLD) return;
      if (Math.abs(dy) < Math.abs(dx) * 1.2) return;
      const flipDir = dy < 0 ? 1 : -1;
      if (canScrollInner(scrollRefs.current[indexRef.current] ?? null, flipDir)) return;
      tryFlip(flipDir);
    },
    [tryFlip]
  );

  /* Native non-passive wheel listener — React delegates wheel as passive,
     so preventDefault would warn. Horizontal pans belong to carousels. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onWheelNative = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return; // pinch-zoom gesture, leave alone
      if (navOpen) return;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 800 : 1;
      const deltaX = e.deltaX * unit;
      const deltaY = e.deltaY * unit;
      if (Math.abs(deltaY) < WHEEL_THRESHOLD) return;
      if (Math.abs(deltaX) > Math.abs(deltaY)) return;
      const flipDir = deltaY > 0 ? 1 : -1;
      if (canScrollInner(scrollRefs.current[indexRef.current] ?? null, flipDir)) return;
      e.preventDefault();
      tryFlip(flipDir);
    };
    root.addEventListener('wheel', onWheelNative, { passive: false });
    return () => root.removeEventListener('wheel', onWheelNative);
  }, [tryFlip, navOpen]);

  /* Keyboard paging. Suspended while the navigation overlay is open so
     its own arrow-key handling owns focus. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (navOpen) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const pagingKey =
        e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ArrowUp' || e.key === 'PageUp';
      if (!pagingKey && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      if (e.key === 'Home') {
        goToScene(0);
        return;
      }
      if (e.key === 'End') {
        goToScene(PAGE_COUNT - 1);
        return;
      }
      const flipDir = e.key === 'ArrowDown' || e.key === 'PageDown' ? 1 : -1;
      const sc = scrollRefs.current[indexRef.current] ?? null;
      if (sc && canScrollInner(sc, flipDir)) {
        try {
          sc.scrollBy({
            top: flipDir * Math.max(240, sc.clientHeight * 0.8),
            behavior: reducedMotion ? 'auto' : 'smooth',
          });
        } catch {
          /* ignore */
        }
        return;
      }
      tryFlip(flipDir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tryFlip, goToScene, reducedMotion, navOpen]);

  /* Scroll-linked continuity. The giant page numeral drifts against the
     inner scroll, so a page with more content below reads as deeper than
     one that fits — motion that carries meaning rather than decoration.
     Transform-only, rAF-throttled, skipped for reduced motion. */
  useEffect(() => {
    if (reducedMotion) return;
    const el = scrollRefs.current[index] ?? null;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        try {
          el.style.setProperty('--page-scroll', `${Math.round(el.scrollTop)}px`);
        } catch {
          /* ignore */
        }
      });
    };
    try {
      el.style.setProperty('--page-scroll', '0px');
    } catch {
      /* ignore */
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [index, reducedMotion]);

  const openNav = useCallback(() => setNavOpen(true), []);
  const closeNav = useCallback(() => setNavOpen(false), []);

  const onRefresh = useCallback(() => {
    try {
      window.location.reload();
    } catch {
      /* nothing else we can do */
    }
  }, []);

  return (
    <NavProvider value={{ goToScene, goToTop: () => goToScene(0), openNav }}>
      <CustomCursor />
      {/* boot splash — only on the true entry point; deep links land
          straight on their section instead of waiting for a splash */}
      <AnimatePresence>
        {splashActive && (
          <Preloader key="preloader" onComplete={() => setReady(true)} />
        )}
      </AnimatePresence>

      <Header />

      <div
        ref={rootRef}
        className="pager-root"
        style={{ touchAction: 'pan-x pan-y' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <WorldMap sectionIndex={index} reducedMotion={reducedMotion} />
        <div className="pager-vignette" aria-hidden />

        <AnimatePresence custom={dir} initial={false} mode="sync">
          <motion.div
            key={index}
            className="page-abs"
            custom={dir}
            variants={pageVariants}
            initial={reducedMotion ? false : 'enter'}
            animate="center"
            exit={reducedMotion ? { opacity: 0, transition: { duration: 0 } } : 'exit'}
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    y: { type: 'spring', ...PT.spring },
                    rotateX: { type: 'spring', ...PT.spring },
                    scale: { type: 'spring', ...PT.spring },
                    opacity: { duration: PT.opacitySeconds, ease: 'easeOut' },
                  }
            }
          >
            <div
              ref={(el) => {
                scrollRefs.current[index] = el;
                if (index === indexRef.current) activeScroller.current = el;
              }}
              data-section={SECTION_IDS[index]}
              role="region"
              aria-label={t.ui.pageLabels[index]}
              className="page-scroll"
            >
              <PageBody index={index} reducedMotion={reducedMotion} armed={!splashActive} />
            </div>
          </motion.div>
        </AnimatePresence>

        <HudControl total={PAGE_COUNT} active={index} labels={t.ui.pageLabels} navOpen={navOpen} />
        <PullToRefresh enabled={index === 0} scrollerRef={activeScroller} onRefresh={onRefresh} />
      </div>

      {/* Site progress = section index / (count − 1); footer seam only. */}
      <Footer progress={PAGE_COUNT > 1 ? index / (PAGE_COUNT - 1) : 0} />
      <NavOverlay open={navOpen} onClose={closeNav} index={index} onGo={goToScene} />
    </NavProvider>
  );
}

export function Pager({ initialIndex = 0, initialLang = 'en' }: { initialIndex?: number; initialLang?: 'en' | 'bn' }) {
  return (
    <LanguageProvider initialLang={initialLang}>
      <PagerInner initialIndex={initialIndex} />
    </LanguageProvider>
  );
}
