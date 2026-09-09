'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useScroll, useMotionValue, useSpring, useVelocity } from 'framer-motion';
import { navLinks, profile } from '@/app/data';

/* ═══════════════════════════════════════════════════════════════
   CUSTOM CURSOR — magnetic with velocity-based stretch
   Preserved from the existing portfolio.
   ═══════════════════════════════════════════════════════════════ */

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [visible, setVisible] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const ringX = useMotionValue(0);
  const ringY = useMotionValue(0);
  const velX = useVelocity(mouseX);
  const velY = useVelocity(mouseY);

  const ringScale = useSpring(
    useTransform([velX, velY], ([vx, vy]) => {
      const speed = Math.sqrt((Number(vx) || 0) ** 2 + (Number(vy) || 0) ** 2);
      return Math.min(1 + speed * 0.001, 1.4);
    }),
    { stiffness: 300, damping: 20 }
  );

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      setVisible(true);
    };

    const animate = () => {
      const currentX = ringX.get();
      const currentY = ringY.get();
      ringX.set(currentX + (mouseX.get() - currentX) * 0.12);
      ringY.set(currentY + (mouseY.get() - currentY) * 0.12);
      requestAnimationFrame(animate);
    };

    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    const onOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button, [data-magnetic]')) setHovering(true);
    };
    const onOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button, [data-magnetic]')) setHovering(false);
    };
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);

    const raf = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      cancelAnimationFrame(raf);
    };
  }, [mouseX, mouseY, ringX, ringY]);

  return (
    <>
      <motion.div
        ref={dotRef}
        className="cursor-dot"
        style={{
          x: mouseX,
          y: mouseY,
          opacity: visible ? 1 : 0,
          scale: clicking ? 0.5 : 1,
        }}
      />
      <motion.div
        ref={ringRef}
        className={`cursor-ring${hovering ? ' hover' : ''}`}
        style={{
          x: ringX,
          y: ringY,
          opacity: visible ? 1 : 0,
          scale: hovering ? 1.8 : clicking ? 0.7 : ringScale,
        }}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAGNETIC BUTTON / LINK
   ═══════════════════════════════════════════════════════════════ */

export function Magnetic({
  children,
  className = '',
  href,
  strength = 0.25,
  style,
  ...props
}: {
  children: ReactNode;
  className?: string;
  href?: string;
  strength?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setOffset({
      x: (e.clientX - rect.left - rect.width / 2) * strength,
      y: (e.clientY - rect.top - rect.height / 2) * strength,
    });
  };

  const onLeave = () => setOffset({ x: 0, y: 0 });

  return (
    <a
      ref={ref}
      href={href}
      data-magnetic
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: offset.x === 0 ? 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' : 'transform 0.12s ease-out',
        ...style,
      }}
      {...props}
    >
      {children}
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL REVEAL — fade up on view
   ═══════════════════════════════════════════════════════════════ */

export function Reveal({
  children,
  delay = 0,
  className = '',
  y = 30,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TEXT REVEAL — word by word
   ═══════════════════════════════════════════════════════════════ */

export function TextReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  if (typeof children === 'string') {
    const words = children.split(' ');
    return (
      <span ref={ref} className={className}>
        {words.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden align-bottom mr-[0.25em]">
            <motion.span
              className="inline-block"
              initial={{ y: '110%' }}
              animate={inView ? { y: 0 } : {}}
              transition={{ duration: 0.55, delay: delay + i * 0.035, ease: [0.16, 1, 0.3, 1] }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      <motion.span
        className="inline-block"
        initial={{ y: '110%' }}
        animate={inView ? { y: 0 } : {}}
        transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL PROGRESS BAR
   ═══════════════════════════════════════════════════════════════ */

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[99999] origin-left"
      style={{ scaleX, background: 'linear-gradient(90deg, #38bdf8, #00e5a0)' }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRELOADER
   ═══════════════════════════════════════════════════════════════ */

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 12 + 4;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(onComplete, 500);
      }
      setProgress(Math.min(current, 100));
    }, 100);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100000] flex flex-col items-center justify-center"
      style={{ background: '#060608' }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="text-center"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] mb-5" style={{ color: 'rgba(232,230,227,0.25)' }}>
          Initializing
        </p>
        <p className="font-mono text-6xl font-extralight tabular-nums" style={{ color: '#e8e6e3' }}>
          {String(Math.round(progress)).padStart(3, '0')}
        </p>
      </motion.div>
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-40 h-px" style={{ background: 'rgba(232,230,227,0.05)' }}>
        <motion.div
          className="h-full"
          style={{ width: `${progress}%`, background: '#38bdf8' }}
          transition={{ duration: 0.08 }}
        />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HEADER
   ═══════════════════════════════════════════════════════════════ */

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-[9998] transition-all duration-500 ${
        scrolled ? 'py-3 backdrop-blur-xl border-b' : 'py-5'
      }`}
      style={scrolled ? { background: 'rgba(6,6,8,0.75)', borderColor: 'rgba(232,230,227,0.04)' } : {}}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <a href="#" className="font-mono text-sm font-medium tracking-tight" style={{ color: '#e8e6e3' }} data-magnetic>
          sobuj<span style={{ color: '#38bdf8' }}>.</span>miah
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-xs uppercase tracking-[0.1em] transition-colors duration-300 hover:opacity-100"
              style={{ color: 'rgba(232,230,227,0.4)' }}
              data-magnetic
            >
              {l.label}
            </a>
          ))}
        </nav>
        <Magnetic
          href="https://github.com/soobujmiah"
          className="rounded-full px-4 py-1.5 text-[11px] font-medium transition-colors duration-300"
          style={{ border: '1px solid rgba(232,230,227,0.12)', color: '#e8e6e3' }}
          strength={0.2}
        >
          GitHub
        </Magnetic>
      </div>
    </motion.header>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════ */

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-[9997] border-t py-3" style={{ borderColor: 'rgba(232,230,227,0.04)', background: 'rgba(6,6,8,0.6)', backdropFilter: 'blur(12px)' }}>
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 sm:flex-row">
        <p className="font-mono text-[10px]" style={{ color: 'rgba(232,230,227,0.15)' }}>
          © {new Date().getFullYear()} {profile.nameFull}. Built from a phone.
        </p>
        <p className="font-mono text-[10px]" style={{ color: 'rgba(232,230,227,0.15)' }}>
          Every claim backed by CI or real-device evidence.
        </p>
      </div>
    </footer>
  );
}

