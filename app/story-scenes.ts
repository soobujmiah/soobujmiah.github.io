/* ═══════════════════════════════════════════════════════════════
   STORY SCENES — particle storytelling silhouettes.

   One continuous particle population tells a personal software-
   engineering life cycle. Each scene is a target field generator:
   draw filled, readable silhouettes into a canvas, sample ink, done.

   No random icon bag. No hairline-only motifs. Declarative sequence
   lives in STORY_BEATS so the renderer stays dumb and the narrative
   stays editable.
   ═══════════════════════════════════════════════════════════════ */

import { denseStepFor, mulberry32 } from './name-motion';

export type Pt = { x: number; y: number };

export type StoryBeatId =
  | 'name'
  | 'wake_sleep'
  | 'wake_rise'
  | 'robot'
  | 'robot_phone'
  | 'phone'
  | 'work'
  | 'break_1'
  | 'game'
  | 'read'
  | 'build'
  | 'test'
  | 'debug'
  | 'break_2'
  | 'build_2'
  | 'success'
  | 'sleep';

export type StoryBeat = {
  id: StoryBeatId;
  /** Hold after morph settles, ms. */
  holdMs: number;
  /** Morph into this beat, ms. */
  morphMs: number;
  /** Motion character for the incoming morph. */
  motion: 'gentle' | 'organic' | 'mechanical' | 'energetic' | 'precise' | 'settle';
};

/**
 * Deterministic narrative sequence after the name is first formed.
 * Returns to name via a dedicated sleep → name morph handled by the
 * renderer (not listed here as a separate beat id beyond looping).
 */
export const STORY_BEATS: readonly StoryBeat[] = [
  { id: 'wake_sleep', holdMs: 900, morphMs: 1600, motion: 'organic' },
  { id: 'wake_rise', holdMs: 700, morphMs: 1400, motion: 'organic' },
  { id: 'robot', holdMs: 1400, morphMs: 1800, motion: 'mechanical' },
  { id: 'robot_phone', holdMs: 700, morphMs: 1200, motion: 'mechanical' },
  { id: 'phone', holdMs: 1000, morphMs: 1400, motion: 'mechanical' },
  { id: 'work', holdMs: 2600, morphMs: 2000, motion: 'precise' },
  { id: 'break_1', holdMs: 1100, morphMs: 1300, motion: 'gentle' },
  { id: 'game', holdMs: 1600, morphMs: 1500, motion: 'energetic' },
  { id: 'read', holdMs: 1700, morphMs: 1500, motion: 'gentle' },
  { id: 'build', holdMs: 1600, morphMs: 1800, motion: 'precise' },
  { id: 'test', holdMs: 1300, morphMs: 1400, motion: 'precise' },
  { id: 'debug', holdMs: 1500, morphMs: 1600, motion: 'precise' },
  { id: 'break_2', holdMs: 1100, morphMs: 1200, motion: 'gentle' },
  { id: 'build_2', holdMs: 1400, morphMs: 1600, motion: 'precise' },
  { id: 'success', holdMs: 2600, morphMs: 1800, motion: 'settle' },
  { id: 'sleep', holdMs: 2200, morphMs: 2200, motion: 'settle' },
] as const;

/* ── drawing primitives (filled, mobile-readable) ─────────────── */

type Ctx = CanvasRenderingContext2D;

const ink = (ctx: Ctx) => {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
};

const disc = (ctx: Ctx, x: number, y: number, r: number) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
};

const oval = (ctx: Ctx, x: number, y: number, rx: number, ry: number) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
};

const limb = (ctx: Ctx, x1: number, y1: number, x2: number, y2: number, w: number) => {
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  disc(ctx, x1, y1, w * 0.45);
  disc(ctx, x2, y2, w * 0.45);
};

const blob = (ctx: Ctx, pts: number[][]) => {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
};

/** Stylised seated/standing young-man silhouette — filled, not outline. */
function drawPerson(
  ctx: Ctx,
  cx: number,
  cy: number,
  s: number,
  pose: 'sleep' | 'sit' | 'stand' | 'work' | 'game' | 'read' | 'tired'
): void {
  ink(ctx);
  const headR = s * 0.11;
  if (pose === 'sleep') {
    const hx = cx - s * 0.02;
    const hy = cy + s * 0.08;
    oval(ctx, hx, hy, headR * 1.05, headR * 0.92);
    // body curled
    oval(ctx, hx + s * 0.18, hy + s * 0.02, s * 0.28, s * 0.14);
    limb(ctx, hx + s * 0.05, hy + s * 0.08, hx + s * 0.42, hy + s * 0.12, s * 0.055);
    limb(ctx, hx + s * 0.1, hy + s * 0.14, hx + s * 0.38, hy + s * 0.22, s * 0.055);
    // pillow
    oval(ctx, hx - s * 0.16, hy + s * 0.02, s * 0.14, s * 0.07);
    return;
  }

  const headY =
    pose === 'sit' || pose === 'work' || pose === 'game' || pose === 'read'
      ? cy - s * 0.28
      : cy - s * 0.34;
  disc(ctx, cx, headY, headR);

  // torso
  const torsoTop = headY + headR * 0.85;
  const torsoBot =
    pose === 'stand' || pose === 'tired' ? cy + s * 0.02 : cy + s * 0.06;
  blob(ctx, [
    [cx - s * 0.13, torsoTop],
    [cx + s * 0.13, torsoTop],
    [cx + s * 0.15, torsoBot],
    [cx - s * 0.15, torsoBot],
  ]);

  if (pose === 'stand' || pose === 'tired') {
    limb(ctx, cx - s * 0.12, torsoTop + s * 0.06, cx - s * 0.22, torsoBot + s * 0.02, s * 0.05);
    limb(ctx, cx + s * 0.12, torsoTop + s * 0.06, cx + s * 0.2, torsoBot - s * 0.02, s * 0.05);
    limb(ctx, cx - s * 0.07, torsoBot, cx - s * 0.1, cy + s * 0.38, s * 0.055);
    limb(ctx, cx + s * 0.07, torsoBot, cx + s * 0.12, cy + s * 0.38, s * 0.055);
    if (pose === 'tired') {
      // heavy shoulders droop
      limb(ctx, cx + s * 0.12, torsoTop + s * 0.04, cx + s * 0.26, torsoTop + s * 0.18, s * 0.05);
    }
    return;
  }

  if (pose === 'sit' || pose === 'work' || pose === 'game' || pose === 'read') {
    // thighs + calves (seated)
    limb(ctx, cx - s * 0.08, torsoBot, cx - s * 0.22, cy + s * 0.2, s * 0.06);
    limb(ctx, cx + s * 0.08, torsoBot, cx + s * 0.24, cy + s * 0.18, s * 0.06);
    limb(ctx, cx - s * 0.22, cy + s * 0.2, cx - s * 0.2, cy + s * 0.36, s * 0.05);
    limb(ctx, cx + s * 0.24, cy + s * 0.18, cx + s * 0.26, cy + s * 0.36, s * 0.05);
    // seat cushion
    oval(ctx, cx, cy + s * 0.22, s * 0.22, s * 0.05);
  }

  if (pose === 'work') {
    limb(ctx, cx - s * 0.12, torsoTop + s * 0.08, cx - s * 0.02, cy + s * 0.02, s * 0.045);
    limb(ctx, cx + s * 0.12, torsoTop + s * 0.08, cx + s * 0.18, cy - s * 0.02, s * 0.045);
  } else if (pose === 'game') {
    limb(ctx, cx - s * 0.1, torsoTop + s * 0.1, cx - s * 0.05, cy + s * 0.04, s * 0.045);
    limb(ctx, cx + s * 0.1, torsoTop + s * 0.1, cx + s * 0.08, cy + s * 0.05, s * 0.045);
  } else if (pose === 'read') {
    limb(ctx, cx - s * 0.1, torsoTop + s * 0.1, cx - s * 0.02, cy - s * 0.02, s * 0.045);
    limb(ctx, cx + s * 0.1, torsoTop + s * 0.1, cx + s * 0.14, cy - s * 0.06, s * 0.045);
  } else if (pose === 'sit') {
    limb(ctx, cx - s * 0.12, torsoTop + s * 0.08, cx - s * 0.2, torsoBot + s * 0.02, s * 0.05);
    limb(ctx, cx + s * 0.12, torsoTop + s * 0.08, cx + s * 0.22, torsoTop + s * 0.2, s * 0.05);
  }
}

function drawAndroid(ctx: Ctx, cx: number, cy: number, s: number): void {
  ink(ctx);
  // head dome
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.12, s * 0.22, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  // eyes
  disc(ctx, cx - s * 0.09, cy - s * 0.16, s * 0.035);
  disc(ctx, cx + s * 0.09, cy - s * 0.16, s * 0.035);
  // antennae
  limb(ctx, cx - s * 0.1, cy - s * 0.32, cx - s * 0.18, cy - s * 0.48, s * 0.03);
  limb(ctx, cx + s * 0.1, cy - s * 0.32, cx + s * 0.18, cy - s * 0.48, s * 0.03);
  disc(ctx, cx - s * 0.18, cy - s * 0.48, s * 0.04);
  disc(ctx, cx + s * 0.18, cy - s * 0.48, s * 0.04);
  // body
  blob(ctx, [
    [cx - s * 0.2, cy - s * 0.02],
    [cx + s * 0.2, cy - s * 0.02],
    [cx + s * 0.18, cy + s * 0.28],
    [cx - s * 0.18, cy + s * 0.28],
  ]);
  // arms
  limb(ctx, cx - s * 0.2, cy + s * 0.05, cx - s * 0.36, cy + s * 0.18, s * 0.05);
  limb(ctx, cx + s * 0.2, cy + s * 0.05, cx + s * 0.36, cy + s * 0.18, s * 0.05);
  // legs
  limb(ctx, cx - s * 0.1, cy + s * 0.28, cx - s * 0.12, cy + s * 0.48, s * 0.055);
  limb(ctx, cx + s * 0.1, cy + s * 0.28, cx + s * 0.12, cy + s * 0.48, s * 0.055);
}

function drawPhone(ctx: Ctx, cx: number, cy: number, s: number, lit = true): void {
  ink(ctx);
  const w = s * 0.28;
  const h = s * 0.52;
  // body filled
  const r = s * 0.04;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 + r, cy - h / 2);
  ctx.lineTo(cx + w / 2 - r, cy - h / 2);
  ctx.quadraticCurveTo(cx + w / 2, cy - h / 2, cx + w / 2, cy - h / 2 + r);
  ctx.lineTo(cx + w / 2, cy + h / 2 - r);
  ctx.quadraticCurveTo(cx + w / 2, cy + h / 2, cx + w / 2 - r, cy + h / 2);
  ctx.lineTo(cx - w / 2 + r, cy + h / 2);
  ctx.quadraticCurveTo(cx - w / 2, cy + h / 2, cx - w / 2, cy + h / 2 - r);
  ctx.lineTo(cx - w / 2, cy - h / 2 + r);
  ctx.quadraticCurveTo(cx - w / 2, cy - h / 2, cx - w / 2 + r, cy - h / 2);
  ctx.closePath();
  ctx.fill();
  if (lit) {
    // punch screen as denser inner rect via stroke ring look: draw darker hole
    // by not drawing — instead add speaker + home as negative-space discs
    // (same ink; recognisable phone chrome)
  }
  disc(ctx, cx, cy + h / 2 - s * 0.06, s * 0.025);
  ctx.lineWidth = s * 0.02;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.05, cy - h / 2 + s * 0.05);
  ctx.lineTo(cx + s * 0.05, cy - h / 2 + s * 0.05);
  ctx.stroke();
}

function drawLaptop(ctx: Ctx, cx: number, cy: number, s: number): void {
  ink(ctx);
  // screen
  blob(ctx, [
    [cx - s * 0.32, cy - s * 0.22],
    [cx + s * 0.32, cy - s * 0.22],
    [cx + s * 0.3, cy + s * 0.08],
    [cx - s * 0.3, cy + s * 0.08],
  ]);
  // base
  blob(ctx, [
    [cx - s * 0.36, cy + s * 0.1],
    [cx + s * 0.36, cy + s * 0.1],
    [cx + s * 0.4, cy + s * 0.16],
    [cx - s * 0.4, cy + s * 0.16],
  ]);
  // code lines on screen (thick so they sample)
  ctx.lineWidth = s * 0.035;
  for (let i = 0; i < 4; i += 1) {
    const y = cy - s * 0.14 + i * s * 0.055;
    const len = s * (0.18 + (i % 3) * 0.06);
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.2, y);
    ctx.lineTo(cx - s * 0.2 + len, y);
    ctx.stroke();
  }
}

function drawBook(ctx: Ctx, cx: number, cy: number, s: number): void {
  ink(ctx);
  // open book — two pages
  blob(ctx, [
    [cx - s * 0.02, cy - s * 0.16],
    [cx - s * 0.34, cy - s * 0.12],
    [cx - s * 0.32, cy + s * 0.18],
    [cx - s * 0.02, cy + s * 0.14],
  ]);
  blob(ctx, [
    [cx + s * 0.02, cy - s * 0.16],
    [cx + s * 0.34, cy - s * 0.12],
    [cx + s * 0.32, cy + s * 0.18],
    [cx + s * 0.02, cy + s * 0.14],
  ]);
  // spine
  ctx.lineWidth = s * 0.04;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.16);
  ctx.lineTo(cx, cy + s * 0.14);
  ctx.stroke();
  // text rules
  ctx.lineWidth = s * 0.02;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 3; i += 1) {
      const y = cy - s * 0.06 + i * s * 0.06;
      ctx.beginPath();
      ctx.moveTo(cx + side * s * 0.06, y);
      ctx.lineTo(cx + side * s * 0.26, y);
      ctx.stroke();
    }
  }
}

function drawCigarette(ctx: Ctx, x: number, y: number, s: number): void {
  ink(ctx);
  ctx.lineWidth = s * 0.035;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + s * 0.16, y - s * 0.02);
  ctx.stroke();
  disc(ctx, x + s * 0.16, y - s * 0.02, s * 0.028);
  // soft smoke puffs
  oval(ctx, x + s * 0.2, y - s * 0.1, s * 0.04, s * 0.03);
  oval(ctx, x + s * 0.24, y - s * 0.18, s * 0.035, s * 0.04);
}

function drawController(ctx: Ctx, cx: number, cy: number, s: number): void {
  ink(ctx);
  oval(ctx, cx, cy, s * 0.22, s * 0.1);
  disc(ctx, cx - s * 0.2, cy + s * 0.02, s * 0.07);
  disc(ctx, cx + s * 0.2, cy + s * 0.02, s * 0.07);
  disc(ctx, cx - s * 0.06, cy - s * 0.02, s * 0.025);
  disc(ctx, cx + s * 0.06, cy - s * 0.02, s * 0.025);
}

function drawBuildBlocks(ctx: Ctx, cx: number, cy: number, s: number, mode: 'build' | 'test' | 'debug' | 'ok'): void {
  ink(ctx);
  const rows = mode === 'ok' ? 3 : 4;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      if (mode === 'debug' && r === 1 && c === 1) continue; // missing block = broken
      if (mode === 'test' && r === 0 && c === 2) continue;
      const x = cx + (c - 1) * s * 0.2;
      const y = cy + (r - 1.2) * s * 0.14;
      const bw = s * 0.16;
      const bh = s * 0.11;
      ctx.fillRect(x - bw / 2, y - bh / 2, bw, bh);
    }
  }
  if (mode === 'debug') {
    // reconnecting node
    disc(ctx, cx, cy - s * 0.05, s * 0.05);
    limb(ctx, cx, cy - s * 0.05, cx + s * 0.2, cy - s * 0.2, s * 0.03);
  }
  if (mode === 'ok') {
    // check mark
    ctx.lineWidth = s * 0.07;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.14, cy + s * 0.02);
    ctx.lineTo(cx - s * 0.02, cy + s * 0.16);
    ctx.lineTo(cx + s * 0.22, cy - s * 0.14);
    ctx.stroke();
  }
  if (mode === 'test') {
    // small check tick
    ctx.lineWidth = s * 0.05;
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.18, cy - s * 0.28);
    ctx.lineTo(cx + s * 0.24, cy - s * 0.2);
    ctx.lineTo(cx + s * 0.34, cy - s * 0.34);
    ctx.stroke();
  }
}

function drawTerminalPanel(ctx: Ctx, cx: number, cy: number, s: number): void {
  ink(ctx);
  const w = s * 0.5;
  const h = s * 0.36;
  // frame only — filled bars read as code rows without destination-out
  ctx.lineWidth = Math.max(2, s * 0.045);
  ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
  for (let i = 0; i < 3; i += 1) {
    const y = cy - h * 0.2 + i * h * 0.2;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.35, y);
    ctx.lineTo(cx - w * 0.35 + w * (0.35 + i * 0.12), y);
    ctx.stroke();
  }
}

/** Draw a story beat into the given box (CSS pixel space). */
export function drawStoryScene(
  ctx: Ctx,
  id: StoryBeatId,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  seed: number,
  compact: boolean
): void {
  if (id === 'name') return; // name ink is sampled from real typography elsewhere

  const cx = boxX + boxW * 0.5;
  const cy = boxY + boxH * 0.52;
  const s = Math.min(boxW, boxH) * (compact ? 0.92 : 1);

  ink(ctx);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (id) {
    case 'wake_sleep':
      drawPerson(ctx, cx, cy, s * 0.95, 'sleep');
      break;
    case 'wake_rise':
      drawPerson(ctx, cx - s * 0.05, cy, s * 0.95, 'sit');
      break;
    case 'robot': {
      drawPerson(ctx, cx - s * 0.28, cy + s * 0.02, s * 0.72, 'stand');
      drawAndroid(ctx, cx + s * 0.28, cy, s * 0.7);
      break;
    }
    case 'robot_phone': {
      // intermediate: robot compressing toward a device mass
      drawPerson(ctx, cx - s * 0.3, cy + s * 0.02, s * 0.7, 'stand');
      ink(ctx);
      oval(ctx, cx + s * 0.22, cy, s * 0.2, s * 0.28);
      disc(ctx, cx + s * 0.22, cy - s * 0.2, s * 0.08);
      break;
    }
    case 'phone': {
      drawPerson(ctx, cx - s * 0.28, cy + s * 0.04, s * 0.72, 'stand');
      drawPhone(ctx, cx + s * 0.26, cy, s * 0.95);
      break;
    }
    case 'work': {
      drawPerson(ctx, cx - s * 0.18, cy + s * 0.02, s * 0.78, 'work');
      drawLaptop(ctx, cx + s * 0.22, cy + s * 0.02, s * 0.7);
      if (!compact) drawTerminalPanel(ctx, cx + s * 0.22, cy - s * 0.06, s * 0.45);
      break;
    }
    case 'break_1':
    case 'break_2': {
      drawPerson(ctx, cx - s * 0.06, cy, s * 0.88, 'stand');
      drawCigarette(ctx, cx + s * 0.14, cy - s * 0.12, s);
      break;
    }
    case 'game': {
      drawPerson(ctx, cx - s * 0.08, cy + s * 0.02, s * 0.8, 'game');
      drawPhone(ctx, cx + s * 0.22, cy - s * 0.02, s * 0.7);
      drawController(ctx, cx + s * 0.08, cy + s * 0.28, s * 0.55);
      break;
    }
    case 'read': {
      drawPerson(ctx, cx - s * 0.1, cy + s * 0.04, s * 0.8, 'read');
      drawBook(ctx, cx + s * 0.2, cy + s * 0.02, s * 0.7);
      break;
    }
    case 'build': {
      drawPerson(ctx, cx - s * 0.28, cy + s * 0.04, s * 0.7, 'work');
      drawLaptop(ctx, cx - s * 0.02, cy + s * 0.06, s * 0.5);
      drawBuildBlocks(ctx, cx + s * 0.28, cy - s * 0.02, s * 0.7, 'build');
      break;
    }
    case 'test': {
      drawPerson(ctx, cx - s * 0.28, cy + s * 0.04, s * 0.7, 'work');
      drawLaptop(ctx, cx - s * 0.02, cy + s * 0.06, s * 0.5);
      drawBuildBlocks(ctx, cx + s * 0.28, cy - s * 0.02, s * 0.7, 'test');
      break;
    }
    case 'debug': {
      drawPerson(ctx, cx - s * 0.28, cy + s * 0.04, s * 0.7, 'work');
      drawLaptop(ctx, cx - s * 0.02, cy + s * 0.06, s * 0.5);
      drawBuildBlocks(ctx, cx + s * 0.28, cy - s * 0.02, s * 0.7, 'debug');
      break;
    }
    case 'build_2': {
      drawPerson(ctx, cx - s * 0.26, cy + s * 0.04, s * 0.72, 'work');
      drawLaptop(ctx, cx + s * 0.05, cy + s * 0.04, s * 0.55);
      drawBuildBlocks(ctx, cx + s * 0.32, cy - s * 0.04, s * 0.65, 'build');
      break;
    }
    case 'success': {
      drawPerson(ctx, cx - s * 0.26, cy + s * 0.04, s * 0.72, 'sit');
      drawBuildBlocks(ctx, cx + s * 0.18, cy - s * 0.02, s * 0.85, 'ok');
      // soft success aura ring
      ctx.lineWidth = s * 0.04;
      ctx.beginPath();
      ctx.arc(cx + s * 0.18, cy, s * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'sleep':
      drawPerson(ctx, cx, cy + s * 0.04, s * 0.95, 'sleep');
      break;
    default:
      break;
  }

  // tiny deterministic dust kept minimal — only for organic scenes, and
  // only a few filled dots so mobile doesn't turn into noise
  if (id === 'wake_sleep' || id === 'sleep') {
    const rnd = mulberry32(seed ^ 0x51f5);
    for (let i = 0; i < 6; i += 1) {
      disc(
        ctx,
        boxX + boxW * (0.15 + rnd() * 0.7),
        boxY + boxH * (0.15 + rnd() * 0.3),
        Math.max(1.2, s * 0.012)
      );
    }
  }
}

/**
 * Sample a story scene into target points in the same coordinate space
 * as the name particle field (stage-local CSS px).
 */
export function sampleStoryScene(
  id: StoryBeatId,
  stageW: number,
  stageH: number,
  canvasCssW: number,
  canvasCssH: number,
  dpr: number,
  budget: number,
  seed: number,
  compact: boolean
): Pt[] {
  // Story box: a band around the name, large enough for multi-figure scenes
  // but clamped so particles stay inside the hero storytelling region.
  const boxW = Math.min(canvasCssW * 0.9, Math.max(stageW * 1.65, compact ? 260 : 320));
  const boxH = Math.min(canvasCssH * 0.48, Math.max(stageH * 2.1, compact ? 150 : 190));
  const boxX = stageW / 2 - boxW / 2;
  // bias slightly downward so scenes sit between the name and supporting copy
  const boxY = stageH * 0.15 - boxH * 0.15;

  const pad = 4;
  const fw = Math.max(1, Math.ceil((boxW + pad * 2) * dpr));
  const fh = Math.max(1, Math.ceil((boxH + pad * 2) * dpr));
  const sample = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!sample) return [];
  sample.width = fw;
  sample.height = fh;
  const sctx = sample.getContext('2d', { alpha: true, willReadFrequently: true });
  if (!sctx) return [];
  sctx.setTransform(dpr, 0, 0, dpr, pad * dpr, pad * dpr);
  sctx.clearRect(-pad, -pad, boxW + pad * 2, boxH + pad * 2);
  drawStoryScene(sctx, id, 0, 0, boxW, boxH, seed, compact);

  const img = sctx.getImageData(0, 0, fw, fh).data;
  const baseStep = Math.max(1, Math.round(2.2 * dpr));
  const countAt = (step: number) => {
    let n = 0;
    for (let y = 0; y < fh; y += step) {
      for (let x = 0; x < fw; x += step) {
        if (img[(y * fw + x) * 4 + 3] > 110) n += 1;
      }
    }
    return n;
  };
  const step = denseStepFor(countAt(baseStep), baseStep, Math.max(240, budget));
  const pts: Pt[] = [];
  for (let y = 0; y < fh; y += step) {
    for (let x = 0; x < fw; x += step) {
      if (img[(y * fw + x) * 4 + 3] > 110) {
        pts.push({
          x: boxX + (x + step / 2) / dpr - pad,
          y: boxY + (y + step / 2) / dpr - pad,
        });
      }
    }
  }
  return pts;
}
