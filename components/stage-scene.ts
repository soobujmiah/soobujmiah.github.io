/* ═══════════════════════════════════════════════════════════════
   THE STAGE — the three.js renderer for "Inside One Device".

   This module is imported dynamically by `components/Stage.tsx`
   AFTER a WebGL context has been proven, so no route pays for
   three.js up front and a machine without WebGL never downloads it.

   It draws exactly one subject: eight strata of a single machine,
   receding along -Z, each with a central aperture the camera travels
   through. All geometry is generated here from `app/stage.ts`'s
   numbers — there are no models, textures, environment maps or
   media files, and `check-design` fails the build if a reference to
   one appears.

   Performance posture for a phone GPU (this site is developed on
   one): no post-processing, no shadow maps, no environment map. The
   cinematic quality comes from fog-based depth haze, line work and a
   few additive emissive accents — all of which cost almost nothing.
   Frame time is measured; a sustained slow average ratchets the
   render scale down once, and never back up.
   ═══════════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import {
  FLIGHT,
  MOTES,
  RATCHET,
  STANDOFF,
  STRATA,
  STRATUM_COUNT,
  MACHINE_DEPTH,
  FOV,
  type Mark,
  type Stratum,
  cameraPosition,
  cameraTarget,
  distributeMarks,
  makeCamera,
  motePositions,
  pixelRatioFor3D,
  pointerOffset,
  portraitCompensation,
  ratchetScale,
  seeded,
  stationFor,
  stepCamera,
  stratumPresence,
  subjectOffset,
} from '@/app/stage';

export type StageColors = {
  bg: string;
  fg: string;
  accent: string;
  accentBright: string;
  signal: string;
};

export type StageOptions = {
  colors: StageColors;
  /** Verification tallies — the scene is a readout of these. */
  evidence: { verified: number; failed: number; attested: number };
  reducedMotion: boolean;
  coarsePointer: boolean;
};

export type StageHandle = {
  setChapter(index: number): void;
  setPointer(x: number, y: number): void;
  setPaused(paused: boolean): void;
  resize(width: number, height: number, dpr: number): void;
  dispose(): void;
};

/* ── Geometry builders ──────────────────────────────────────────
   Each returns disposable resources the caller tracks. */

/** A stratum's face: a rectangle with a rectangular hole cut in it. */
function strataFaceGeometry(s: Stratum): THREE.ShapeGeometry {
  const outer = new THREE.Shape();
  const w = s.halfWidth;
  outer.moveTo(-w, -w);
  outer.lineTo(w, -w);
  outer.lineTo(w, w);
  outer.lineTo(-w, w);
  outer.closePath();
  const a = s.aperture;
  const hole = new THREE.Path();
  hole.moveTo(-a, -a);
  hole.lineTo(-a, a);
  hole.lineTo(a, a);
  hole.lineTo(a, -a);
  hole.closePath();
  outer.holes.push(hole);
  return new THREE.ShapeGeometry(outer);
}

/** The line work etched into a stratum. The pattern is chosen by the
    stratum's `etch` field, so each layer of the stack reads as its
    own kind of machinery without any of them being a new scene. */
function etchGeometry(s: Stratum, index: number): THREE.BufferGeometry {
  const rand = seeded(index * 7919 + 13);
  const pts: number[] = [];
  const a = s.aperture;
  const w = s.halfWidth;
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    pts.push(x1, y1, 0, x2, y2, 0);
  };
  /* A band of usable surface between the aperture and the outer edge. */
  const inner = a + 0.5;
  const outer = w - 0.6;

  switch (s.etch) {
    case 'grain': {
      /* The glass: long, sparse horizontal rules — a surface, not a circuit. */
      for (let i = 0; i < 26; i += 1) {
        const y = -outer + (i / 25) * outer * 2;
        if (Math.abs(y) < inner) continue;
        line(-outer, y, outer, y);
      }
      break;
    }
    case 'instruments': {
      /* Focus & tools: tick groups, like a panel of gauges. */
      for (let i = 0; i < 48; i += 1) {
        const t = (i / 48) * Math.PI * 2;
        const r1 = inner + 0.4;
        const r2 = r1 + (i % 6 === 0 ? 1.5 : 0.6);
        line(Math.cos(t) * r1, Math.sin(t) * r1, Math.cos(t) * r2, Math.sin(t) * r2);
      }
      for (let i = 0; i < 10; i += 1) {
        const x = -outer + (i / 9) * outer * 2;
        line(x, outer - 1.2, x, outer);
      }
      break;
    }
    case 'traces': {
      /* Silicon: orthogonal routing with vias — right angles only. */
      for (let i = 0; i < 34; i += 1) {
        const startY = -outer + rand() * outer * 2;
        const startX = rand() < 0.5 ? -outer : outer;
        const midX = startX * (0.3 + rand() * 0.5);
        if (Math.abs(startY) < inner && Math.abs(midX) < inner) continue;
        line(startX, startY, midX, startY);
        const endY = startY + (rand() - 0.5) * 6;
        line(midX, startY, midX, endY);
      }
      break;
    }
    case 'terminal': {
      /* The userland: rows of text-length dashes — a shell, abstracted. */
      for (let row = 0; row < 22; row += 1) {
        const y = -outer + (row / 21) * outer * 2;
        if (Math.abs(y) < inner) continue;
        let x = -outer;
        while (x < outer) {
          const len = 0.5 + rand() * 2.4;
          if (!(x + len > -inner && x < inner)) line(x, y, x + len, y);
          x += len + 0.35 + rand() * 0.8;
        }
      }
      break;
    }
    case 'lattice': {
      /* The toolchain: a build graph — a regular lattice with struts. */
      const step = 2.1;
      for (let x = -outer; x <= outer; x += step) {
        for (let y = -outer; y <= outer; y += step) {
          if (Math.abs(x) < inner && Math.abs(y) < inner) continue;
          line(x - 0.3, y, x + 0.3, y);
          line(x, y - 0.3, x, y + 0.3);
          if (rand() < 0.3 && x + step <= outer) line(x + 0.3, y, x + step - 0.3, y);
        }
      }
      break;
    }
    case 'probe': {
      /* The frontier: probe lines reaching inward and stopping short —
         the unqualified edge, drawn as measurement that has not closed. */
      for (let i = 0; i < 30; i += 1) {
        const t = (i / 30) * Math.PI * 2;
        const r1 = outer;
        const r2 = inner + 0.3 + rand() * 2.6;
        line(Math.cos(t) * r1, Math.sin(t) * r1, Math.cos(t) * r2, Math.sin(t) * r2);
      }
      break;
    }
    case 'bus': {
      /* Experience: parallel lanes running the full width — the years. */
      for (let i = 0; i < 16; i += 1) {
        const y = -outer + (i / 15) * outer * 2;
        if (Math.abs(y) < inner) continue;
        line(-outer, y, outer, y);
        for (let k = 0; k < 7; k += 1) {
          const x = -outer + (k / 6) * outer * 2;
          if (Math.abs(x) < inner) continue;
          line(x, y - 0.25, x, y + 0.25);
        }
      }
      break;
    }
    case 'aperture':
    default: {
      /* The port: everything converges on the opening and leaves. */
      for (let i = 0; i < 56; i += 1) {
        const t = (i / 56) * Math.PI * 2;
        line(Math.cos(t) * inner, Math.sin(t) * inner, Math.cos(t) * outer, Math.sin(t) * outer);
      }
      break;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return geo;
}

/** The bright rim of a stratum's aperture — the edge the camera
    passes through, and the strongest accent in the frame. */
function rimGeometry(s: Stratum): THREE.BufferGeometry {
  const a = s.aperture;
  const pts = [-a, -a, 0, a, -a, 0, a, -a, 0, a, a, 0, a, a, 0, -a, a, 0, -a, a, 0, -a, -a, 0];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return geo;
}

/** Evidence marks as points sitting just outside each aperture. */
function markGeometry(marks: Mark[], colors: StageColors): {
  geometry: THREE.BufferGeometry;
  states: Mark[];
} {
  const position: number[] = [];
  const color: number[] = [];
  const verified = new THREE.Color(colors.accentBright);
  const failed = new THREE.Color(colors.fg);
  const attested = new THREE.Color(colors.signal);
  for (const m of marks) {
    const s = STRATA[m.stratum];
    if (!s) continue;
    const r = s.aperture + 0.95;
    position.push(Math.cos(m.angle) * r, Math.sin(m.angle) * r, s.z + 0.08);
    /* A failing check is drawn in the page's own text colour at low
       intensity — present, legible, and deliberately not green. */
    const c = m.state === 'verified' ? verified : m.state === 'failed' ? failed : attested;
    const dim = m.state === 'failed' ? 0.3 : m.state === 'attested' ? 0.55 : 1;
    color.push(c.r * dim, c.g * dim, c.b * dim);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(color, 3));
  return { geometry: geo, states: marks };
}

function moteGeometry(): THREE.BufferGeometry {
  const pts = motePositions(MOTES.count, 20261014);
  const position: number[] = [];
  for (const p of pts) position.push(p.x, p.y, p.z);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  return geo;
}

/* ── The stage ──────────────────────────────────────────────────── */

export function createStage(canvas: HTMLCanvasElement, options: StageOptions): StageHandle {
  const { colors, evidence, reducedMotion, coarsePointer } = options;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !coarsePointer,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(new THREE.Color(colors.bg), 1);

  const scene = new THREE.Scene();
  /* Depth haze. The far plane sits just past the last stratum so the
     machine fades into its own interior rather than ending in a void. */
  scene.fog = new THREE.Fog(new THREE.Color(colors.bg), STANDOFF + 6, MACHINE_DEPTH + 26);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.4, MACHINE_DEPTH + 60);

  /* One soft fill plus one directional light raking across the strata.
     No shadow maps: the line work carries the structure. */
  scene.add(new THREE.AmbientLight(new THREE.Color(colors.fg), 0.32));
  const key = new THREE.DirectionalLight(new THREE.Color(colors.fg), 0.55);
  key.position.set(6, 9, 8);
  scene.add(key);
  const rim = new THREE.PointLight(new THREE.Color(colors.accent), 7, 26, 2);
  scene.add(rim);

  const disposables: Array<{ dispose(): void }> = [];
  const track = <T extends { dispose(): void }>(d: T): T => {
    disposables.push(d);
    return d;
  };

  /* Each stratum is a group so a chapter changes only its material
     intensities — never its contents. */
  type StratumNode = {
    group: THREE.Group;
    face: THREE.MeshLambertMaterial;
    etch: THREE.LineBasicMaterial;
    rim: THREE.LineBasicMaterial;
  };

  const nodes: StratumNode[] = STRATA.map((s, i) => {
    const group = new THREE.Group();
    group.position.z = s.z;

    const faceMat = track(
      new THREE.MeshLambertMaterial({
        color: new THREE.Color(colors.bg).lerp(new THREE.Color(colors.fg), 0.08),
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      })
    );
    const face = new THREE.Mesh(track(strataFaceGeometry(s)), faceMat);
    group.add(face);

    const etchMat = track(
      new THREE.LineBasicMaterial({
        color: new THREE.Color(colors.fg),
        transparent: true,
        opacity: 0.18,
      })
    );
    const etchLines = new THREE.LineSegments(track(etchGeometry(s, i)), etchMat);
    etchLines.position.z = 0.04;
    group.add(etchLines);

    const rimMat = track(
      new THREE.LineBasicMaterial({
        color: new THREE.Color(colors.accentBright),
        transparent: true,
        opacity: 0.5,
      })
    );
    const rimLines = new THREE.LineSegments(track(rimGeometry(s)), rimMat);
    rimLines.position.z = 0.06;
    group.add(rimLines);

    scene.add(group);
    return { group, face: faceMat, etch: etchMat, rim: rimMat };
  });

  /* The evidence readout. */
  const marks = distributeMarks(evidence.verified, evidence.failed, evidence.attested);
  const markData = markGeometry(marks, colors);
  const markMat = track(
    new THREE.PointsMaterial({
      size: coarsePointer ? 0.3 : 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true,
      depthWrite: false,
    })
  );
  const markPoints = new THREE.Points(track(markData.geometry), markMat);
  scene.add(markPoints);

  /* Dust in the light. */
  const moteMat = track(
    new THREE.PointsMaterial({
      color: new THREE.Color(colors.fg),
      size: 0.055,
      transparent: true,
      opacity: 0.3,
      sizeAttenuation: true,
      depthWrite: false,
    })
  );
  const motes = new THREE.Points(track(moteGeometry()), moteMat);
  scene.add(motes);

  /* ── State ── */
  let chapter = 0;
  const cam = makeCamera(stationFor(0));
  let pointerX = 0;
  let pointerY = 0;
  const pointer = { lateral: 0, lift: 0 };
  let width = 1;
  let height = 1;
  let devicePixelRatioValue = 1;
  let renderScale = 1;
  let paused = false;
  let raf = 0;
  let last = 0;
  let frameAccum = 0;
  let frameCount = 0;
  let disposed = false;

  function applyProjection() {
    const aspect = width / Math.max(1, height);
    camera.aspect = aspect;
    camera.fov = FOV;
    /* Push the machine's axis off the text column. `setViewOffset`
       would also move the subject, but it changes the projection in a
       way that fights the fog; shifting the whole machine group is
       simpler and keeps the haze symmetrical. */
    const off = subjectOffset(aspect);
    const lateralWorld = off.x * 10;
    const liftWorld = off.y * 10;
    for (const n of nodes) {
      n.group.position.x = lateralWorld;
      n.group.position.y = liftWorld;
    }
    markPoints.position.set(lateralWorld, liftWorld, 0);
    motes.position.set(lateralWorld, liftWorld, 0);
    camera.updateProjectionMatrix();
  }

  function place(dt: number) {
    const station = stationFor(chapter);
    if (reducedMotion) {
      cam.depth.value = station.z;
      cam.lateral.value = station.lateral;
      cam.lift.value = station.lift;
      cam.roll.value = station.rollDeg;
    } else {
      stepCamera(cam, station, dt);
      const target = pointerOffset(pointerX, pointerY);
      /* The pointer nudge is damped separately and added on top, so it
         never fights the chapter flight for the same scalar. */
      pointer.lateral += (target.lateral - pointer.lateral) * Math.min(1, dt / FLIGHT.lateral);
      pointer.lift += (target.lift - pointer.lift) * Math.min(1, dt / FLIGHT.lift);
    }

    const aspect = width / Math.max(1, height);
    const standoffScale = portraitCompensation(aspect);
    const pos = cameraPosition(cam);
    const look = cameraTarget(cam, station);
    const pulled = look.z + (pos.z - look.z) * standoffScale;

    camera.position.set(pos.x + pointer.lateral, pos.y + pointer.lift, pulled);
    camera.up.set(Math.sin((cam.roll.value * Math.PI) / 180), Math.cos((cam.roll.value * Math.PI) / 180), 0);
    camera.lookAt(look.x, look.y, look.z);
  }

  function shade() {
    const camZ = cam.depth.value;
    for (let i = 0; i < STRATUM_COUNT; i += 1) {
      const node = nodes[i];
      if (!node) continue;
      const presence = stratumPresence(i, camZ);
      node.face.opacity = 0.12 + presence * 0.78;
      node.etch.opacity = 0.05 + presence * 0.34;
      node.rim.opacity = 0.1 + presence * 0.72;
      node.group.visible = presence > 0.001;
    }
    /* The rim light rides just ahead of the camera, so the aperture
       the reader is entering is always the brightest thing in frame. */
    rim.position.set(camera.position.x * 0.4, camera.position.y * 0.4, camZ - 3.5);
    rim.intensity = 7;
    markMat.opacity = 0.95;
  }

  function draw() {
    renderer.render(scene, camera);
  }

  function frame(now: number) {
    raf = 0;
    if (disposed || paused) return;
    const dt = last === 0 ? 1 / 60 : Math.min(0.05, (now - last) / 1000);
    last = now;

    place(dt);
    shade();
    if (!reducedMotion) {
      /* The motes drift; nothing else in the scene moves on its own. */
      motes.rotation.z += dt * 0.012;
    }
    draw();

    /* One-way quality ratchet on a sustained slow average. */
    frameAccum += dt * 1000;
    frameCount += 1;
    if (frameCount >= RATCHET.windowFrames) {
      const avg = frameAccum / frameCount;
      frameAccum = 0;
      frameCount = 0;
      const next = ratchetScale(renderScale, avg);
      if (next !== renderScale) {
        renderScale = next;
        renderer.setPixelRatio(devicePixelRatioValue * renderScale);
      }
    }

    schedule();
  }

  function schedule() {
    if (disposed || paused || reducedMotion || raf) return;
    raf = requestAnimationFrame(frame);
  }

  const handle: StageHandle = {
    setChapter(index: number) {
      chapter = Math.max(0, Math.min(STRATUM_COUNT - 1, Math.trunc(index) || 0));
      if (reducedMotion) {
        place(0);
        shade();
        draw();
      } else {
        last = 0;
        schedule();
      }
    },
    setPointer(x: number, y: number) {
      pointerX = x;
      pointerY = y;
      if (!reducedMotion) schedule();
    },
    setPaused(next: boolean) {
      paused = next;
      if (paused) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else {
        last = 0;
        schedule();
      }
    },
    resize(w: number, h: number, dpr: number) {
      width = Math.max(1, Math.round(w));
      height = Math.max(1, Math.round(h));
      devicePixelRatioValue = pixelRatioFor3D(dpr, coarsePointer, width, height);
      renderer.setPixelRatio(devicePixelRatioValue * renderScale);
      renderer.setSize(width, height, false);
      applyProjection();
      place(0);
      shade();
      draw();
    },
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      for (const d of disposables) {
        try {
          d.dispose();
        } catch {
          /* a already-disposed resource is not an error worth throwing */
        }
      }
      disposables.length = 0;
      scene.clear();
      renderer.dispose();
    },
  };

  return handle;
}
