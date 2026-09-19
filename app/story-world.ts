/* ═══════════════════════════════════════════════════════════════
   STORY WORLD — service-driven particle scene geometry.

   Source of truth for *what* is represented: app/services-content.ts
   pillars (and SERVICE_SLUGS). This module only draws the visual
   abstractions those services map to — never invents offerings.

   One continuous particle population morphs:

     IDENTITY (name, sampled elsewhere)
       → website interface
       → software workspace
       → phone ↔ computer support link
       → small-business workflow
       → graphics composition
       → office documents → structured data
       → IDENTITY

   No bedroom/day-in-the-life scenarios. No random icon carousel.
   Filled, readable compositions sampled once per beat.
   ═══════════════════════════════════════════════════════════════ */

import { denseStepFor } from './name-motion';

export type Pt = { x: number; y: number };

/**
 * Beats mirror the Services pillars:
 *   Software engineering  → website, software
 *   Practical technology   → devices, business
 *   Digital & admin        → graphics, office, data
 */
export type SceneId =
  | 'website'
  | 'software'
  | 'devices'
  | 'business'
  | 'graphics'
  | 'office'
  | 'data';

export type SceneBeat = {
  id: SceneId;
  /** Service slugs this beat abstracts (documentation only). */
  services: readonly string[];
  holdMs: number;
  morphMs: number;
  motion: 'gentle' | 'organic' | 'mechanical' | 'energetic' | 'precise' | 'settle';
};

/** Deterministic service story after the name hold. Returns via name morph. */
export const STORY_BEATS: readonly SceneBeat[] = [
  {
    id: 'website',
    services: ['web-development'],
    holdMs: 2800,
    morphMs: 2200,
    motion: 'precise',
  },
  {
    id: 'software',
    services: ['software-development'],
    holdMs: 2800,
    morphMs: 2000,
    motion: 'precise',
  },
  {
    id: 'devices',
    services: ['android-support', 'computer-support'],
    holdMs: 3000,
    morphMs: 2200,
    motion: 'mechanical',
  },
  {
    id: 'business',
    services: ['business-technology'],
    holdMs: 2600,
    morphMs: 1900,
    motion: 'gentle',
  },
  {
    id: 'graphics',
    services: ['graphics-design'],
    holdMs: 2600,
    morphMs: 1900,
    motion: 'organic',
  },
  {
    id: 'office',
    services: ['office-administration'],
    holdMs: 2400,
    morphMs: 1800,
    motion: 'gentle',
  },
  {
    id: 'data',
    services: ['data-entry', 'office-administration'],
    holdMs: 2800,
    morphMs: 2000,
    motion: 'settle',
  },
] as const;

type Ctx = CanvasRenderingContext2D;

const ink = (ctx: Ctx) => {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
};

const disc = (ctx: Ctx, x: number, y: number, r: number) => {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.6, r), 0, Math.PI * 2);
  ctx.fill();
};

const rr = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number) => {
  const rad = Math.min(Math.max(0, r), w / 2, h / 2);
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

const line = (ctx: Ctx, x1: number, y1: number, x2: number, y2: number, w: number) => {
  ctx.lineWidth = Math.max(1.2, w);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

const bar = (ctx: Ctx, x: number, y: number, w: number, h: number) => {
  ctx.fillRect(x, y, w, Math.max(1, h));
};

/* ── scene drawers (filled, mobile-readable service abstractions) ── */

/** Website Development — browser chrome + page layout panels. */
function drawWebsite(ctx: Ctx, W: number, H: number, compact: boolean): void {
  ink(ctx);
  const cx = W * 0.5;
  const cy = H * 0.52;
  const bw = W * (compact ? 0.78 : 0.72);
  const bh = H * (compact ? 0.7 : 0.68);
  const x = cx - bw / 2;
  const y = cy - bh / 2;

  // window shell
  rr(ctx, x, y, bw, bh, H * 0.03);
  // title bar strip (cut via overdraw thickness)
  bar(ctx, x, y, bw, bh * 0.12);
  // traffic lights as solid discs
  disc(ctx, x + bw * 0.08, y + bh * 0.06, H * 0.018);
  disc(ctx, x + bw * 0.14, y + bh * 0.06, H * 0.018);
  disc(ctx, x + bw * 0.2, y + bh * 0.06, H * 0.018);
  // address bar
  rr(ctx, x + bw * 0.28, y + bh * 0.03, bw * 0.55, bh * 0.06, H * 0.01);

  // page content: hero block + two cards + nav row
  const contentY = y + bh * 0.18;
  rr(ctx, x + bw * 0.06, contentY, bw * 0.88, bh * 0.22, H * 0.015);
  // nav pills
  for (let i = 0; i < 4; i += 1) {
    rr(ctx, x + bw * 0.08 + i * bw * 0.2, contentY + bh * 0.28, bw * 0.14, bh * 0.06, H * 0.012);
  }
  // two content cards
  rr(ctx, x + bw * 0.06, contentY + bh * 0.4, bw * 0.4, bh * 0.32, H * 0.02);
  rr(ctx, x + bw * 0.52, contentY + bh * 0.4, bw * 0.4, bh * 0.32, H * 0.02);
  // text rules inside cards
  for (let c = 0; c < 2; c += 1) {
    const cx0 = x + bw * (c === 0 ? 0.1 : 0.56);
    for (let r = 0; r < 3; r += 1) {
      bar(ctx, cx0, contentY + bh * 0.48 + r * bh * 0.07, bw * 0.28, H * 0.012);
    }
  }
}

/** Custom Software — workspace: editor + sidebar + terminal. */
function drawSoftware(ctx: Ctx, W: number, H: number, compact: boolean): void {
  ink(ctx);
  const cx = W * 0.5;
  const cy = H * 0.52;
  const bw = W * (compact ? 0.82 : 0.76);
  const bh = H * 0.72;
  const x = cx - bw / 2;
  const y = cy - bh / 2;

  rr(ctx, x, y, bw, bh, H * 0.025);
  // activity bar
  bar(ctx, x, y, bw * 0.08, bh);
  // sidebar
  bar(ctx, x + bw * 0.08, y, bw * 0.2, bh * 0.72);
  // editor
  rr(ctx, x + bw * 0.3, y + bh * 0.04, bw * 0.66, bh * 0.64, H * 0.012);
  // code lines (thick)
  for (let i = 0; i < (compact ? 5 : 7); i += 1) {
    const indent = (i % 3) * bw * 0.04;
    bar(ctx, x + bw * 0.36 + indent, y + bh * 0.12 + i * bh * 0.08, bw * (0.35 - indent * 0.5), H * 0.018);
  }
  // terminal strip
  rr(ctx, x + bw * 0.08, y + bh * 0.76, bw * 0.88, bh * 0.2, H * 0.012);
  bar(ctx, x + bw * 0.14, y + bh * 0.82, bw * 0.4, H * 0.016);
  bar(ctx, x + bw * 0.14, y + bh * 0.88, bw * 0.28, H * 0.016);
  // prompt caret
  disc(ctx, x + bw * 0.12, y + bh * 0.83, H * 0.012);
}

/** Android + Computer support — phone and laptop linked by diagnostic flow. */
function drawDevices(ctx: Ctx, W: number, H: number, compact: boolean): void {
  ink(ctx);
  const cy = H * 0.52;

  // laptop
  const lx = W * 0.28;
  const ls = H * (compact ? 0.42 : 0.48);
  rr(ctx, lx - ls * 0.55, cy - ls * 0.35, ls * 1.1, ls * 0.55, H * 0.02);
  rr(ctx, lx - ls * 0.62, cy + ls * 0.22, ls * 1.24, ls * 0.1, H * 0.01);
  // laptop screen content — stable system bars
  for (let i = 0; i < 3; i += 1) {
    bar(ctx, lx - ls * 0.4, cy - ls * 0.2 + i * ls * 0.12, ls * 0.7, H * 0.016);
  }
  disc(ctx, lx + ls * 0.28, cy - ls * 0.08, H * 0.03); // status ok

  // phone
  const px = W * 0.72;
  const ps = H * (compact ? 0.5 : 0.55);
  rr(ctx, px - ps * 0.18, cy - ps * 0.42, ps * 0.36, ps * 0.84, H * 0.035);
  bar(ctx, px - ps * 0.08, cy - ps * 0.36, ps * 0.16, H * 0.012);
  disc(ctx, px, cy + ps * 0.32, H * 0.02);
  // phone UI blocks
  rr(ctx, px - ps * 0.12, cy - ps * 0.22, ps * 0.24, ps * 0.35, H * 0.015);
  bar(ctx, px - ps * 0.1, cy + ps * 0.08, ps * 0.2, H * 0.014);
  bar(ctx, px - ps * 0.1, cy + ps * 0.16, ps * 0.16, H * 0.014);

  // connection / diagnostic flow between devices
  const midY = cy - H * 0.02;
  line(ctx, lx + ls * 0.55, midY, px - ps * 0.2, midY, H * 0.02);
  // data packets along the link
  disc(ctx, W * 0.48, midY, H * 0.022);
  disc(ctx, W * 0.55, midY - H * 0.04, H * 0.016);
  disc(ctx, W * 0.58, midY + H * 0.04, H * 0.016);
  // stable check near centre
  ctx.lineWidth = Math.max(2.5, H * 0.028);
  ctx.beginPath();
  ctx.moveTo(W * 0.5 - H * 0.04, cy + H * 0.14);
  ctx.lineTo(W * 0.5 - H * 0.01, cy + H * 0.18);
  ctx.lineTo(W * 0.5 + H * 0.06, cy + H * 0.1);
  ctx.stroke();
}

/** Small-business technology — workflow nodes + records grid. */
function drawBusiness(ctx: Ctx, W: number, H: number, compact: boolean): void {
  ink(ctx);
  const cx = W * 0.5;
  const cy = H * 0.5;

  // three workflow nodes
  const nodes = [
    [W * 0.22, cy - H * 0.12],
    [W * 0.5, cy - H * 0.22],
    [W * 0.78, cy - H * 0.12],
  ];
  for (const [nx, ny] of nodes) {
    rr(ctx, nx - W * 0.08, ny - H * 0.06, W * 0.16, H * 0.12, H * 0.02);
  }
  // links
  line(ctx, nodes[0][0] + W * 0.08, nodes[0][1], nodes[1][0] - W * 0.08, nodes[1][1], H * 0.018);
  line(ctx, nodes[1][0] + W * 0.08, nodes[1][1], nodes[2][0] - W * 0.08, nodes[2][1], H * 0.018);

  // organised records table below
  const tx = W * 0.18;
  const ty = cy + H * 0.08;
  const tw = W * 0.64;
  const th = H * (compact ? 0.32 : 0.36);
  rr(ctx, tx, ty, tw, th, H * 0.015);
  // header row
  bar(ctx, tx, ty, tw, th * 0.22);
  // grid
  const cols = 4;
  const rows = compact ? 3 : 4;
  for (let c = 1; c < cols; c += 1) {
    line(ctx, tx + (tw * c) / cols, ty, tx + (tw * c) / cols, ty + th, H * 0.01);
  }
  for (let r = 1; r < rows; r += 1) {
    line(ctx, tx, ty + (th * r) / rows, tx + tw, ty + (th * r) / rows, H * 0.01);
  }
  // filled cells suggesting data
  for (let r = 1; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if ((r + c) % 2 === 0) continue;
      bar(
        ctx,
        tx + (tw * c) / cols + tw * 0.04,
        ty + (th * r) / rows + th * 0.08,
        tw / cols - tw * 0.08,
        th * 0.1
      );
    }
  }
}

/** Graphics design — canvas guides + finished poster composition. */
function drawGraphics(ctx: Ctx, W: number, H: number, compact: boolean): void {
  ink(ctx);
  const cx = W * 0.5;
  const cy = H * 0.52;
  const pw = W * (compact ? 0.55 : 0.48);
  const ph = H * 0.72;
  const x = cx - pw / 2;
  const y = cy - ph / 2;

  // artboard
  rr(ctx, x, y, pw, ph, H * 0.02);
  // margin guides (thick enough to sample)
  ctx.lineWidth = Math.max(1.5, H * 0.01);
  ctx.strokeRect(x + pw * 0.08, y + ph * 0.08, pw * 0.84, ph * 0.84);

  // hero geometric block
  rr(ctx, x + pw * 0.14, y + ph * 0.14, pw * 0.72, ph * 0.28, H * 0.015);
  // typography bars (Bangla/English abstract)
  bar(ctx, x + pw * 0.18, y + ph * 0.5, pw * 0.64, H * 0.035);
  bar(ctx, x + pw * 0.18, y + ph * 0.58, pw * 0.48, H * 0.022);
  bar(ctx, x + pw * 0.18, y + ph * 0.64, pw * 0.56, H * 0.022);
  // accent shapes
  disc(ctx, x + pw * 0.28, y + ph * 0.78, H * 0.035);
  rr(ctx, x + pw * 0.42, y + ph * 0.74, pw * 0.32, ph * 0.08, H * 0.01);
  // side tool rail
  if (!compact) {
    for (let i = 0; i < 4; i += 1) {
      rr(ctx, x - W * 0.1, y + ph * 0.15 + i * ph * 0.16, W * 0.06, H * 0.05, H * 0.01);
    }
  }
}

/** Office administration — stacked documents + filing. */
function drawOffice(ctx: Ctx, W: number, H: number, compact: boolean): void {
  ink(ctx);
  const cx = W * 0.42;
  const cy = H * 0.5;

  // three stacked docs
  for (let i = 2; i >= 0; i -= 1) {
    const ox = cx - W * 0.18 + i * W * 0.04;
    const oy = cy - H * 0.28 + i * H * 0.04;
    rr(ctx, ox, oy, W * 0.36, H * 0.48, H * 0.015);
    // text rules
    for (let r = 0; r < 4; r += 1) {
      bar(ctx, ox + W * 0.05, oy + H * 0.1 + r * H * 0.08, W * (0.22 - (r % 2) * 0.05), H * 0.014);
    }
  }
  // clipboard / checklist
  const bx = W * 0.68;
  const by = cy - H * 0.22;
  rr(ctx, bx - W * 0.12, by, W * 0.28, H * 0.5, H * 0.02);
  rr(ctx, bx - W * 0.05, by - H * 0.04, W * 0.1, H * 0.06, H * 0.01);
  for (let i = 0; i < (compact ? 3 : 4); i += 1) {
    const yy = by + H * 0.12 + i * H * 0.1;
    // check tick
    ctx.lineWidth = Math.max(2, H * 0.02);
    ctx.beginPath();
    ctx.moveTo(bx - W * 0.06, yy);
    ctx.lineTo(bx - W * 0.03, yy + H * 0.025);
    ctx.lineTo(bx + W * 0.02, yy - H * 0.02);
    ctx.stroke();
    bar(ctx, bx + W * 0.04, yy - H * 0.01, W * 0.1, H * 0.014);
  }
}

/** Data entry / data work — raw docs become spreadsheet + dashboard. */
function drawData(ctx: Ctx, W: number, H: number, compact: boolean): void {
  ink(ctx);

  // left: source doc (thinning into data)
  rr(ctx, W * 0.08, H * 0.22, W * 0.22, H * 0.5, H * 0.015);
  for (let i = 0; i < 5; i += 1) {
    bar(ctx, W * 0.11, H * 0.3 + i * H * 0.07, W * 0.14, H * 0.012);
  }

  // arrow / flow
  line(ctx, W * 0.32, H * 0.48, W * 0.42, H * 0.48, H * 0.022);
  disc(ctx, W * 0.42, H * 0.48, H * 0.02);

  // centre: spreadsheet
  const tx = W * 0.44;
  const ty = H * 0.2;
  const tw = W * 0.28;
  const th = H * 0.52;
  rr(ctx, tx, ty, tw, th, H * 0.012);
  bar(ctx, tx, ty, tw, th * 0.14);
  const cols = 3;
  const rows = compact ? 4 : 5;
  for (let c = 1; c < cols; c += 1) line(ctx, tx + (tw * c) / cols, ty, tx + (tw * c) / cols, ty + th, H * 0.008);
  for (let r = 1; r < rows; r += 1) line(ctx, tx, ty + (th * r) / rows, tx + tw, ty + (th * r) / rows, H * 0.008);

  // right: report / dashboard cards
  const dx = W * 0.78;
  rr(ctx, dx - W * 0.1, H * 0.22, W * 0.22, H * 0.2, H * 0.015);
  rr(ctx, dx - W * 0.1, H * 0.48, W * 0.22, H * 0.24, H * 0.015);
  // mini bars in dashboard
  for (let i = 0; i < 4; i += 1) {
    const h = H * (0.06 + (i % 3) * 0.03);
    bar(ctx, dx - W * 0.06 + i * W * 0.05, H * 0.66 - h, W * 0.035, h);
  }
  disc(ctx, dx, H * 0.32, H * 0.035);
}

/** Draw a service beat into pixel space W×H. */
export function drawWorldScene(ctx: Ctx, id: SceneId, W: number, H: number, compact: boolean): void {
  ink(ctx);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (id) {
    case 'website':
      drawWebsite(ctx, W, H, compact);
      break;
    case 'software':
      drawSoftware(ctx, W, H, compact);
      break;
    case 'devices':
      drawDevices(ctx, W, H, compact);
      break;
    case 'business':
      drawBusiness(ctx, W, H, compact);
      break;
    case 'graphics':
      drawGraphics(ctx, W, H, compact);
      break;
    case 'office':
      drawOffice(ctx, W, H, compact);
      break;
    case 'data':
      drawData(ctx, W, H, compact);
      break;
    default:
      break;
  }
}

/**
 * Sample a service scene into story-stage CSS pixel space.
 * Points are centred in the available story rectangle.
 */
export function sampleWorldScene(
  id: SceneId,
  stageW: number,
  stageH: number,
  dpr: number,
  budget: number,
  compact: boolean
): Pt[] {
  const marginX = stageW * 0.04;
  const marginY = stageH * 0.05;
  const boxW = Math.max(8, stageW - marginX * 2);
  const boxH = Math.max(8, stageH - marginY * 2);

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
  const baseStep = Math.max(1, Math.round((compact ? 2.0 : 2.15) * dpr));
  const countAt = (step: number) => {
    let n = 0;
    for (let y = 0; y < fh; y += step) {
      for (let x = 0; x < fw; x += step) {
        if (img[(y * fw + x) * 4 + 3] > 110) n += 1;
      }
    }
    return n;
  };
  const step = denseStepFor(countAt(baseStep), baseStep, Math.max(280, budget));
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
