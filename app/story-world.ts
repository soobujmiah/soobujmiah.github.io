/* ═══════════════════════════════════════════════════════════════
   STORY WORLD — continuous particle scene geometry.

   One spatial world (normalized 0..1), one character, persistent props.
   Scenes are compositions of the same objects in different poses —
   not a carousel of unrelated icons.

   Geometry is drawn filled into an offscreen canvas and sampled once
   per beat. The renderer maps the 0..1 field into the live story rect.
   ═══════════════════════════════════════════════════════════════ */

import { denseStepFor } from './name-motion';

export type Pt = { x: number; y: number };

export type SceneId =
  | 'bed_sleep'
  | 'bed_stir'
  | 'bed_sit'
  | 'bed_stand'
  | 'robot_active'
  | 'robot_compress'
  | 'phone_held'
  | 'phone_land'
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
  | 'return_bed'
  | 'sleep';

export type SceneBeat = {
  id: SceneId;
  holdMs: number;
  morphMs: number;
  motion: 'gentle' | 'organic' | 'mechanical' | 'energetic' | 'precise' | 'settle' | 'physics';
};

/** Deterministic day-cycle after the name hold. Ends at sleep → name return. */
export const STORY_BEATS: readonly SceneBeat[] = [
  { id: 'bed_sleep', holdMs: 2800, morphMs: 2400, motion: 'organic' },
  { id: 'bed_stir', holdMs: 1200, morphMs: 1600, motion: 'organic' },
  { id: 'bed_sit', holdMs: 1400, morphMs: 1800, motion: 'organic' },
  { id: 'bed_stand', holdMs: 1200, morphMs: 1600, motion: 'organic' },
  { id: 'robot_active', holdMs: 1400, morphMs: 1500, motion: 'mechanical' },
  { id: 'robot_compress', holdMs: 900, morphMs: 1600, motion: 'mechanical' },
  { id: 'phone_held', holdMs: 1000, morphMs: 1400, motion: 'mechanical' },
  { id: 'phone_land', holdMs: 1400, morphMs: 1800, motion: 'physics' },
  { id: 'work', holdMs: 3200, morphMs: 2200, motion: 'precise' },
  { id: 'break_1', holdMs: 1400, morphMs: 1500, motion: 'gentle' },
  { id: 'game', holdMs: 2200, morphMs: 1700, motion: 'energetic' },
  { id: 'read', holdMs: 2400, morphMs: 1700, motion: 'gentle' },
  { id: 'build', holdMs: 2000, morphMs: 1800, motion: 'precise' },
  { id: 'test', holdMs: 1600, morphMs: 1500, motion: 'precise' },
  { id: 'debug', holdMs: 2000, morphMs: 1700, motion: 'precise' },
  { id: 'break_2', holdMs: 1300, morphMs: 1400, motion: 'gentle' },
  { id: 'build_2', holdMs: 1800, morphMs: 1600, motion: 'precise' },
  { id: 'success', holdMs: 2800, morphMs: 1900, motion: 'settle' },
  { id: 'return_bed', holdMs: 1600, morphMs: 2200, motion: 'settle' },
  { id: 'sleep', holdMs: 2800, morphMs: 2000, motion: 'settle' },
] as const;

/* ── world anchors (normalized) — keep bed zone stable across scenes ── */
const BED = { x: 0.42, y: 0.62, w: 0.58, h: 0.22 }; // mattress centre-ish
const ROBOT_SLOT = { x: 0.82, y: 0.52 }; // floor beside bed
const DESK = { x: 0.62, y: 0.58 };

type Ctx = CanvasRenderingContext2D;

const ink = (ctx: Ctx) => {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
};

const disc = (ctx: Ctx, x: number, y: number, r: number) => {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
  ctx.fill();
};

const oval = (ctx: Ctx, x: number, y: number, rx: number, ry: number) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
  ctx.fill();
};

const limb = (ctx: Ctx, x1: number, y1: number, x2: number, y2: number, w: number) => {
  ctx.lineWidth = Math.max(1, w);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  disc(ctx, x1, y1, w * 0.42);
  disc(ctx, x2, y2, w * 0.42);
};

const rr = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number) => {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
  ctx.fill();
};

/** Consistent young-man proportions — body height ≈ H units. */
type Pose =
  | 'sleep'
  | 'stir'
  | 'sit'
  | 'stand'
  | 'work'
  | 'game'
  | 'read'
  | 'tired'
  | 'break';

/**
 * Draw the same character in different poses. Coordinates are canvas px.
 * `H` is full standing body height in px.
 */
function drawHuman(ctx: Ctx, cx: number, baseY: number, H: number, pose: Pose): void {
  ink(ctx);
  const headR = H * 0.095;
  const tw = H * 0.22; // torso half-width-ish
  const limbW = H * 0.055;

  if (pose === 'sleep' || pose === 'stir') {
    // Side-lying on mattress: head left on pillow, body horizontal right
    const lift = pose === 'stir' ? H * 0.06 : 0;
    const hy = baseY - H * 0.02 - lift;
    const hx = cx - H * 0.28;
    // head
    oval(ctx, hx, hy, headR * 1.05, headR * 0.92);
    // neck
    limb(ctx, hx + headR * 0.7, hy + headR * 0.2, hx + headR * 1.3, hy + headR * 0.35, limbW * 0.7);
    // torso block lying
    const tx0 = hx + headR * 1.15;
    const ty0 = hy + H * 0.02;
    rr(ctx, tx0, ty0 - H * 0.07, H * 0.42, H * 0.16, H * 0.04);
    // near arm on blanket
    limb(ctx, tx0 + H * 0.08, ty0, tx0 + H * 0.18, ty0 - H * 0.1 - lift * 0.5, limbW);
    // far arm tucked
    limb(ctx, tx0 + H * 0.12, ty0 + H * 0.04, tx0 + H * 0.28, ty0 + H * 0.02, limbW * 0.85);
    // hips + legs extended
    const hx2 = tx0 + H * 0.4;
    rr(ctx, hx2, ty0 - H * 0.05, H * 0.12, H * 0.12, H * 0.03);
    limb(ctx, hx2 + H * 0.1, ty0, hx2 + H * 0.32, ty0 + H * 0.02, limbW);
    limb(ctx, hx2 + H * 0.1, ty0 + H * 0.04, hx2 + H * 0.3, ty0 + H * 0.08, limbW);
    if (pose === 'stir') {
      // raised forearm
      limb(ctx, tx0 + H * 0.1, ty0 - H * 0.02, tx0 + H * 0.05, ty0 - H * 0.16, limbW);
    }
    return;
  }

  if (pose === 'sit') {
    const headY = baseY - H * 0.42;
    disc(ctx, cx, headY, headR);
    // torso upright
    rr(ctx, cx - tw * 0.55, headY + headR * 0.7, tw * 1.1, H * 0.28, H * 0.03);
    const hipY = headY + headR * 0.7 + H * 0.28;
    // thighs forward (sitting on bed edge)
    limb(ctx, cx - tw * 0.25, hipY, cx - tw * 0.15, hipY + H * 0.18, limbW);
    limb(ctx, cx + tw * 0.25, hipY, cx + H * 0.22, hipY + H * 0.08, limbW);
    // calves down
    limb(ctx, cx - tw * 0.15, hipY + H * 0.18, cx - tw * 0.12, hipY + H * 0.34, limbW);
    limb(ctx, cx + H * 0.22, hipY + H * 0.08, cx + H * 0.24, hipY + H * 0.3, limbW);
    // arms resting on thighs
    limb(ctx, cx - tw * 0.5, headY + headR + H * 0.08, cx - tw * 0.1, hipY + H * 0.05, limbW);
    limb(ctx, cx + tw * 0.5, headY + headR + H * 0.08, cx + H * 0.12, hipY + H * 0.02, limbW);
    return;
  }

  // standing family
  const headY =
    pose === 'work' || pose === 'game' || pose === 'read'
      ? baseY - H * 0.72
      : baseY - H * 0.88;
  const stand = pose === 'stand' || pose === 'tired' || pose === 'break';
  if (stand) {
    disc(ctx, cx, headY, headR);
    rr(ctx, cx - tw * 0.55, headY + headR * 0.75, tw * 1.1, H * 0.3, H * 0.03);
    const hipY = headY + headR * 0.75 + H * 0.3;
    // legs
    limb(ctx, cx - tw * 0.28, hipY, cx - tw * 0.32, baseY, limbW);
    limb(ctx, cx + tw * 0.28, hipY, cx + tw * 0.34, baseY, limbW);
    // arms
    if (pose === 'tired') {
      limb(ctx, cx - tw * 0.55, headY + headR + H * 0.08, cx - tw * 0.85, hipY - H * 0.02, limbW);
      limb(ctx, cx + tw * 0.55, headY + headR + H * 0.08, cx + tw * 0.7, headY + headR + H * 0.22, limbW);
    } else if (pose === 'break') {
      limb(ctx, cx - tw * 0.55, headY + headR + H * 0.1, cx - tw * 0.7, hipY - H * 0.05, limbW);
      limb(ctx, cx + tw * 0.55, headY + headR + H * 0.08, cx + tw * 0.95, headY + headR * 0.2, limbW);
    } else {
      limb(ctx, cx - tw * 0.55, headY + headR + H * 0.1, cx - tw * 0.75, hipY - H * 0.05, limbW);
      limb(ctx, cx + tw * 0.55, headY + headR + H * 0.1, cx + tw * 0.75, hipY - H * 0.05, limbW);
    }
    return;
  }

  // seated at desk poses
  disc(ctx, cx, headY, headR);
  rr(ctx, cx - tw * 0.55, headY + headR * 0.75, tw * 1.1, H * 0.26, H * 0.03);
  const hipY = headY + headR * 0.75 + H * 0.26;
  limb(ctx, cx - tw * 0.3, hipY, cx - tw * 0.45, hipY + H * 0.2, limbW);
  limb(ctx, cx + tw * 0.3, hipY, cx + tw * 0.5, hipY + H * 0.18, limbW);
  limb(ctx, cx - tw * 0.45, hipY + H * 0.2, cx - tw * 0.42, baseY, limbW * 0.9);
  limb(ctx, cx + tw * 0.5, hipY + H * 0.18, cx + tw * 0.52, baseY, limbW * 0.9);
  oval(ctx, cx, hipY + H * 0.08, H * 0.16, H * 0.035); // seat

  if (pose === 'work') {
    limb(ctx, cx - tw * 0.5, headY + headR + H * 0.1, cx + H * 0.02, hipY - H * 0.02, limbW);
    limb(ctx, cx + tw * 0.5, headY + headR + H * 0.1, cx + H * 0.2, hipY - H * 0.06, limbW);
  } else if (pose === 'game') {
    limb(ctx, cx - tw * 0.5, headY + headR + H * 0.1, cx - H * 0.02, hipY + H * 0.02, limbW);
    limb(ctx, cx + tw * 0.5, headY + headR + H * 0.1, cx + H * 0.12, hipY + H * 0.02, limbW);
  } else if (pose === 'read') {
    limb(ctx, cx - tw * 0.5, headY + headR + H * 0.1, cx - H * 0.02, hipY - H * 0.08, limbW);
    limb(ctx, cx + tw * 0.5, headY + headR + H * 0.1, cx + H * 0.18, hipY - H * 0.12, limbW);
  }
}

function drawBed(ctx: Ctx, cx: number, cy: number, W: number, H: number, opts: { blanket: boolean; pillow: boolean; dent?: number }): void {
  ink(ctx);
  const bedW = W * BED.w;
  const bedH = H * BED.h;
  const x = cx - bedW * 0.45;
  const y = cy - bedH * 0.15;
  // frame / legs
  ctx.lineWidth = Math.max(2, H * 0.018);
  ctx.strokeRect(x - W * 0.01, y + bedH * 0.55, bedW * 0.08, bedH * 0.55);
  ctx.strokeRect(x + bedW * 0.85, y + bedH * 0.55, bedW * 0.08, bedH * 0.55);
  // mattress
  const dent = opts.dent ?? 0;
  rr(ctx, x, y + dent * bedH, bedW, bedH * 0.72, H * 0.025);
  // mattress edge highlight strip
  rr(ctx, x, y + bedH * 0.55 + dent * bedH, bedW, bedH * 0.12, H * 0.01);
  // headboard
  rr(ctx, x - W * 0.01, y - bedH * 0.55, bedW * 0.12, bedH * 0.7, H * 0.02);
  if (opts.pillow) {
    oval(ctx, x + bedW * 0.18, y + bedH * 0.12 + dent * bedH * 0.3, bedW * 0.14, bedH * 0.28);
    oval(ctx, x + bedW * 0.18, y + bedH * 0.1 + dent * bedH * 0.3, bedW * 0.12, bedH * 0.22);
  }
  if (opts.blanket) {
    // draped blanket covering lower body — irregular contour
    ctx.beginPath();
    const bx = x + bedW * 0.28;
    const by = y + bedH * 0.08 + dent * bedH;
    ctx.moveTo(bx, by + bedH * 0.15);
    ctx.quadraticCurveTo(bx + bedW * 0.15, by - bedH * 0.05, bx + bedW * 0.35, by + bedH * 0.05);
    ctx.quadraticCurveTo(bx + bedW * 0.55, by + bedH * 0.2, bx + bedW * 0.62, by + bedH * 0.55);
    ctx.lineTo(bx + bedW * 0.62, by + bedH * 0.7);
    ctx.lineTo(bx, by + bedH * 0.7);
    ctx.closePath();
    ctx.fill();
    // fold lines (thick enough to sample)
    ctx.lineWidth = Math.max(2, H * 0.012);
    ctx.beginPath();
    ctx.moveTo(bx + bedW * 0.1, by + bedH * 0.25);
    ctx.quadraticCurveTo(bx + bedW * 0.3, by + bedH * 0.35, bx + bedW * 0.5, by + bedH * 0.28);
    ctx.stroke();
  }
}

function drawAndroid(ctx: Ctx, cx: number, cy: number, S: number, mode: 'full' | 'compress' | 'core' = 'full'): void {
  ink(ctx);
  if (mode === 'core') {
    oval(ctx, cx, cy, S * 0.22, S * 0.28);
    disc(ctx, cx, cy - S * 0.18, S * 0.1);
    return;
  }
  if (mode === 'compress') {
    // limbs folding inward
    disc(ctx, cx, cy - S * 0.18, S * 0.16);
    rr(ctx, cx - S * 0.16, cy - S * 0.05, S * 0.32, S * 0.36, S * 0.04);
    limb(ctx, cx - S * 0.14, cy + S * 0.05, cx - S * 0.08, cy + S * 0.22, S * 0.04);
    limb(ctx, cx + S * 0.14, cy + S * 0.05, cx + S * 0.08, cy + S * 0.22, S * 0.04);
    limb(ctx, cx - S * 0.06, cy + S * 0.3, cx - S * 0.04, cy + S * 0.4, S * 0.04);
    limb(ctx, cx + S * 0.06, cy + S * 0.3, cx + S * 0.04, cy + S * 0.4, S * 0.04);
    return;
  }
  // full robot
  ctx.beginPath();
  ctx.arc(cx, cy - S * 0.22, S * 0.2, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  disc(ctx, cx - S * 0.08, cy - S * 0.26, S * 0.035);
  disc(ctx, cx + S * 0.08, cy - S * 0.26, S * 0.035);
  limb(ctx, cx - S * 0.1, cy - S * 0.4, cx - S * 0.18, cy - S * 0.55, S * 0.03);
  limb(ctx, cx + S * 0.1, cy - S * 0.4, cx + S * 0.18, cy - S * 0.55, S * 0.03);
  disc(ctx, cx - S * 0.18, cy - S * 0.55, S * 0.04);
  disc(ctx, cx + S * 0.18, cy - S * 0.55, S * 0.04);
  rr(ctx, cx - S * 0.18, cy - S * 0.05, S * 0.36, S * 0.38, S * 0.04);
  limb(ctx, cx - S * 0.18, cy + S * 0.05, cx - S * 0.36, cy + S * 0.2, S * 0.05);
  limb(ctx, cx + S * 0.18, cy + S * 0.05, cx + S * 0.36, cy + S * 0.2, S * 0.05);
  limb(ctx, cx - S * 0.08, cy + S * 0.32, cx - S * 0.1, cy + S * 0.52, S * 0.055);
  limb(ctx, cx + S * 0.08, cy + S * 0.32, cx + S * 0.1, cy + S * 0.52, S * 0.055);
}

function drawPhone(ctx: Ctx, cx: number, cy: number, S: number, angle = 0): void {
  ink(ctx);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  const w = S * 0.22;
  const h = S * 0.42;
  rr(ctx, -w / 2, -h / 2, w, h, S * 0.035);
  // screen inset (stroke ring via thinner inner void simulation: top speaker)
  ctx.lineWidth = Math.max(1.5, S * 0.02);
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, -h * 0.38);
  ctx.lineTo(w * 0.2, -h * 0.38);
  ctx.stroke();
  disc(ctx, 0, h * 0.36, S * 0.025);
  // soft screen glow block
  rr(ctx, -w * 0.32, -h * 0.28, w * 0.64, h * 0.5, S * 0.02);
  ctx.restore();
}

function drawDesk(ctx: Ctx, cx: number, cy: number, W: number, H: number): void {
  ink(ctx);
  const dw = W * 0.42;
  const dh = H * 0.06;
  rr(ctx, cx - dw / 2, cy, dw, dh, H * 0.01);
  ctx.lineWidth = Math.max(2, H * 0.02);
  ctx.beginPath();
  ctx.moveTo(cx - dw * 0.4, cy + dh);
  ctx.lineTo(cx - dw * 0.4, cy + H * 0.22);
  ctx.moveTo(cx + dw * 0.4, cy + dh);
  ctx.lineTo(cx + dw * 0.4, cy + H * 0.22);
  ctx.stroke();
}

function drawLaptop(ctx: Ctx, cx: number, cy: number, S: number, code = true): void {
  ink(ctx);
  // screen
  rr(ctx, cx - S * 0.28, cy - S * 0.22, S * 0.56, S * 0.32, S * 0.02);
  // base
  rr(ctx, cx - S * 0.32, cy + S * 0.1, S * 0.64, S * 0.06, S * 0.01);
  if (code) {
    ctx.lineWidth = Math.max(2, S * 0.03);
    for (let i = 0; i < 4; i += 1) {
      const y = cy - S * 0.14 + i * S * 0.05;
      ctx.beginPath();
      ctx.moveTo(cx - S * 0.18, y);
      ctx.lineTo(cx - S * 0.18 + S * (0.16 + (i % 3) * 0.06), y);
      ctx.stroke();
    }
  }
}

function drawBook(ctx: Ctx, cx: number, cy: number, S: number): void {
  ink(ctx);
  // open book
  ctx.beginPath();
  ctx.moveTo(cx, cy - S * 0.14);
  ctx.lineTo(cx - S * 0.28, cy - S * 0.1);
  ctx.lineTo(cx - S * 0.26, cy + S * 0.16);
  ctx.lineTo(cx, cy + S * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx, cy - S * 0.14);
  ctx.lineTo(cx + S * 0.28, cy - S * 0.1);
  ctx.lineTo(cx + S * 0.26, cy + S * 0.16);
  ctx.lineTo(cx, cy + S * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = Math.max(2, S * 0.03);
  ctx.beginPath();
  ctx.moveTo(cx, cy - S * 0.14);
  ctx.lineTo(cx, cy + S * 0.12);
  ctx.stroke();
}

function drawController(ctx: Ctx, cx: number, cy: number, S: number): void {
  ink(ctx);
  oval(ctx, cx, cy, S * 0.2, S * 0.09);
  disc(ctx, cx - S * 0.18, cy + S * 0.02, S * 0.065);
  disc(ctx, cx + S * 0.18, cy + S * 0.02, S * 0.065);
}

function drawCigarette(ctx: Ctx, x: number, y: number, S: number): void {
  ink(ctx);
  ctx.lineWidth = Math.max(2, S * 0.03);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + S * 0.14, y - S * 0.02);
  ctx.stroke();
  disc(ctx, x + S * 0.14, y - S * 0.02, S * 0.025);
  oval(ctx, x + S * 0.18, y - S * 0.1, S * 0.035, S * 0.028);
  oval(ctx, x + S * 0.22, y - S * 0.18, S * 0.03, S * 0.035);
}

function drawBuildPanel(ctx: Ctx, cx: number, cy: number, S: number, mode: 'build' | 'test' | 'debug' | 'ok'): void {
  ink(ctx);
  const rows = mode === 'ok' ? 3 : 4;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      if (mode === 'debug' && r === 1 && c === 1) continue;
      if (mode === 'test' && r === 0 && c === 2) continue;
      const x = cx + (c - 1) * S * 0.18;
      const y = cy + (r - 1.1) * S * 0.13;
      rr(ctx, x - S * 0.07, y - S * 0.05, S * 0.14, S * 0.1, S * 0.015);
    }
  }
  if (mode === 'debug') {
    disc(ctx, cx, cy - S * 0.05, S * 0.05);
    limb(ctx, cx, cy - S * 0.05, cx + S * 0.18, cy - S * 0.18, S * 0.025);
  }
  if (mode === 'test' || mode === 'ok') {
    ctx.lineWidth = Math.max(2.5, S * 0.055);
    ctx.beginPath();
    ctx.moveTo(cx - S * 0.12, cy + S * 0.05);
    ctx.lineTo(cx - S * 0.02, cy + S * 0.16);
    ctx.lineTo(cx + S * 0.2, cy - S * 0.12);
    ctx.stroke();
  }
  if (mode === 'ok') {
    ctx.lineWidth = Math.max(2, S * 0.035);
    ctx.beginPath();
    ctx.arc(cx, cy, S * 0.4, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawFloorHint(ctx: Ctx, W: number, H: number): void {
  // subtle ground line so the world has a floor — not a floating void
  ink(ctx);
  ctx.lineWidth = Math.max(2, H * 0.012);
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.06, H * 0.88);
  ctx.lineTo(W * 0.94, H * 0.88);
  ctx.stroke();
}

/** Draw a full scene into pixel space of width W × height H. */
export function drawWorldScene(ctx: Ctx, id: SceneId, W: number, H: number, compact: boolean): void {
  ink(ctx);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawFloorHint(ctx, W, H);

  const bedCx = W * BED.x;
  const bedCy = H * BED.y;
  const bodyH = H * (compact ? 0.42 : 0.48);
  const robotS = H * (compact ? 0.28 : 0.32);

  switch (id) {
    case 'bed_sleep': {
      drawBed(ctx, bedCx, bedCy, W, H, { blanket: true, pillow: true });
      drawHuman(ctx, bedCx - W * 0.02, bedCy + H * 0.02, bodyH * 0.85, 'sleep');
      drawAndroid(ctx, W * ROBOT_SLOT.x, H * ROBOT_SLOT.y, robotS, 'full');
      break;
    }
    case 'bed_stir': {
      drawBed(ctx, bedCx, bedCy, W, H, { blanket: true, pillow: true });
      drawHuman(ctx, bedCx - W * 0.02, bedCy + H * 0.02, bodyH * 0.85, 'stir');
      drawAndroid(ctx, W * ROBOT_SLOT.x, H * ROBOT_SLOT.y, robotS, 'full');
      break;
    }
    case 'bed_sit': {
      drawBed(ctx, bedCx, bedCy, W, H, { blanket: true, pillow: true });
      // sitting on bed edge (right side of mattress)
      drawHuman(ctx, bedCx + W * 0.12, bedCy + H * 0.08, bodyH * 0.9, 'sit');
      drawAndroid(ctx, W * ROBOT_SLOT.x, H * ROBOT_SLOT.y, robotS, 'full');
      break;
    }
    case 'bed_stand': {
      drawBed(ctx, bedCx, bedCy, W, H, { blanket: true, pillow: true });
      drawHuman(ctx, bedCx + W * 0.06, H * 0.88, bodyH, 'stand');
      drawAndroid(ctx, W * ROBOT_SLOT.x, H * ROBOT_SLOT.y, robotS, 'full');
      break;
    }
    case 'robot_active': {
      drawBed(ctx, bedCx, bedCy, W, H, { blanket: true, pillow: true });
      drawHuman(ctx, bedCx + W * 0.02, H * 0.88, bodyH, 'stand');
      // robot steps closer
      drawAndroid(ctx, W * 0.68, H * 0.55, robotS, 'full');
      break;
    }
    case 'robot_compress': {
      drawBed(ctx, bedCx, bedCy, W, H, { blanket: true, pillow: true });
      drawHuman(ctx, bedCx - W * 0.02, H * 0.88, bodyH, 'stand');
      drawAndroid(ctx, W * 0.62, H * 0.52, robotS * 0.95, 'compress');
      break;
    }
    case 'phone_held': {
      drawBed(ctx, bedCx, bedCy, W, H, { blanket: true, pillow: true });
      drawHuman(ctx, bedCx - W * 0.02, H * 0.88, bodyH, 'stand');
      drawPhone(ctx, W * 0.6, H * 0.42, H * 0.38, -0.15);
      break;
    }
    case 'phone_land': {
      // mattress dented where phone lands
      drawBed(ctx, bedCx, bedCy, W, H, { blanket: true, pillow: true, dent: 0.08 });
      drawHuman(ctx, bedCx - W * 0.05, H * 0.88, bodyH, 'stand');
      drawPhone(ctx, bedCx + W * 0.08, bedCy + H * 0.02, H * 0.34, 0.35);
      break;
    }
    case 'work': {
      drawDesk(ctx, W * DESK.x, H * 0.62, W, H);
      drawLaptop(ctx, W * DESK.x + W * 0.02, H * 0.52, H * 0.36, true);
      drawHuman(ctx, W * DESK.x - W * 0.16, H * 0.88, bodyH * 0.95, 'work');
      if (!compact) {
        // secondary monitor / terminal slab
        rr(ctx, W * DESK.x + W * 0.16, H * 0.4, W * 0.14, H * 0.18, H * 0.01);
      }
      break;
    }
    case 'break_1':
    case 'break_2': {
      drawHuman(ctx, W * 0.42, H * 0.88, bodyH, 'break');
      drawCigarette(ctx, W * 0.52, H * 0.48, H * 0.5);
      // keep bed faintly in background for continuity on larger canvases
      if (!compact) {
        ctx.globalAlpha = 0.35;
        drawBed(ctx, W * 0.22, H * 0.7, W * 0.7, H * 0.85, { blanket: true, pillow: true });
        ctx.globalAlpha = 1;
        ink(ctx);
      }
      break;
    }
    case 'game': {
      drawHuman(ctx, W * 0.4, H * 0.88, bodyH * 0.95, 'game');
      drawPhone(ctx, W * 0.58, H * 0.48, H * 0.32, -0.1);
      drawController(ctx, W * 0.48, H * 0.72, H * 0.28);
      break;
    }
    case 'read': {
      drawHuman(ctx, W * 0.4, H * 0.88, bodyH * 0.95, 'read');
      drawBook(ctx, W * 0.58, H * 0.55, H * 0.36);
      break;
    }
    case 'build': {
      drawDesk(ctx, W * DESK.x, H * 0.64, W, H);
      drawLaptop(ctx, W * DESK.x - W * 0.02, H * 0.54, H * 0.3, true);
      drawHuman(ctx, W * DESK.x - W * 0.18, H * 0.88, bodyH * 0.92, 'work');
      drawBuildPanel(ctx, W * 0.78, H * 0.48, H * 0.32, 'build');
      break;
    }
    case 'test': {
      drawDesk(ctx, W * DESK.x, H * 0.64, W, H);
      drawLaptop(ctx, W * DESK.x - W * 0.02, H * 0.54, H * 0.3, true);
      drawHuman(ctx, W * DESK.x - W * 0.18, H * 0.88, bodyH * 0.92, 'work');
      drawBuildPanel(ctx, W * 0.78, H * 0.48, H * 0.32, 'test');
      break;
    }
    case 'debug': {
      drawDesk(ctx, W * DESK.x, H * 0.64, W, H);
      drawLaptop(ctx, W * DESK.x - W * 0.02, H * 0.54, H * 0.3, true);
      drawHuman(ctx, W * DESK.x - W * 0.18, H * 0.88, bodyH * 0.92, 'work');
      drawBuildPanel(ctx, W * 0.78, H * 0.48, H * 0.32, 'debug');
      break;
    }
    case 'build_2': {
      drawDesk(ctx, W * DESK.x, H * 0.64, W, H);
      drawLaptop(ctx, W * DESK.x - W * 0.02, H * 0.54, H * 0.3, true);
      drawHuman(ctx, W * DESK.x - W * 0.18, H * 0.88, bodyH * 0.92, 'work');
      drawBuildPanel(ctx, W * 0.78, H * 0.48, H * 0.32, 'build');
      break;
    }
    case 'success': {
      drawDesk(ctx, W * DESK.x, H * 0.64, W, H);
      drawHuman(ctx, W * DESK.x - W * 0.14, H * 0.88, bodyH * 0.92, 'sit');
      drawBuildPanel(ctx, W * 0.62, H * 0.48, H * 0.4, 'ok');
      break;
    }
    case 'return_bed': {
      drawBed(ctx, bedCx, bedCy, W, H, { blanket: true, pillow: true });
      drawHuman(ctx, bedCx + W * 0.08, H * 0.88, bodyH, 'tired');
      break;
    }
    case 'sleep': {
      drawBed(ctx, bedCx, bedCy, W, H, { blanket: true, pillow: true });
      drawHuman(ctx, bedCx - W * 0.02, bedCy + H * 0.02, bodyH * 0.85, 'sleep');
      break;
    }
    default:
      break;
  }
}

/**
 * Sample a world scene into points in the story-stage CSS pixel space.
 * `stageW/H` is the story canvas CSS size; points are centred in it.
 */
export function sampleWorldScene(
  id: SceneId,
  stageW: number,
  stageH: number,
  dpr: number,
  budget: number,
  compact: boolean
): Pt[] {
  // Use most of the story stage; leave a little margin so particles don't clip.
  const marginX = stageW * 0.04;
  const marginY = stageH * 0.04;
  const boxW = stageW - marginX * 2;
  const boxH = stageH - marginY * 2;

  const fw = Math.max(1, Math.ceil(boxW * dpr));
  const fh = Math.max(1, Math.ceil(boxH * dpr));
  if (typeof document === 'undefined') return [];
  const sample = document.createElement('canvas');
  sample.width = fw;
  sample.height = fh;
  const sctx = sample.getContext('2d', { alpha: true, willReadFrequently: true });
  if (!sctx) return [];
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sctx.clearRect(0, 0, boxW, boxH);
  drawWorldScene(sctx, id, boxW, boxH, compact);

  const img = sctx.getImageData(0, 0, fw, fh).data;
  const baseStep = Math.max(1, Math.round((compact ? 2.0 : 2.2) * dpr));
  const countAt = (step: number) => {
    let n = 0;
    for (let y = 0; y < fh; y += step) {
      for (let x = 0; x < fw; x += step) {
        if (img[(y * fw + x) * 4 + 3] > 110) n += 1;
      }
    }
    return n;
  };
  const step = denseStepFor(countAt(baseStep), baseStep, Math.max(320, budget));
  const pts: Pt[] = [];
  for (let y = 0; y < fh; y += step) {
    for (let x = 0; x < fw; x += step) {
      if (img[(y * fw + x) * 4 + 3] > 110) {
        pts.push({
          x: marginX + (x + step / 2) / dpr,
          y: marginY + (y + step / 2) / dpr,
        });
      }
    }
  }
  return pts;
}

/** Physics-ish path for phone-land morph: rise, fall, soft bounce settle. */
export function physicsLandT(t: number): number {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  // 0..0.35 rise, 0.35..0.7 fall, 0.7..1 settle bounce
  if (x < 0.35) {
    const u = x / 0.35;
    return u * u * 0.42;
  }
  if (x < 0.7) {
    const u = (x - 0.35) / 0.35;
    // ease-in gravity
    return 0.42 + (1 - Math.pow(1 - u, 2)) * 0.48;
  }
  const u = (x - 0.7) / 0.3;
  // overshoot then settle
  const bounce = Math.sin(u * Math.PI) * 0.08 * (1 - u);
  return Math.min(1, 0.9 + u * 0.1 + bounce);
}
