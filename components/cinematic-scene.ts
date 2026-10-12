/* ═══════════════════════════════════════════════════════════════
   CINEMATIC SCENE — the real-time WebGL environment.

   One coherent route through phone-first computing systems, with one
   purposeful instrument per chapter (docs/SPATIAL_PORTFOLIO.md and
   app/cinematic.ts). The camera never cuts — it
   flies on critically damped springs, inheriting velocity when the
   chapter changes mid-flight.

   This module is imported dynamically by CinematicWorld AFTER a
   successful WebGL probe, so `three` lives in its own lazy chunk and
   no route pays for it at parse time. Everything rendered here is
   procedural: no downloaded models, no bitmap textures, no stock
   media. The extruded name uses the MIT helvetiker typeface served
   from /fonts/ and the scene renders fine if that fetch fails.

   Budget: DPR policy + one-way quality ratchet (app/cinematic.ts),
   rAF paused when the tab is hidden, a single static frame per
   chapter under reduced motion, full dispose() on unmount.
   ═══════════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import {
  DISTRICTS,
  FOV,
  MONUMENTS,
  SHOTS,
  STACK,
  STACK_LAYERS,
  type DampedVec3,
  dampVec3,
  districtActivation,
  makeDamped,
  orbitOffset,
  pixelRatioFor3D,
  portraitCompensation,
  ratchetScale,
  RATCHET,
  smoothDamp,
  stackLayerY,
} from '@/app/cinematic';

export type CinematicHandle = {
  setChapter(index: number): void;
  setProject(index: number): void;
  setLanguage(lang: 'en' | 'bn'): void;
  setReducedMotion(reduced: boolean): void;
  setPointer(nx: number, ny: number): void;
  setVisible(visible: boolean): void;
  resize(width: number, height: number): void;
  dispose(): void;
};

const COLOR = {
  slabLit: 0x355540,
  accent: 0x22c55e,
} as const;

export function createCinematicScene(
  canvas: HTMLCanvasElement,
  opts: { chapter: number; reducedMotion: boolean; coarse: boolean; lang: 'en' | 'bn'; onContextLost?: () => void }
): CinematicHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.85;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07100d);
  scene.fog = new THREE.FogExp2(0x07100d, 0.0018);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 700);

  /* ── Lighting — a night exterior: cool hemisphere, one green key. ── */
  scene.add(new THREE.HemisphereLight(0xe8ffeb, 0x29583b, 3.1));
  const key = new THREE.DirectionalLight(0xf3fff2, 3.3);
  key.position.set(60, 90, 30);
  scene.add(key);
  const rim = new THREE.PointLight(COLOR.accent, 230, 90, 2);
  rim.position.set(0, 7, -9);
  scene.add(rim);

  /* ── The wafer ── */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, 1400),
    new THREE.MeshStandardMaterial({ color: 0x11241a, roughness: 0.96, metalness: 0.08 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  scene.add(ground);

  /* ── Shared materials (disposed once at the end) ── */
  const litMat = new THREE.MeshStandardMaterial({ color: COLOR.slabLit, roughness: 0.75, metalness: 0.2 });
  const accentMats: THREE.MeshStandardMaterial[] = [];
  const accentMat = (intensity: number) => {
    const m = new THREE.MeshStandardMaterial({
      color: 0x062b16,
      emissive: COLOR.accent,
      emissiveIntensity: intensity,
      roughness: 0.6,
    });
    accentMats.push(m);
    return m;
  };
  const disposables: Array<{ dispose(): void }> = [ground.geometry, ground.material, litMat];
  const geo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };

  const at = (i: number, obj: THREE.Object3D) => {
    const d = DISTRICTS[i];
    obj.position.x += d.x;
    obj.position.z += d.z;
    scene.add(obj);
    return obj;
  };

  /* Eight sets on one manufacturing spine. Every solid has a role: device,
     software layer, project instrument, test fixture or timeline marker. */
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x365543, roughness: .52, metalness: .62 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0b271c, roughness: .24, metalness: .44 });
  const porcelainMat = new THREE.MeshStandardMaterial({ color: 0xd9e8d9, roughness: .35, metalness: .18 });
  const amberMat = new THREE.MeshStandardMaterial({ color: 0x5c4b2d, emissive: 0x976c22, emissiveIntensity: .28, roughness: .65 });
  disposables.push(chassisMat, glassMat, porcelainMat, amberMat);
  const signalMat = accentMat(.95);
  const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D) => {
    const mesh = new THREE.Mesh(geo(new THREE.BoxGeometry(w, h, d)), mat);
    mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  };
  const group = (i: number) => { const g = new THREE.Group(); at(i, g); return g; };
  const stages = DISTRICTS.map((_, i) => {
    const g = group(i);
    box(23, .55, 17, chassisMat, 0, .275, 0, g);
    box(22.4, .065, .07, signalMat, 0, .59, 8.2, g);
    box(.07, .065, 16.5, litMat, -11.15, .59, 0, g);
    const light = new THREE.PointLight(0x7df4a3, 65, 35, 2);
    light.position.set(1, 13, 4); g.add(light);
    return g;
  });
  /* A copper-green route joins the stations; it follows the real narrative
     from phone hardware through tools, products, experiments and delivery. */
  for (let i = 0; i < DISTRICTS.length - 1; i += 1) {
    const a = DISTRICTS[i], b = DISTRICTS[i + 1];
    const start = new THREE.Vector3(a.x, .04, a.z - 8.5);
    const end = new THREE.Vector3(b.x, .04, b.z + 8.5);
    const path = new THREE.Vector3().subVectors(end, start);
    const beam = new THREE.Mesh(geo(new THREE.BoxGeometry(.18, .05, path.length())), signalMat);
    beam.position.copy(start).add(end).multiplyScalar(.5);
    beam.rotation.y = Math.atan2(path.x, path.z);
    scene.add(beam);
  }

  /* 0: an engraved identity block with real 3D lettering and a machined
     phone spine behind it. Bengali uses correctly shaped DOM lettering. */
  const home = stages[0];
  box(18, 1.3, 7.5, glassMat, 0, 1.2, -9, home);
  box(17.5, .1, .1, signalMat, 0, 1.93, -5.28, home);
  box(6.2, 10.6, .55, chassisMat, 7.8, 5.95, -13.8, home);
  box(5.4, 9.4, .07, glassMat, 7.8, 5.95, -13.48, home);
  box(3.3, .34, .1, signalMat, 7.8, 7.1, -13.41, home);
  box(2.3, 2.3, .12, porcelainMat, 7.8, 5.3, -13.38, home);
  let nameMesh: THREE.Mesh | null = null;
  new FontLoader().load('/fonts/helvetiker_bold.typeface.json', font => {
    if (disposed) return;
    const tg = new TextGeometry('SOBUJ MIAH', { font, size: 2.15, depth: .55, curveSegments: 8, bevelEnabled: true, bevelThickness: .05, bevelSize: .045, bevelSegments: 2 });
    tg.computeBoundingBox();
    const w = tg.boundingBox ? tg.boundingBox.max.x - tg.boundingBox.min.x : 0;
    const mesh = new THREE.Mesh(geo(tg), porcelainMat);
    mesh.position.set(-w / 2 - 2.6, 2.15, -7.7);
    home.add(mesh); nameMesh = mesh; requestRender();
  }, undefined, () => { /* DOM name remains the accessible fallback. */ });

  /* 1: device-to-runtime circuit. The tall phone is the substrate; three
     illuminated processor bays visualize local computation, tooling and output. */
  const compute = stages[1];
  box(8.3, 13.7, .8, chassisMat, 0, 7.35, -1.4, compute);
  box(7.4, 12.8, .11, glassMat, 0, 7.35, -.94, compute);
  const nodes = [[0, 9.7], [-2, 6.7], [2, 4.5]];
  nodes.forEach(([x, y], i) => {
    box(i === 0 ? 3.5 : 2.7, i === 0 ? 2.8 : 2.4, .3, i === 0 ? porcelainMat : litMat, x, y, -.74, compute);
    box(i === 0 ? 2.7 : 1.9, .13, .32, signalMat, x, y - .85, -.54, compute);
  });
  box(.12, 2, .09, signalMat, 0, 7.6, -.49, compute);
  box(2, .12, .09, signalMat, -1, 5.8, -.49, compute);
  box(2, .12, .09, signalMat, 1, 5.8, -.49, compute);
  box(7.5, .55, 4.7, litMat, 0, .94, -1.4, compute);

  /* 2: a maker's working surface. Stacked notebooks stand for the method:
     investigate, document, validate. No anonymous architectural filler. */
  const about = stages[2];
  box(15, .55, 9, glassMat, 0, 1.12, -1, about);
  [0, 1, 2].forEach((i) => {
    const leaf = box(9.8, .27, 6.6, i === 1 ? porcelainMat : litMat, -1.1 + i * .55, 1.62 + i * .55, -.2 - i * .32, about);
    leaf.rotation.y = (i - 1) * .065;
    box(7.6, .045, .08, signalMat, -1.1 + i * .55, 1.79 + i * .55, 1.7 - i * .32, about);
  });
  box(2.4, 5.7, 2.4, chassisMat, 7.6, 3.98, -2.1, about);
  box(1.2, 1.2, .1, signalMat, 7.6, 5.5, -.85, about);

  /* 3: the actual six-layer Android workstation. Each visible stratum has
     a side bus and a distinct lip so its dependency order can be read. */
  const stack = stages[3];
  const stackMeshes: THREE.Group[] = [];
  for (let i = 0; i < STACK_LAYERS; i += 1) {
    const layer = new THREE.Group(); stack.add(layer);
    box(10.5, STACK.thickness, 6.3, i === 0 ? chassisMat : i === 5 ? porcelainMat : i % 2 ? litMat : glassMat, 0, 0, 0, layer);
    box(10.1, .08, .1, i === 5 ? chassisMat : signalMat, 0, .52, 3.18, layer);
    box(.35, .42, .14, signalMat, -4.55 + i * 1.75, .06, 3.2, layer);
    layer.position.y = stackLayerY(i, 0) + .55;
    stackMeshes.push(layer);
  }
  box(1.2, 14.4, 1.2, chassisMat, -7.1, 7.75, -1.1, stack);
  box(.22, 12.8, .22, signalMat, -7.1, 7.75, -.4, stack);

  /* 4: project instruments. Ternux is a desktop on phone, ADT is a build
     gantry, LAI is a local inference module, GGEN is layered sheets, SKB is
     a linked document index. All five remain identifiable in one shot. */
  const work = stages[4];
  const projects: THREE.Group[] = [];
  const projectX = MONUMENTS.map(m => m.dx);
  projectX.forEach((x, i) => {
    const g = new THREE.Group(); g.position.x = x; work.add(g); projects.push(g);
    box(3.7, .35, 4.8, glassMat, 0, .78, 0, g);
    box(3.4, .08, .08, signalMat, 0, 1, 2.3, g);
    if (i === 0) { // Ternux: screen, window and terminal planes
      box(3, 4.9, .34, chassisMat, 0, 3.5, -.6, g);
      box(2.5, 4.1, .08, glassMat, 0, 3.5, -.37, g);
      box(1.9, 1.2, .1, signalMat, -.15, 4.1, -.28, g);
      box(1.5, .12, .12, porcelainMat, 0, 2.45, -.27, g);
    } else if (i === 1) { // ADT: build pipeline from source to signed APK
      for (let j = 0; j < 3; j++) box(2.5 - j * .3, 1.2, 2.8 - j * .25, j === 2 ? porcelainMat : litMat, 0, 1.9 + j * 1.55, 0, g);
      box(.16, 4.3, .16, signalMat, -1.5, 3.2, 0, g);
    } else if (i === 2) { // LAI: local processor and sequential token output
      box(3, 5.2, 2.2, chassisMat, 0, 3.7, 0, g);
      box(2.3, 2.3, .15, porcelainMat, 0, 4.1, 1.16, g);
      for (let j = 0; j < 4; j++) box(.3, .3, .15, signalMat, -1 + j * .65, 2.25, 1.16, g);
    } else if (i === 3) { // GGEN: document layers and one linked text flow
      for (let j = 0; j < 4; j++) { const sheet = box(2.75, .12, 3.5, j === 2 ? porcelainMat : litMat, 0, 1.7 + j * 1.08, -.5 + j * .16, g); sheet.rotation.z = (j - 1.5) * .035; }
      box(1.4, .12, .12, signalMat, 0, 5.18, 1.35, g);
    } else { // SKB: canonical documents with explicit cross-links
      for (let j = 0; j < 3; j++) box(2.8, 1.15, .43, j === 1 ? porcelainMat : litMat, 0, 2 + j * 1.5, j * -.35, g);
      box(.15, 3.1, .15, signalMat, 1.55, 3.5, .45, g);
    }
  });
  new FontLoader().load('/fonts/helvetiker_bold.typeface.json', font => {
    if (disposed) return;
    MONUMENTS.forEach((station, i) => {
      const label = station.id.toUpperCase();
      const tg = new TextGeometry(label, { font, size: .52, depth: .08, curveSegments: 4 });
      tg.computeBoundingBox();
      const w = tg.boundingBox ? tg.boundingBox.max.x - tg.boundingBox.min.x : 0;
      const mesh = new THREE.Mesh(geo(tg), porcelainMat);
      mesh.position.set(-w / 2, 1.12, 2.05);
      projects[i].add(mesh);
    });
    requestRender();
  });

  /* 5: qualification bench. A bright CPU module is validated; NPU and
     GPU fixtures remain warm amber, consistent with the actual evidence. */
  const research = stages[5];
  [-6, 0, 6].forEach((x, i) => {
    box(4.9, .55, 7.2, glassMat, x, 1, 0, research);
    box(3.8, 2.5, 3.8, i === 0 ? porcelainMat : chassisMat, x, 2.53, 0, research);
    box(3.2, .12, .15, i === 0 ? signalMat : amberMat, x, 3.86, 1.91, research);
    for (let j = 0; j < 4; j++) box(.13, .09, .8, i === 0 ? signalMat : amberMat, x - 1.2 + j * .8, 1.35, 3.1, research);
  });

  /* 6: eight dated steps. Earlier practical work and later engineering
     occupy the same physical route; the dates live in the field record. */
  const history = stages[6];
  box(19.5, .45, 2, glassMat, 0, .85, 0, history);
  const historyHeights = [2.3, 2.7, 2.2, 3.2, 4.1, 5.5, 6.5, 7.3];
  historyHeights.forEach((h, i) => {
    const x = -8.4 + i * 2.4;
    box(1.25, h, 1.2, i === 7 ? porcelainMat : litMat, x, 1.1 + h / 2, 0, history);
    box(1.3, .09, 1.25, signalMat, x, 1.15 + h, 0, history);
  });

  /* 7: an output terminal, not an abstract beacon. Its two lit channels
     terminate at the actual Telegram and e-mail links in the caption. */
  const contact = stages[7];
  box(11, 8.6, 1, chassisMat, 0, 4.9, -2, contact);
  box(9.7, 7.2, .12, glassMat, 0, 4.9, -1.4, contact);
  [-1.7, 1.7].forEach(x => {
    box(2.5, 3.4, .2, porcelainMat, x, 5.1, -1.3, contact);
    box(2.15, .12, .22, signalMat, x, 3.95, -1.16, contact);
  });
  box(10.6, .1, .1, signalMat, 0, 9.28, -1.42, contact);
  /* ── Camera state — critically damped flight + pointer orbit ── */
  let chapter = Math.max(0, Math.min(SHOTS.length - 1, opts.chapter));
  let lang = opts.lang;
  let projectIndex = 0;
  let reduced = opts.reducedMotion;
  const pos: DampedVec3 = makeDamped(SHOTS[chapter].position);
  const look: DampedVec3 = makeDamped(SHOTS[chapter].target);
  const orbit = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
  const activations = DISTRICTS.map((_, i) => ({ v: districtActivation(i, chapter), vel: 0 }));

  let width = 1;
  let height = 1;
  let scale = 1; // one-way quality ratchet multiplier
  let frameAcc = 0;
  let frameCount = 0;
  let lastTs = 0;
  let raf = 0;
  let visible = true;
  let disposed = false;

  function applyPixelRatio() {
    const pr = pixelRatioFor3D(Math.min(window.devicePixelRatio || 1, 3), opts.coarse, width, height) * scale;
    renderer.setPixelRatio(pr);
    renderer.setSize(width, height, false);
  }

  function applyActivations(dt: number, instant: boolean) {
    for (let i = 0; i < activations.length; i += 1) {
      const dest = districtActivation(i, chapter);
      const a = activations[i];
      if (instant) {
        a.v = dest;
        a.vel = 0;
      } else {
        const [v, vel] = smoothDamp(a.v, dest, a.vel, 0.7, dt);
        a.v = v;
        a.vel = vel;
      }
    }
    /* Workstation stack separates with its district's activation. */
    const act3 = activations[3].v;
    for (let i = 0; i < stackMeshes.length; i += 1) stackMeshes[i].position.y = stackLayerY(i, act3);
    for (const m of accentMats) m.emissiveIntensity = m.userData.base ?? (m.userData.base = m.emissiveIntensity);
    for (const m of accentMats) m.emissiveIntensity = (m.userData.base as number) * (0.85 + 0.25 * activations[chapter].v);
    for (let i = 0; i < projects.length; i += 1) projects[i].scale.setScalar(chapter === 4 && i === projectIndex ? 1.08 : 1);
  }

  function composeCamera(dt: number, instant: boolean) {
    const shot = SHOTS[chapter];
    const subject = chapter === 4 ? { x: shot.target.x + projectX[projectIndex] * .52, y: shot.target.y, z: shot.target.z } : shot.target;
    const eye = chapter === 4 ? { x: shot.position.x + projectX[projectIndex] * .52, y: shot.position.y, z: shot.position.z } : shot.position;
    if (instant) {
      pos.value = { ...eye };
      look.value = { ...subject };
      pos.velocity = { x: 0, y: 0, z: 0 };
      look.velocity = { x: 0, y: 0, z: 0 };
    } else {
      dampVec3(pos, eye, 1.25, dt);
      dampVec3(look, subject, 1.05, dt);
      const [ox, ovx] = smoothDamp(orbit.x, orbit.tx, orbit.vx, 0.5, dt);
      const [oy, ovy] = smoothDamp(orbit.y, orbit.ty, orbit.vy, 0.5, dt);
      orbit.x = ox;
      orbit.vx = ovx;
      orbit.y = oy;
      orbit.vy = ovy;
    }
    const off = instant ? { x: 0, y: 0, z: 0 } : orbitOffset(orbit.x, orbit.y);
    /* Portrait phones dolly out along the view axis so the same shot
       composes at narrow aspect instead of filling the width. */
    const k = portraitCompensation(camera.aspect);
    const vx = pos.value.x - look.value.x;
    const vy = pos.value.y - look.value.y;
    const vz = pos.value.z - look.value.z;
    camera.position.set(look.value.x + vx * k + off.x, look.value.y + vy * k + off.y, look.value.z + vz * k + off.z);
    camera.lookAt(look.value.x, look.value.y, look.value.z);
  }

  function renderFrame(dt: number, _t: number, instant: boolean) {
    applyActivations(dt, instant);
    composeCamera(dt, instant);
    if (nameMesh) nameMesh.visible = lang === 'en';
    renderer.render(scene, camera);
  }

  function loop(ts: number) {
    raf = 0;
    if (disposed || !visible || reduced) return;
    const dt = Math.min(0.05, lastTs ? (ts - lastTs) / 1000 : 0.016);
    lastTs = ts;
    const t0 = performance.now();
    renderFrame(dt, ts, false);
    /* One-way quality ratchet on a sustained slow average. */
    frameAcc += performance.now() - t0;
    frameCount += 1;
    if (frameCount >= RATCHET.windowFrames) {
      const next = ratchetScale(scale, frameAcc / frameCount);
      if (next !== scale) {
        scale = next;
        applyPixelRatio();
      }
      frameAcc = 0;
      frameCount = 0;
    }
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (disposed || raf) return;
    lastTs = 0;
    raf = requestAnimationFrame(loop);
  }

  function requestRender() {
    if (disposed) return;
    if (reduced || !visible) {
      renderFrame(0.016, 0, true);
      return;
    }
    start();
  }

  const onLost = (e: Event) => {
    e.preventDefault();
    opts.onContextLost?.();
  };
  canvas.addEventListener('webglcontextlost', onLost);

  applyPixelRatio();
  if (reduced) renderFrame(0.016, 0, true);
  else start();

  return {
    setChapter(index: number) {
      chapter = Math.max(0, Math.min(SHOTS.length - 1, index));
      requestRender();
    },
    setProject(index: number) {
      projectIndex = Math.max(0, Math.min(3, index));
      requestRender();
    },
    setLanguage(next: 'en' | 'bn') {
      lang = next;
      requestRender();
    },
    setReducedMotion(r: boolean) {
      reduced = r;
      if (reduced && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      requestRender();
    },
    setPointer(nx: number, ny: number) {
      orbit.tx = nx;
      orbit.ty = ny;
      if (!reduced) start();
    },
    setVisible(v: boolean) {
      visible = v;
      if (!v && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (v) {
        requestRender();
      }
    },
    resize(w: number, h: number) {
      width = Math.max(1, w);
      height = Math.max(1, h);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      applyPixelRatio();
      requestRender();
    },
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      canvas.removeEventListener('webglcontextlost', onLost);
      for (const d of disposables) d.dispose();
      for (const m of accentMats) m.dispose();
      if (nameMesh) nameMesh.geometry.dispose();
      renderer.dispose();
    },
  };
}
