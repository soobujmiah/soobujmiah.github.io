'use client';

import { useEffect } from 'react';

/** Adds one entrance to each document beat as it reaches the viewport.
 * The content is visible by default, including without JavaScript. */
export function DocumentMotion({ scopeSelector = '.services-doc main', beatSelector = 'h1, h2, h3, p, li, dt, dd, a.rounded-2xl, section.rounded-2xl, div.rounded-lg' }: { scopeSelector?: string; beatSelector?: string }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const main = document.querySelector<HTMLElement>(scopeSelector);
    if (!main || !('IntersectionObserver' in window)) return;

    const beats = Array.from(main.querySelectorAll<HTMLElement>(beatSelector));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = entry.target as HTMLElement;
        target.classList.add('cinema-enter');
        observer.unobserve(target);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });

    beats.forEach((beat, index) => {
      beat.style.setProperty('--cinema-delay', `${(index % 5) * 55}ms`);
      observer.observe(beat);
    });
    return () => observer.disconnect();
  }, [scopeSelector, beatSelector]);

  return null;
}
