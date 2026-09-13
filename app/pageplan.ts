/* ═══════════════════════════════════════════════════════════════
   PAGE PLAN — pure scroll-keyframe math for the paged scenes.

   Page scroll (px) is split into per-page segments sized by measured
   content heights: [intro hold][page0 read][turn][page1 read][turn]…
   [page8 read][outro hold]. Turns are shared ranges where the
   outgoing page drifts up and the incoming page slides in from the
   bottom. Pure functions only — no React, no DOM (unit-testable).
   ═══════════════════════════════════════════════════════════════ */

/** Precomputed scroll keyframes for one page. */
export interface SceneMotion {
  contentKeys: number[];
  contentVals: number[];
  layerYKeys: number[];
  layerYVals: string[];
  layerOKeys: number[];
  layerOVals: number[];
  activeStart: number;
  activeEnd: number;
}

export interface PagePlan {
  scenes: (SceneMotion & { readStart: number })[];
  total: number;
}

/** Build every page's scroll keyframes from viewport + content heights. */
export function buildPagePlan(
  viewportH: number,
  contentHs: number[],
  pageCount: number
): PagePlan {
  const H = Math.max(viewportH, 1);
  const TURN = 0.6 * H; // page-turn scroll length (shared between neighbors)
  const LAND = 0.15 * H; // settle after a page lands, before content moves
  const SETTLE = 0.2 * H; // breathing room after content finishes
  const PRE = 0.5 * H; // hero intro hold
  const POST = 0.6 * H; // contact outro hold
  const TAIL = 96; // clearance above the fixed footer at content end

  const travels = contentHs.map((h) => {
    const raw = Math.max(0, h - H);
    return raw > 0 ? raw + TAIL : 0;
  });

  const scenes: (SceneMotion & { readStart: number })[] = [];
  let cursor = PRE;

  for (let i = 0; i < pageCount; i++) {
    const isFirst = i === 0;
    const travel = travels[i] ?? 0;

    const enter: [number, number] | null = isFirst ? null : [cursor, cursor + TURN];
    if (enter) cursor = enter[1];

    const readStart = cursor;
    const landEnd = readStart + LAND;
    const settleStart = Math.max(landEnd, readStart + LAND + travel);
    const readEnd = settleStart + SETTLE;
    cursor = readEnd;

    scenes.push({
      contentKeys: [readStart, landEnd, settleStart, readEnd],
      contentVals: [0, 0, -travel, -travel],
      layerYKeys: [],
      layerYVals: [],
      layerOKeys: [],
      layerOVals: [],
      activeStart: isFirst ? 0 : (enter as [number, number])[0],
      activeEnd: readEnd,
      readStart,
    });
  }

  const total = cursor + POST;

  /* Layer enter/exit keyframes. Exits share the next page's enter range
     so the outgoing drift and incoming slide overlap = page turn. */
  for (let i = 0; i < pageCount; i++) {
    const s = scenes[i];
    const isFirst = i === 0;
    const isLast = i === pageCount - 1;
    const enterStart = isFirst ? 0 : s.activeStart;
    const enterEnd = isFirst ? 0 : s.readStart;
    const exitStart = isLast ? total : scenes[i + 1].activeStart;
    const exitEnd = isLast ? total : scenes[i + 1].readStart;

    if (isFirst) {
      s.layerYKeys = [0, exitStart, exitEnd];
      s.layerYVals = ['0%', '0%', '-12%'];
      s.layerOKeys = [0, exitEnd];
      s.layerOVals = [1, 1];
    } else if (isLast) {
      s.layerYKeys = [enterStart, enterEnd];
      s.layerYVals = ['100%', '0%'];
      const fadeEnd = enterStart + (enterEnd - enterStart) * 0.35;
      s.layerOKeys = [enterStart, fadeEnd, enterEnd];
      s.layerOVals = [0, 1, 1];
      s.activeEnd = total + 1; // hold through the outro to max scroll
    } else {
      s.layerYKeys = [enterStart, enterEnd, exitStart, exitEnd];
      s.layerYVals = ['100%', '0%', '0%', '-12%'];
      const fadeEnd = enterStart + (enterEnd - enterStart) * 0.35;
      s.layerOKeys = [enterStart, fadeEnd, enterEnd];
      s.layerOVals = [0, 1, 1];
    }
  }

  return { scenes, total };
}
