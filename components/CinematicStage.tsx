'use client';

import { useEffect, useRef } from 'react';

type Vec3 = readonly [number, number, number];
type Segment = { a: Vec3; b: Vec3; weight: number };
type Face = { vertices: Vec3[]; weight: number };
type Scene = { lines: Segment[]; points: Vec3[]; faces: Face[] };
type ScreenPoint = { x: number; y: number; z: number; scale: number };

const TAU = Math.PI * 2;
const FRAME_MS = 1000 / 30;
const SCENE_FADE_MS = 1150;

function makeScene(index: number): Scene {
  const lines: Segment[] = [];
  const points: Vec3[] = [];
  const faces: Face[] = [];
  const add = (a: Vec3, b: Vec3, weight = 1) => lines.push({ a, b, weight });
  const path = (vertices: Vec3[], weight = 1) => {
    for (let i = 1; i < vertices.length; i++) add(vertices[i - 1], vertices[i], weight);
  };
  const ring = (radius: number, axis: 'x' | 'y' | 'z', offset = 0, weight = 1) => {
    const vertices: Vec3[] = [];
    const inner: Vec3[] = [];
    for (let i = 0; i <= 84; i++) {
      const t = (i / 84) * TAU;
      const c = Math.cos(t) * radius;
      const s = Math.sin(t) * radius;
      vertices.push(axis === 'x' ? [offset, c, s] : axis === 'y' ? [c, offset, s] : [c, s, offset]);
      const ic = Math.cos(t) * (radius - 0.08);
      const is = Math.sin(t) * (radius - 0.08);
      inner.push(axis === 'x' ? [offset, ic, is] : axis === 'y' ? [ic, offset, is] : [ic, is, offset]);
    }
    path(vertices, weight);
    for (let i = 0; i < 84; i += 3) {
      faces.push({ vertices: [vertices[i], vertices[i + 3], inner[i + 3], inner[i]], weight: weight * 0.55 });
    }
  };
  const box = (cx: number, cy: number, cz: number, size: number) => {
    const h = size / 2;
    const v: Vec3[] = [
      [cx - h, cy - h, cz - h], [cx + h, cy - h, cz - h],
      [cx + h, cy + h, cz - h], [cx - h, cy + h, cz - h],
      [cx - h, cy - h, cz + h], [cx + h, cy - h, cz + h],
      [cx + h, cy + h, cz + h], [cx - h, cy + h, cz + h],
    ];
    for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) {
      add(v[a], v[b], 0.8);
    }
    for (const face of [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]) {
      faces.push({ vertices: face.map((i) => v[i]), weight: 0.7 });
    }
    points.push(v[0], v[2], v[5], v[7]);
  };

  switch (index) {
    case 0: // Identity: orbital instrument around a central axis.
      ring(1.08, 'x', 0, 1.15);
      ring(1.08, 'y', 0, 1.15);
      ring(1.08, 'z', 0, 0.8);
      for (let i = 0; i < 12; i++) {
        const t = (i / 12) * TAU;
        points.push([Math.cos(t) * 1.08, Math.sin(t) * 1.08, 0]);
      }
      break;
    case 1: // Presence: a measured array, rather than invented metrics.
      for (let x = -2; x <= 2; x++) {
        for (let z = -2; z <= 2; z++) {
          const height = 0.25 + ((x * x + z * z + 3) % 5) * 0.19;
          const a: Vec3 = [x * 0.42, -0.68, z * 0.42];
          const b: Vec3 = [x * 0.42, -0.68 + height, z * 0.42];
          add(a, b, 0.7);
          points.push(b);
        }
      }
      ring(1.2, 'y', -0.7, 0.42);
      break;
    case 2: // About: two strands built from a shared path.
      for (let strand = 0; strand < 2; strand++) {
        const vertices: Vec3[] = [];
        for (let i = 0; i <= 90; i++) {
          const t = i / 90;
          const a = t * TAU * 2 + strand * Math.PI;
          vertices.push([Math.cos(a) * 0.65, (t - 0.5) * 2.2, Math.sin(a) * 0.65]);
        }
        path(vertices, 0.85);
      }
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const a = t * TAU * 2;
        add([Math.cos(a) * 0.65, (t - 0.5) * 2.2, Math.sin(a) * 0.65],
          [-Math.cos(a) * 0.65, (t - 0.5) * 2.2, -Math.sin(a) * 0.65], 0.42);
      }
      for (let i = 0; i < 88; i += 4) {
        const t0 = i / 90;
        const t1 = (i + 4) / 90;
        const a0 = t0 * TAU * 2;
        const a1 = t1 * TAU * 2;
        faces.push({ vertices: [
          [Math.cos(a0) * 0.65, (t0 - 0.5) * 2.2, Math.sin(a0) * 0.65],
          [Math.cos(a1) * 0.65, (t1 - 0.5) * 2.2, Math.sin(a1) * 0.65],
          [-Math.cos(a1) * 0.65, (t1 - 0.5) * 2.2, -Math.sin(a1) * 0.65],
          [-Math.cos(a0) * 0.65, (t0 - 0.5) * 2.2, -Math.sin(a0) * 0.65],
        ], weight: 0.3 });
      }
      break;
    case 3: // Work: a constellation of buildable volumes.
      box(-0.48, 0.28, -0.32, 0.78);
      box(0.5, -0.22, 0.24, 0.98);
      box(0.28, 0.72, -0.63, 0.47);
      add([-0.09, 0.28, -0.32], [0.01, -0.22, 0.24], 0.48);
      break;
    case 4: // Research: nested trajectories and sampled observations.
      ring(1.07, 'x', 0, 1);
      ring(0.83, 'y', 0, 0.65);
      ring(0.62, 'z', 0, 0.65);
      for (let i = 0; i < 24; i++) {
        const t = (i / 24) * TAU;
        points.push([Math.cos(t) * 1.07, Math.sin(t * 2) * 0.24, Math.sin(t) * 1.07]);
      }
      break;
    case 5: // Experience: parallel planes connected through time.
      for (let i = 0; i < 4; i++) {
        const z = (i - 1.5) * 0.48;
        const size = 0.77 + i * 0.13;
        path([[-size, -size * 0.55, z], [size, -size * 0.55, z], [size, size * 0.55, z], [-size, size * 0.55, z], [-size, -size * 0.55, z]], 0.68);
        faces.push({ vertices: [[-size, -size * 0.55, z], [size, -size * 0.55, z], [size, size * 0.55, z], [-size, size * 0.55, z]], weight: 0.4 });
        points.push([size, size * 0.55, z]);
      }
      for (const x of [-0.75, 0.75]) add([x, 0, -0.72], [x, 0, 0.72], 0.55);
      break;
    case 6: // Contact: open arcs converging on a reachable point.
      for (let i = 0; i < 5; i++) {
        const radius = 0.36 + i * 0.24;
        const vertices: Vec3[] = [];
        for (let j = 0; j <= 58; j++) {
          const t = -Math.PI * 0.82 + (j / 58) * Math.PI * 1.64;
          vertices.push([Math.cos(t) * radius, Math.sin(t) * radius, (i - 2) * 0.18]);
        }
        path(vertices, 0.75);
      }
      points.push([0, 0, 0]);
      break;
    case 7: // Services: an architectural field of connected modules.
      box(-0.68, -0.14, -0.35, 0.62);
      box(0.12, 0.22, 0.18, 0.82);
      box(0.72, -0.34, -0.48, 0.55);
      add([-0.37, -0.14, -0.35], [-0.29, 0.22, 0.18], 0.6);
      add([0.53, 0.22, 0.18], [0.45, -0.34, -0.48], 0.6);
      break;
    default: // Verification: concentric evidence, with a resolved core.
      ring(1.12, 'y', 0, 0.85);
      ring(0.82, 'x', 0, 0.75);
      ring(0.52, 'z', 0, 0.6);
      box(0, 0, 0, 0.34);
      break;
  }
  return { lines, points, faces };
}

const SCENES = Array.from({ length: 9 }, (_, index) => makeScene(index));
const fract = (value: number) => value - Math.floor(value);
const DEPTH_FIELD = Array.from({ length: 64 }, (_, i) => ({
  x: fract(Math.sin(i * 127.1 + 11.7) * 43758.5453),
  y: fract(Math.sin(i * 311.7 + 43.3) * 22578.1459),
  size: 0.55 + fract(Math.sin(i * 78.233) * 12515.873) * 1.15,
  speed: 0.12 + fract(Math.sin(i * 19.17) * 731.57) * 0.35,
}));

export function CinematicStage({ sectionIndex, reducedMotion }: { sectionIndex: number; reducedMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef({ current: sectionIndex, previous: sectionIndex, changedAt: 0 });

  useEffect(() => {
    const scene = sceneRef.current;
    if (sectionIndex === scene.current) return;
    scene.previous = scene.current;
    scene.current = sectionIndex;
    scene.changedAt = performance.now();
  }, [sectionIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    let width = 1;
    let height = 1;
    let raf = 0;
    let lastFrame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let smoothX = 0;
    let smoothY = 0;
    let hidden = document.hidden;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, width < 700 ? 1.25 : 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const sceneCenterX = (focus: number) => width < 700 ? width * 0.5 : width * (focus === 0 ? 0.5 : focus % 2 === 0 ? 0.72 : 0.28);
    const project = (p: Vec3, angle: number, focus: number, dolly: number): ScreenPoint => {
      const yaw = angle + smoothX * 0.13;
      const pitch = -0.24 + smoothY * 0.11;
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const x = p[0] * cy - p[2] * sy;
      const zz = p[0] * sy + p[2] * cy;
      const y = p[1] * cp - zz * sp;
      const z = p[1] * sp + zz * cp;
      const scale = 3.2 / (3.2 - z * 0.5);
      const radius = Math.min(width * (width < 700 ? 0.49 : 0.31), height * 0.43, 450) * dolly;
      return { x: sceneCenterX(focus) + x * radius * scale, y: height * 0.48 + y * radius * scale, z, scale };
    };
    const drawAtmosphere = (index: number, opacity: number, now: number) => {
      const x = sceneCenterX(index) + Math.sin(now * 0.00018 + index) * width * 0.015;
      const y = height * 0.48;
      const radius = Math.min(width * 0.48, height * 0.58, 620);
      const glow = ctx.createRadialGradient(x, y, radius * 0.05, x, y, radius);
      glow.addColorStop(0, `rgba(22, 163, 98, ${0.13 * opacity})`);
      glow.addColorStop(0.36, `rgba(10, 100, 77, ${0.095 * opacity})`);
      glow.addColorStop(1, 'rgba(5, 5, 7, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    };
    const drawDepthField = (now: number, index: number) => {
      const count = width < 700 ? 34 : DEPTH_FIELD.length;
      for (let i = 0; i < count; i++) {
        const mote = DEPTH_FIELD[i];
        const x = fract(mote.x + now * 0.000003 * mote.speed + index * 0.07) * width;
        const y = fract(mote.y - now * 0.0000018 * mote.speed) * height;
        const distance = Math.abs(x / width - 0.5);
        ctx.fillStyle = `rgba(110, 236, 176, ${0.09 + distance * 0.18})`;
        ctx.fillRect(x, y, mote.size, mote.size);
      }
    };
    const drawScene = (index: number, opacity: number, now: number, dolly: number) => {
      if (opacity <= 0) return;
      const scene = SCENES[index] ?? SCENES[0];
      const angle = now * 0.00015 + index * 0.62;
      drawAtmosphere(index, opacity, now);
      const projectedFaces = scene.faces.map((face) => {
        const vertices = face.vertices.map((vertex) => project(vertex, angle, index, dolly));
        return { vertices, depth: vertices.reduce((sum, point) => sum + point.z, 0) / vertices.length, weight: face.weight };
      }).sort((a, b) => a.depth - b.depth);
      for (const face of projectedFaces) {
        const alpha = Math.max(0.025, Math.min(0.17, (0.09 + face.depth * 0.035) * face.weight)) * opacity;
        ctx.fillStyle = `rgba(27, 175, 122, ${alpha})`;
        ctx.beginPath();
        face.vertices.forEach((vertex, i) => i === 0 ? ctx.moveTo(vertex.x, vertex.y) : ctx.lineTo(vertex.x, vertex.y));
        ctx.closePath();
        ctx.fill();
      }
      ctx.lineCap = 'round';
      for (const segment of scene.lines) {
        const a = project(segment.a, angle, index, dolly);
        const b = project(segment.b, angle, index, dolly);
        const depth = (a.z + b.z) * 0.5;
        const alpha = Math.max(0.08, Math.min(0.72, (0.38 + depth * 0.17) * segment.weight)) * opacity;
        ctx.strokeStyle = `rgba(74, 222, 128, ${alpha})`;
        ctx.lineWidth = depth > 0 ? 1.8 : 0.9;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (const node of scene.points) {
        const p = project(node, angle, index, dolly);
        ctx.shadowColor = 'rgba(74, 222, 128, 0.72)';
        ctx.shadowBlur = p.z > 0 ? 12 : 6;
        ctx.fillStyle = `rgba(138, 247, 178, ${Math.max(0.2, Math.min(0.95, 0.55 + p.z * 0.22)) * opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.85, p.scale * 1.7), 0, TAU);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };
    const frame = (now: number) => {
      raf = 0;
      if (hidden) return;
      if (now - lastFrame < FRAME_MS) {
        raf = requestAnimationFrame(frame);
        return;
      }
      lastFrame = now;
      smoothX += (pointerX - smoothX) * 0.045;
      smoothY += (pointerY - smoothY) * 0.045;
      ctx.clearRect(0, 0, width, height);
      const scene = sceneRef.current;
      const progress = Math.min(1, (now - scene.changedAt) / SCENE_FADE_MS);
      const eased = progress * progress * (3 - 2 * progress);
      drawDepthField(now, scene.current);
      if (scene.previous !== scene.current && progress < 1) drawScene(scene.previous, 1 - eased, now, 1 - eased * 0.22);
      drawScene(scene.current, eased, now, 1.22 - eased * 0.22);
      if (progress >= 1) scene.previous = scene.current;
      raf = requestAnimationFrame(frame);
    };
    const onVisibility = () => {
      hidden = document.hidden;
      if (hidden && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!hidden && !raf) {
        raf = requestAnimationFrame(frame);
      }
    };
    const onPointer = (event: PointerEvent) => {
      pointerX = Math.max(-1, Math.min(1, (event.clientX / width - 0.5) * 2));
      pointerY = Math.max(-1, Math.min(1, (event.clientY / height - 0.5) * 2));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    document.addEventListener('visibilitychange', onVisibility);
    if (finePointer) window.addEventListener('pointermove', onPointer, { passive: true });
    if (!hidden) raf = requestAnimationFrame(frame);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (finePointer) window.removeEventListener('pointermove', onPointer);
      canvas.width = 0;
      canvas.height = 0;
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="cinematic-stage" aria-hidden="true" />;
}
