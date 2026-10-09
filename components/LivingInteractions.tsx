'use client';

import { useEffect } from 'react';

const SELECTOR = '.page-content a, .page-content button, .page-content .rounded-xl, .page-content .rounded-2xl, .page-content .repo-card, .services-doc main a, .services-doc main button, .services-doc main .rounded-2xl, .nav-overlay-panel a, .nav-overlay-panel button';

/** One delegated listener gives cards and controls a pointer-following light. */
export function LivingInteractions() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(pointer: fine)').matches) return;
    let active: HTMLElement | null = null;
    let frame = 0;
    let nextX = 0;
    let nextY = 0;

    const paint = () => {
      active?.style.setProperty('--live-x', `${nextX}px`);
      active?.style.setProperty('--live-y', `${nextY}px`);
      frame = 0;
    };
    const move = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(SELECTOR) : null;
      if (target !== active) {
        active?.removeAttribute('data-live-active');
        active = target;
        active?.setAttribute('data-live-active', 'true');
      }
      if (!active) return;
      const bounds = active.getBoundingClientRect();
      nextX = event.clientX - bounds.left;
      nextY = event.clientY - bounds.top;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const leave = () => {
      active?.removeAttribute('data-live-active');
      active = null;
    };
    document.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('blur', leave);
    document.addEventListener('pointerleave', leave);
    return () => {
      document.removeEventListener('pointermove', move);
      window.removeEventListener('blur', leave);
      document.removeEventListener('pointerleave', leave);
      cancelAnimationFrame(frame);
      leave();
    };
  }, []);

  return null;
}
