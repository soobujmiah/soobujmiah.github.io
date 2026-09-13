/* Page-plan math test (runs against tsc-compiled app/pageplan.js).
   Usage: npx tsc app/pageplan.ts --module commonjs --target es2020 \
            --outDir /tmp/pptest && node scripts/check-pageplan.js /tmp/pptest/pageplan.js
*/
const path = process.argv[2] || '/tmp/pptest/pageplan.js';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildPagePlan } = require(path);

let fails = 0;
const assert = (cond, msg) => {
  if (!cond) {
    fails++;
    console.log('FAIL:', msg);
  }
};
const ascending = (a) => a.every((v, i) => i === 0 || v >= a[i - 1]);

/* Simulate a phone (700px viewport): short hero/stats/contact, tall middles. */
const H = 700;
const heights = [600, 400, 1500, 2600, 1400, 1700, 3200, 2100, 520];
const plan = buildPagePlan(H, heights, 9);

assert(plan.scenes.length === 9, 'nine scenes planned');
assert(plan.total > 0, 'positive total scroll');

// 1. All keyframe arrays ascend and pair with their values.
for (let i = 0; i < 9; i++) {
  const s = plan.scenes[i];
  assert(ascending(s.contentKeys), `scene ${i} content keys ascend`);
  assert(ascending(s.layerYKeys), `scene ${i} layerY keys ascend`);
  assert(ascending(s.layerOKeys), `scene ${i} layerO keys ascend`);
  assert(s.contentKeys.length === s.contentVals.length, `scene ${i} content pairs`);
  assert(s.layerYKeys.length === s.layerYVals.length, `scene ${i} layerY pairs`);
  assert(s.layerOKeys.length === s.layerOVals.length, `scene ${i} layerO pairs`);
}

// 2. Exactly one active page at every scroll position.
for (let y = 0; y <= plan.total; y += 25) {
  const n = plan.scenes.filter((s) => y >= s.activeStart && y < s.activeEnd).length;
  assert(n === 1, `exactly one active at y=${y} (got ${n})`);
}

// 3. Active ranges are contiguous from 0 to total.
assert(plan.scenes[0].activeStart === 0, 'coverage starts at 0');
for (let i = 0; i < 8; i++) {
  assert(
    plan.scenes[i].activeEnd === plan.scenes[i + 1].activeStart,
    `contiguous ${i}->${i + 1}`
  );
}
assert(plan.scenes[8].activeEnd > plan.total, 'last page holds to max scroll');

// 4. Full content reachable: travel covers content + footer clearance.
for (let i = 0; i < 9; i++) {
  const travel = -plan.scenes[i].contentVals[3];
  const raw = Math.max(0, heights[i] - H);
  const expected = raw > 0 ? raw + 96 : 0;
  assert(travel === expected, `scene ${i} travel ${travel} === expected ${expected}`);
}

// 5. First page starts visible (no enter), last page never exits.
assert(plan.scenes[0].layerYVals[0] === '0%', 'hero starts in place');
assert(plan.scenes[0].layerOVals.every((v) => v === 1), 'hero always opaque');
assert(plan.scenes[8].layerYVals[1] === '0%', 'contact ends in place');
// Middle pages enter from below and leave upward.
for (let i = 1; i < 8; i++) {
  const s = plan.scenes[i];
  assert(s.layerYVals[0] === '100%' && s.layerYVals[1] === '0%', `scene ${i} slides up in`);
  assert(s.layerYVals[3] === '-12%', `scene ${i} drifts up out`);
  assert(s.layerOVals[0] === 0 && s.layerOVals[2] === 1, `scene ${i} fades in`);
}

// 6. Exits share the next page's enter range (overlapping page turn).
for (let i = 0; i < 8; i++) {
  const a = plan.scenes[i];
  const b = plan.scenes[i + 1];
  // Hero's exit keys sit at [1],[2] (leading 0 hold); middles at [2],[3].
  const ax = i === 0 ? [a.layerYKeys[1], a.layerYKeys[2]] : [a.layerYKeys[2], a.layerYKeys[3]];
  assert(ax[0] === b.layerYKeys[0], `turn ${i}->${i + 1} overlap start`);
  assert(ax[1] === b.layerYKeys[1], `turn ${i}->${i + 1} overlap end`);
}

// 7. Robustness: zero heights (pre-measure) and huge desktop viewport.
for (const [h, hs] of [
  [700, new Array(9).fill(0)],
  [1080, [700, 500, 900, 1200, 800, 1000, 2200, 1400, 600]],
]) {
  const p = buildPagePlan(h, hs, 9);
  for (let i = 0; i < 9; i++) {
    assert(ascending(p.scenes[i].contentKeys), `robust h=${h} scene ${i} keys`);
  }
  for (let y = 0; y <= p.total; y += 50) {
    const n = p.scenes.filter((s) => y >= s.activeStart && y < s.activeEnd).length;
    assert(n === 1, `robust h=${h} single active at y=${y}`);
  }
}

if (fails === 0) {
  console.log(`ALL PAGE-PLAN ASSERTIONS PASS (total scroll ${(plan.total / 1000).toFixed(1)}k px @H=${H})`);
  process.exit(0);
} else {
  console.log(`${fails} FAILURES`);
  process.exit(1);
}
