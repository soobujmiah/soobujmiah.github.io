'use client';

import { useEffect, useRef } from 'react';

type Particle = { x: number; y: number; depth: number; speed: number; phase: number };

const COUNT = 110;

function particles(): Particle[] {
  return Array.from({ length: COUNT }, (_, i) => ({
    x: ((i * 73.91) % 101) / 101,
    y: ((i * 43.37) % 97) / 97,
    depth: 0.25 + ((i * 19.19) % 67) / 67,
    speed: 0.35 + ((i * 11.17) % 71) / 71,
    phase: i * 2.39996,
  }));
}

/** Moving weather, light and depth tied to the architecture in each film plate. */
export function LivingAtmosphere({ sceneIndex, reducedMotion }: { sceneIndex: number; reducedMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !context) return;

    const motes = particles();
    const location = sceneIndex < 2 ? 0 : sceneIndex < 5 || sceneIndex === 7 ? 1 : 2;
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = 0;
    let running = true;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (!running || now - last < 32) return;
      last = now;
      const t = now * 0.001;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = 'screen';

      // The beams sit on architectural features, so their motion belongs to
      // the pictured place instead of reading as a generic particle layer.
      if (location === 0) {
        const beaconX = width * (0.73 + Math.sin(t * 0.13) * 0.004);
        const beam = context.createLinearGradient(beaconX - width * 0.08, 0, beaconX + width * 0.08, 0);
        beam.addColorStop(0, 'rgba(74,222,128,0)');
        beam.addColorStop(0.5, `rgba(142,255,183,${0.035 + (Math.sin(t * 1.5) + 1) * 0.02})`);
        beam.addColorStop(1, 'rgba(74,222,128,0)');
        context.fillStyle = beam;
        context.fillRect(beaconX - width * 0.08, height * 0.12, width * 0.16, height * 0.43);
        context.lineWidth = 1;
        for (let i = 0; i < 24; i += 1) {
          const x = ((i * 0.137 + t * (0.018 + i % 3 * 0.006)) % 1) * width;
          const y = ((i * 0.317 + t * (0.16 + i % 4 * 0.025)) % 0.68) * height;
          context.beginPath();
          context.strokeStyle = `rgba(215,235,225,${0.05 + (i % 4) * 0.025})`;
          context.moveTo(x, y);
          context.lineTo(x - width * 0.004, y + height * 0.025);
          context.stroke();
        }
        const vehicleX = ((t * 0.055) % 1) * width;
        context.fillStyle = 'rgba(179,255,203,0.34)';
        context.shadowColor = '#86efac';
        context.shadowBlur = 12;
        context.fillRect(vehicleX, height * 0.64, Math.max(2, width * 0.006), 1.5);
        context.shadowBlur = 0;
      } else if (location === 1) {
        const energy = context.createRadialGradient(width * 0.5, height * 0.27, 0, width * 0.5, height * 0.27, width * 0.19);
        energy.addColorStop(0, `rgba(109,255,168,${0.08 + (Math.sin(t * 1.9) + 1) * 0.045})`);
        energy.addColorStop(1, 'rgba(22,163,74,0)');
        context.fillStyle = energy;
        context.fillRect(width * 0.27, 0, width * 0.46, height * 0.7);
        for (let i = 0; i < 16; i += 1) {
          const x = width * (0.42 + i * 0.01);
          const y = ((t * (0.13 + i % 4 * 0.018) + i * 0.173) % 0.49) * height;
          context.beginPath();
          context.strokeStyle = `rgba(134,239,172,${0.08 + (i % 5) * 0.035})`;
          context.lineWidth = i % 5 === 0 ? 1.5 : 0.7;
          context.moveTo(x, y);
          context.lineTo(x, y + height * (0.02 + i % 3 * 0.012));
          context.stroke();
        }
        const floorPulse = ((t * 0.22) % 1);
        const reflection = context.createRadialGradient(width * 0.5, height * (0.44 + floorPulse * 0.5), 0, width * 0.5, height * (0.44 + floorPulse * 0.5), width * (0.06 + floorPulse * 0.2));
        reflection.addColorStop(0, `rgba(96,255,158,${0.08 * (1 - floorPulse)})`);
        reflection.addColorStop(1, 'rgba(96,255,158,0)');
        context.fillStyle = reflection;
        context.fillRect(0, height * 0.42, width, height * 0.58);
      } else {
        const horizon = context.createRadialGradient(width * 0.5, height * 0.14, 0, width * 0.5, height * 0.14, width * 0.42);
        horizon.addColorStop(0, `rgba(116,255,160,${0.08 + (Math.sin(t * 1.1) + 1) * 0.035})`);
        horizon.addColorStop(1, 'rgba(22,163,74,0)');
        context.fillStyle = horizon;
        context.fillRect(0, 0, width, height * 0.52);
        const scanY = height * (0.13 + ((t * 0.045) % 0.19));
        const scan = context.createLinearGradient(0, scanY - 12, 0, scanY + 12);
        scan.addColorStop(0, 'rgba(134,239,172,0)');
        scan.addColorStop(0.5, 'rgba(134,239,172,0.11)');
        scan.addColorStop(1, 'rgba(134,239,172,0)');
        context.fillStyle = scan;
        context.fillRect(width * 0.29, scanY - 12, width * 0.42, 24);
        for (let i = 0; i < 14; i += 1) {
          const x = width * (0.13 + i * 0.057);
          const y = ((t * (0.02 + i % 3 * 0.007) + i * 0.147) % 0.42) * height;
          context.fillStyle = `rgba(155,255,193,${0.08 + i % 4 * 0.025})`;
          context.fillRect(x, y, 0.8, height * (0.008 + i % 3 * 0.003));
        }
      }

      for (const mote of motes) {
        let x: number;
        let y: number;
        if (location === 0) {
          x = ((mote.x + t * 0.008 * mote.speed) % 1) * width;
          y = ((mote.y + t * 0.045 * mote.speed) % 1) * height;
        } else if (location === 1) {
          x = (0.5 + (mote.x - 0.5) * 0.55 + Math.sin(t * 0.45 + mote.phase) * 0.016) * width;
          y = ((mote.y - t * 0.035 * mote.speed + 4) % 1) * height;
        } else {
          const travel = (mote.y + t * 0.02 * mote.speed) % 1;
          x = (0.5 + (mote.x - 0.5) * (0.4 + travel * 0.9)) * width;
          y = (0.15 + travel * 0.85) * height;
        }
        const radius = 0.4 + mote.depth * (location === 2 ? 1.5 : 1.1);
        context.beginPath();
        context.fillStyle = `rgba(${location === 0 ? '210,231,222' : '126,255,175'},${0.08 + mote.depth * 0.27})`;
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        if (mote.depth > 0.72 && location !== 0) {
          context.beginPath();
          context.strokeStyle = `rgba(116,255,172,${0.06 + mote.depth * 0.12})`;
          context.lineWidth = 0.6;
          context.moveTo(x, y);
          context.lineTo(x, y + (location === 1 ? 8 : -8) * mote.depth);
          context.stroke();
        }
      }
      context.globalCompositeOperation = 'source-over';
    };

    const visibility = () => {
      running = !document.hidden;
      if (!running) context.clearRect(0, 0, width, height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    document.addEventListener('visibilitychange', visibility);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [sceneIndex, reducedMotion]);

  return <canvas ref={canvasRef} className="cinema-world-atmosphere" aria-hidden="true" />;
}
