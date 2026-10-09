'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const FILM = [
  { src: '/cinema/city.mp4', start: 0 },
  { src: '/cinema/city.mp4', start: 11 },
  { src: '/cinema/passage.mp4', start: 0 },
  { src: '/cinema/passage.mp4', start: 4 },
  { src: '/cinema/passage.mp4', start: 8 },
  { src: '/cinema/core.mp4', start: 0 },
  { src: '/cinema/core.mp4', start: 3 },
  { src: '/cinema/passage.mp4', start: 4 },
  { src: '/cinema/core.mp4', start: 3 },
] as const;

/** One active shot at a time. The static world underneath is the first frame and fallback. */
export function LivingAtmosphere({ sceneIndex, reducedMotion }: { sceneIndex: number; reducedMotion: boolean }) {
  const [canPlayFilm, setCanPlayFilm] = useState(false);
  const [smallScreen, setSmallScreen] = useState(false);
  const [visibleShot, setVisibleShot] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const dataSaver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setCanPlayFilm(!reducedMotion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !dataSaver);
  }, [reducedMotion]);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setSmallScreen(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!canPlayFilm) return;
    const update = () => {
      const video = videoRef.current;
      if (!video) return;
      if (document.hidden) video.pause();
      else void video.play().catch(() => { /* static frame remains visible */ });
    };
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, [canPlayFilm, sceneIndex]);

  useEffect(() => { setVisibleShot(null); }, [sceneIndex]);

  if (!canPlayFilm) return null;
  const shot = FILM[sceneIndex] ?? FILM[0];
  const src = smallScreen && shot.src !== '/cinema/passage.mp4'
    ? shot.src.replace('.mp4', '-mobile.mp4')
    : shot.src;

  return (
    <div className="cinema-world-film" aria-hidden="true">
      <AnimatePresence initial={false} mode="sync">
        <motion.video
          key={`${sceneIndex}-${src}`}
          ref={videoRef}
          className="cinema-world-video"
          src={src}
          muted
          playsInline
          autoPlay
          loop
          preload="metadata"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: visibleShot === sceneIndex ? 1 : 0, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ opacity: { duration: 0.9, ease: [0.22, 0.8, 0.2, 1] }, scale: { duration: 3.2, ease: [0.16, 1, 0.3, 1] } }}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            video.currentTime = Math.min(shot.start, Math.max(0, video.duration - 1));
          }}
          onCanPlay={() => setVisibleShot(sceneIndex)}
        />
      </AnimatePresence>
    </div>
  );
}
