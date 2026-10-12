/* ═══════════════════════════════════════════════════════════════
   CINEMATIC SCENE — the real-time WebGL environment.

   One coherent place: a nocturnal silicon wafer under a green signal
   horizon, one district per chapter (see docs/CINEMATIC_3D.md §4 and
   the shot table in app/cinematic.ts). The camera never cuts — it
   flies on critically damped springs, inheriting velocity when the
   chapter changes mid-flight.

   This module is imported dynamically by CinematicWorld AFTER a
   successful WebGL probe, so `three` lives in its own lazy chunk and
   no route pays for it at parse time. Everything rendered here is
   procedural: no downloaded models, no textures from disk, no stock
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
  setReducedMotion(reduced: boolean): void;
  setPointer(nx: number, ny: number): void;
  setVisible(visible: boolean): void;
  resize(width: number, height: number): void;
  dispose(): void;
};

const COLOR = {
  bg: 0x050507,
  slab: 0x26382e,
  slabLit: 0x355540,
  fg: 0xe9f4e9,
  accent: 0x22c55e,
  signal: 0x10b981,
} as const;

/* Deterministic variation — same skyline on every visit. */
function hash01(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function gridTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  if (g) {
    g.fillStyle = '#25392b';
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(168,247,184,0.24)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0.5, 0);
    g.lineTo(0.5, 256);
    g.moveTo(0, 0.5);
    g.lineTo(256, 0.5);
    g.stroke();
    g.strokeStyle = 'rgba(168,247,184,0.10)';
    for (const q of [64, 128, 192]) {
      g.beginPath();
      g.moveTo(q + 0.5, 0);
      g.lineTo(q + 0.5, 256);
      g.moveTo(0, q + 0.5);
      g.lineTo(256, q + 0.5);
      g.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(120, 120);
  return tex;
}

function glowSprite(): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  if (g) {
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(74,222,128,0.55)');
    grad.addColorStop(0.4, 'rgba(34,197,94,0.18)');
    grad.addColorStop(1, 'rgba(34,197,94,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(260, 90, 1);
  return sprite;
}

export function createCinematicScene(
  canvas: HTMLCanvasElement,
  opts: { chapter: number; reducedMotion: boolean; coarse: boolean; onContextLost?: () => void }
): CinematicHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.55;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLOR.bg);
  scene.fog = new THREE.FogExp2(0x08130d, 0.0023);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 700);

  /* ── Lighting — a night exterior: cool hemisphere, one green key. ── */
  scene.add(new THREE.HemisphereLight(0xc9f9d4, 0x183525, 2.25));
  const key = new THREE.DirectionalLight(0xe3ffe9, 2.15);
  key.position.set(60, 90, 30);
  scene.add(key);
  const rim = new THREE.PointLight(COLOR.accent, 160, 90, 2);
  rim.position.set(0, 7, -9);
  scene.add(rim);

  /* ── The wafer ── */
  const groundTex = gridTexture();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, 1400),
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: groundTex, roughness: 0.8, metalness: 0.14 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  scene.add(ground);

  const horizon = glowSprite();
  horizon.position.set(0, 6, -520);
  scene.add(horizon);

  /* ── Shared materials (disposed once at the end) ── */
  const slabMat = new THREE.MeshStandardMaterial({ color: COLOR.slab, roughness: 0.9, metalness: 0.12 });
  const litMat = new THREE.MeshStandardMaterial({ color: COLOR.slabLit, roughness: 0.75, metalness: 0.2 });
  const fgMat = new THREE.MeshStandardMaterial({ color: 0xd3e8d6, roughness: 0.42, metalness: 0.25 });
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
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x4c9564, emissive: 0x136530, emissiveIntensity: 0.25, roughness: 0.52, metalness: 0.25 });

  const disposables: Array<{ dispose(): void }> = [groundTex, slabMat, litMat, fgMat, wireMat];
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

  /* ── 0 · Identity plaza — plinth now; extruded name arrives async.
         Set back from the district origin so the monument reads in the
         lower third of the frame, under the DOM hero, never against it. ── */
  const PLAZA_Z = -10;
  const plinth = new THREE.Mesh(geo(new THREE.BoxGeometry(14, 0.6, 6)), litMat);
  plinth.position.set(0, 0.3, PLAZA_Z);
  at(0, plinth);
  const nameEdge = new THREE.Mesh(geo(new THREE.BoxGeometry(14, 0.08, 0.08)), accentMat(1.2));
  nameEdge.position.set(0, 0.64, PLAZA_Z + 3.02);
  at(0, nameEdge);

  let nameMesh: THREE.Mesh | null = null;
  new FontLoader().load(
    '/fonts/helvetiker_bold.typeface.json',
    (font) => {
      if (disposed) return;
      const tg = new TextGeometry('SOBUJ MIAH', {
        font,
        size: 1.9,
        depth: 0.55,
        curveSegments: 6,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.03,
        bevelSegments: 2,
      });
      tg.computeBoundingBox();
      const bb = tg.boundingBox;
      const w = bb ? bb.max.x - bb.min.x : 0;
      const mesh = new THREE.Mesh(geo(tg), fgMat);
      mesh.position.set(-w / 2, 1.05, PLAZA_Z - 0.4);
      const d0 = DISTRICTS[0];
      mesh.position.x += d0.x;
      mesh.position.z += d0.z;
      scene.add(mesh);
      nameMesh = mesh;
      requestRender();
    },
    undefined,
    () => {
      /* Typeface fetch failed — the plaza still reads; the DOM carries the name. */
    }
  );

  /* ── 1 · Measurement field — instanced columns ── */
  const colGeo = geo(new THREE.BoxGeometry(1.4, 1, 1.4));
  const COLS = 9 * 5;
  const columns = new THREE.InstancedMesh(colGeo, slabMat, COLS);
  {
    const m = new THREE.Matrix4();
    let n = 0;
    for (let ix = 0; ix < 9; ix += 1) {
      for (let iz = 0; iz < 5; iz += 1) {
        const h = 1.2 + hash01(n * 7 + 1) * 5.4;
        m.makeScale(1, h, 1);
        m.setPosition((ix - 4) * 2.6, h / 2, (iz - 2) * 2.6);
        columns.setMatrixAt(n, m);
        n += 1;
      }
    }
    columns.instanceMatrix.needsUpdate = true;
  }
  at(1, columns);
  const colCap = new THREE.Mesh(geo(new THREE.BoxGeometry(1.5, 0.1, 1.5)), accentMat(0.8));
  colCap.position.set(-2.6 * 2, 1.2 + hash01(7 * 11 + 1) * 5.4 + 0.08, 0);
  at(1, colCap);

  /* ── 2 · Quiet quad — concentric rings and low slabs ── */
  for (let r = 0; r < 3; r += 1) {
    const ring = new THREE.Mesh(geo(new THREE.TorusGeometry(2.6 + r * 2.2, 0.06, 8, 72)), r === 1 ? accentMat(0.8) : litMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    at(2, ring);
  }
  const quadSlab = new THREE.Mesh(geo(new THREE.BoxGeometry(3.2, 1.1, 3.2)), litMat);
  quadSlab.position.set(0, 0.55, 0);
  at(2, quadSlab);

  /* ── 3 · The layer tower — the workstation's exploded stack.
         Six real layers in real dependency order (bottom → top):
         Android host, Termux, PRoot Debian, ARM64 toolchain,
         ADB validation, local AI runtime. Separation follows the
         chapter's activation through stackLayerY(). ── */
  const stackMeshes: THREE.Mesh[] = [];
  const stackGeo = geo(new THREE.BoxGeometry(7.4, STACK.thickness, 5.2));
  for (let i = 0; i < STACK_LAYERS; i += 1) {
    const topLayer = i === STACK_LAYERS - 1;
    const mesh = new THREE.Mesh(stackGeo, topLayer ? accentMat(0.4) : i % 2 ? litMat : slabMat);
    mesh.position.y = stackLayerY(i, 0);
    at(3, mesh);
    stackMeshes.push(mesh);
  }

  /* ── 4 · Three monuments — LAI, GGEN, SKB ── */
  const monumentGroup = new THREE.Group();
  const laiCore = new THREE.Mesh(geo(new THREE.TorusGeometry(0.9, 0.16, 10, 40)), accentMat(1.4));
  {
    const lai = MONUMENTS[0];
    const monolith = new THREE.Mesh(geo(new THREE.BoxGeometry(3, 8.4, 1.8)), slabMat);
    monolith.position.set(lai.dx, 4.2, lai.dz);
    monumentGroup.add(monolith);
    laiCore.position.set(lai.dx, 4.2, lai.dz + 0.95);
    monumentGroup.add(laiCore);

    const ggen = MONUMENTS[1];
    for (let i = 0; i < 5; i += 1) {
      const sheet = new THREE.Mesh(geo(new THREE.BoxGeometry(4.6, 0.22, 3.4)), i === 2 ? accentMat(0.45) : litMat);
      sheet.position.set(ggen.dx + (hash01(i * 3 + 2) - 0.5) * 1.1, 1 + i * 1.05, ggen.dz + (hash01(i * 5 + 4) - 0.5) * 0.9);
      sheet.rotation.y = (hash01(i * 9 + 6) - 0.5) * 0.5;
      monumentGroup.add(sheet);
    }

    const skb = MONUMENTS[2];
    const cell = geo(new THREE.BoxGeometry(0.72, 0.72, 0.72));
    const lattice = new THREE.InstancedMesh(cell, litMat, 27);
    const m = new THREE.Matrix4();
    let n = 0;
    for (let x = -1; x <= 1; x += 1)
      for (let y = -1; y <= 1; y += 1)
        for (let z = -1; z <= 1; z += 1) {
          m.makeScale(1, 1, 1);
          m.setPosition(skb.dx + x * 1.2, 3.2 + y * 1.2, skb.dz + z * 1.2);
          lattice.setMatrixAt(n, m);
          n += 1;
        }
    lattice.instanceMatrix.needsUpdate = true;
    monumentGroup.add(lattice);
    const kernel = new THREE.Mesh(geo(new THREE.BoxGeometry(0.5, 0.5, 0.5)), accentMat(1.5));
    kernel.position.set(skb.dx, 3.2, skb.dz);
    monumentGroup.add(kernel);
  }
  at(4, monumentGroup);

  /* ── 5 · Research field — floating wireframe polyhedra ── */
  const polys: THREE.Mesh[] = [];
  const polyGeos = [new THREE.IcosahedronGeometry(1.5), new THREE.OctahedronGeometry(1.3), new THREE.TetrahedronGeometry(1.4)];
  polyGeos.forEach((g, i) => {
    const p = new THREE.Mesh(geo(g), wireMat);
    p.position.set((i - 1) * 4.4, 4.4 + hash01(i * 13 + 3) * 2.2, (hash01(i * 17 + 5) - 0.5) * 4);
    at(5, p);
    polys.push(p);
  });

  /* ── 6 · The year rail — a long bridge of markers ── */
  const rail = new THREE.Mesh(geo(new THREE.BoxGeometry(26, 0.5, 2.4)), litMat);
  rail.position.y = 0.25;
  rail.rotation.y = -0.35;
  at(6, rail);
  const postGeo = geo(new THREE.BoxGeometry(0.3, 1, 0.3));
  for (let i = 0; i < 8; i += 1) {
    const h = 1 + hash01(i * 23 + 9) * 2.4;
    const post = new THREE.Mesh(postGeo, i === 7 ? accentMat(1.1) : slabMat);
    post.scale.y = h;
    const t = (i - 3.5) * 3.2;
    post.position.set(Math.cos(-0.35) * t, 0.5 + h / 2, Math.sin(-0.35) * t * -1 + 0.9);
    at(6, post);
  }

  /* ── 7 · The overlook — a far beacon the closing shot studies ── */
  const beacon = new THREE.Mesh(geo(new THREE.BoxGeometry(0.8, 14, 0.8)), accentMat(1.8));
  beacon.position.y = 7;
  at(7, beacon);

  /* ── Skyline filler — distant anonymous blocks framing the path ── */
  {
    const filler = new THREE.InstancedMesh(colGeo, slabMat, 160);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 160; i += 1) {
      const side = i % 2 ? 1 : -1;
      const z = -20 - hash01(i * 3 + 7) * 250;
      const x = side * (46 + hash01(i * 5 + 11) * 70);
      const h = 2 + hash01(i * 7 + 13) * 14;
      m.makeScale(2 + hash01(i * 11 + 17) * 3, h, 2 + hash01(i * 13 + 19) * 3);
      m.setPosition(x, h / 2, z);
      filler.setMatrixAt(i, m);
    }
    filler.instanceMatrix.needsUpdate = true;
    scene.add(filler);
  }

  /* ── Camera state — critically damped flight + pointer orbit ── */
  let chapter = Math.max(0, Math.min(SHOTS.length - 1, opts.chapter));
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
    /* Monuments brighten when the work chapter is active. */
    const act4 = activations[4].v;
    laiCore.scale.setScalar(1 + act4 * 0.12);
    for (const m of accentMats) m.emissiveIntensity = m.userData.base ?? (m.userData.base = m.emissiveIntensity);
    for (const m of accentMats) m.emissiveIntensity = (m.userData.base as number) * (0.75 + 0.45 * Math.max(act3, act4, activations[chapter].v));
  }

  function composeCamera(dt: number, instant: boolean) {
    const shot = SHOTS[chapter];
    if (instant) {
      pos.value = { ...shot.position };
      look.value = { ...shot.target };
      pos.velocity = { x: 0, y: 0, z: 0 };
      look.velocity = { x: 0, y: 0, z: 0 };
    } else {
      dampVec3(pos, shot.position, 1.25, dt);
      dampVec3(look, shot.target, 1.05, dt);
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

  function renderFrame(dt: number, t: number, instant: boolean) {
    applyActivations(dt, instant);
    composeCamera(dt, instant);
    if (!instant) {
      const spin = dt * 0.4;
      for (let i = 0; i < polys.length; i += 1) {
        polys[i].rotation.y += spin * (0.5 + i * 0.3);
        polys[i].rotation.x += spin * 0.23;
        polys[i].position.y += Math.sin(t * 0.0006 + i * 2.1) * dt * 0.18;
      }
      laiCore.rotation.z = t * 0.0005;
    }
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
      (horizon.material as THREE.SpriteMaterial).map?.dispose();
      (horizon.material as THREE.SpriteMaterial).dispose();
      renderer.dispose();
    },
  };
}
