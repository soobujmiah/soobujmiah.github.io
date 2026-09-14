'use client';

/* ═══════════════════════════════════════════════════════════════
   PULL-TO-REFRESH — a real reload, driven by a real gesture.

   Why this has to be built by hand here (the diagnosed cause):
   `app/globals.css` sets `overflow: hidden` + `overscroll-behavior:
   none` on both `html` and `body`, and the app root is a fixed,
   viewport-height element. The *document is not a scroll container*,
   so Chrome/Android's native pull-to-refresh — which is an overscroll
   of the root scroller — can never fire, and `.page-scroll` sets
   `overscroll-behavior-y: contain` so nothing chains upward either.
   There is no native gesture to "restore" without breaking the
   full-screen pager, so the platform behaviour is implemented here.

   Interaction contract
   --------------------
   - Only armed on the first section (the genuine top of the site)
     with the inner scroller already at `scrollTop <= 0`. Pulling down
     on any other section keeps its existing meaning: turn back one
     page. No ambiguity, no regression to the pager.
   - Requires an intentional, vertical, single-finger downward pull
     (12px arming distance, 1.6x vertical dominance). Horizontal
     carousel drags and pinch-zoom are never touched.
   - `preventDefault` is called only after the gesture is armed, so
     ordinary scrolling and carousels are unaffected before that.
   - Releasing past the threshold calls `window.location.reload()`.
     The indicator is never shown without a real refresh following.
   - No scroll locking, no document mutation, no rubber-band: nothing
     about the scroll position is ever written by this component.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '@/app/language';
import { MOTION } from '@/app/design-tokens';

type Phase = 'idle' | 'pull' | 'ready' | 'refreshing';

export function PullToRefresh({
  enabled,
  scrollerRef,
  onRefresh,
}: {
  enabled: boolean;
  scrollerRef: React.RefObject<HTMLDivElement | null>;
  onRefresh: () => void;
}) {
  const { t } = useLang();
  const [phase, setPhase] = useState<Phase>('idle');
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);
  const startX = useRef<number>(0);
  const armed = useRef(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  const atTop = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return true;
    try {
      return el.scrollTop <= 0;
    } catch {
      return false;
    }
  }, [scrollerRef]);

  const reset = useCallback(() => {
    startY.current = null;
    armed.current = false;
    setPhase('idle');
    setPull(0);
  }, []);

  useEffect(() => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
    if (!enabled) {
      reset();
      return;
    }

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return; // pinch/zoom owns multi-touch
      if (phaseRef.current === 'refreshing') return;
      if (!atTop()) return;
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
      armed.current = false;
    };

    const onMove = (e: TouchEvent) => {
      if (startY.current === null || e.touches.length !== 1) return;
      const dy = e.touches[0].clientY - startY.current;
      const dx = Math.abs(e.touches[0].clientX - startX.current);

      if (!armed.current) {
        if (dy <= 0) {
          /* Scrolling up / paging forward — release the gesture entirely. */
          if (dy < -4) startY.current = null;
          return;
        }
        if (dy < MOTION.pullToRefresh.armPx) return;
        /* Vertical dominance required: horizontal carousels keep their drag. */
        if (dy < dx * 1.6) {
          startY.current = null;
          return;
        }
        if (!atTop()) {
          startY.current = null;
          return;
        }
        armed.current = true;
      }

      /* Armed: this gesture belongs to us. */
      e.preventDefault();
      const { armPx, resistance, maxPx, thresholdPx } = MOTION.pullToRefresh;
      const committed = Math.min((dy - armPx) / resistance, maxPx);
      setPull(committed);
      setPhase(committed >= thresholdPx ? 'ready' : 'pull');
    };

    const onEnd = () => {
      if (!armed.current) {
        reset();
        return;
      }
      const committed = phaseRef.current === 'ready';
      armed.current = false;
      startY.current = null;
      if (!committed) {
        reset();
        return;
      }
      /* A genuine reload — the indicator is not cosmetic. */
      setPhase('refreshing');
      setPull(MOTION.pullToRefresh.thresholdPx);
      refreshTimer.current = setTimeout(() => onRefresh(), 110);
    };

    const onCancel = () => {
      if (armed.current) reset();
      else startY.current = null;
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', onCancel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onCancel);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [enabled, atTop, reset, onRefresh]);

  const { thresholdPx } = MOTION.pullToRefresh;
  const progress = Math.max(0, Math.min(pull / thresholdPx, 1));
  const visible = phase !== 'idle';
  const circumference = 2 * Math.PI * 9;
  const label = phase === 'refreshing' ? t.ui.refreshing : phase === 'ready' ? t.ui.release : t.ui.pull;

  return (
    <div
      className="ptr-host"
      data-visible={visible ? 'true' : 'false'}
      data-phase={phase}
      style={{ transform: `translate3d(-50%, ${Math.round(pull * 0.72)}px, 0)` }}
      role="status"
      aria-live="polite"
    >
      {/* Only rendered while the gesture is live, so the live region is
          silent at rest instead of announcing "Pull to refresh" forever. */}
      {visible && (
        <span className="ptr-pill">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden className="ptr-ring">
            <circle cx="11" cy="11" r="9" fill="none" stroke="rgba(228,226,223,0.14)" strokeWidth="1.5" />
            <circle
              cx="11"
              cy="11"
              r="9"
              fill="none"
              stroke="#22c55e"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              transform="rotate(-90 11 11)"
            />
          </svg>
          <span className="ptr-label">{label}</span>
        </span>
      )}
    </div>
  );
}
