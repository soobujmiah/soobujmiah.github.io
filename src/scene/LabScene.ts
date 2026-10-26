import * as THREE from 'three';
import { MATERIALS_3D, MOTION } from '../design-tokens';

export type SceneView = 'home' | 'work' | 'process' | 'services' | 'about' | 'notes' | 'contact';
export interface SceneConfig { view: SceneView; project: string | null; paused: boolean; reducedMotion: boolean; }

const COLOR = MATERIALS_3D;
const stationPositions: Record<SceneView, THREE.Vector3> = {
  home: new THREE.Vector3(0, 2.6, 9.5),
  work: new THREE.Vector3(0, 2.9, 8.5),
  process: new THREE.Vector3(0, 3.8, 10.5),
  services: new THREE.Vector3(2.7, 2.6, 9.6),
  about: new THREE.Vector3(-2.5, 2.5, 9.6),
  notes: new THREE.Vector3(-3.2, 3.4, 10.8),
  contact: new THREE.Vector3(3.2, 3.0, 10.2),
};

const projectColors: Record<string, number> = {
  ternux: COLOR.emeraldSignal,
  ternuxx: COLOR.blueVector,
  adt: COLOR.warmHighlight,
  lai: COLOR.amberExperimental,
  ggen: 0x9b8cff,
  songjog: 0xf0b35c,
};

function roundedBox(width: number, height: number, depth: number, radius: number, material: THREE.Material) {
  const shape = new THREE.Shape();
  const x = -width / 2, y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y); shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius); shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height); shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius); shape.quadraticCurveTo(x, y, x + radius, y);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: Math.min(radius / 3, depth / 4), bevelThickness: Math.min(depth / 4, radius / 3) });
  geometry.center();
  return new THREE.Mesh(geometry, material);
}

export class LabScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  private frame = 0;
  private clock = new THREE.Clock();
  private targetCamera = stationPositions.home.clone();
  private targetLook = new THREE.Vector3(0, 1.0, 0);
  private wingTargets = { left: -0.62, right: 0.62 };
  private config: SceneConfig;
  private phone: THREE.Group;
  private wingLeft: THREE.Group;
  private wingRight: THREE.Group;
  private signal: THREE.Mesh[] = [];
  private led: THREE.MeshStandardMaterial;
  private resizeObserver?: ResizeObserver;
  private intersectObserver?: IntersectionObserver;
  private onFailure: (message: string) => void;
  private host: HTMLElement;
  private disposed = false;
  private lastDraw = 0;
  private lowPower: boolean;

  constructor(host: HTMLElement, initial: SceneConfig, onFailure: (message: string) => void) {
    this.host = host;
    this.config = initial;
    this.onFailure = onFailure;
    this.lowPower = matchMedia('(pointer: coarse)').matches || (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined && (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4;
    this.renderer = new THREE.WebGLRenderer({ antialias: !this.lowPower, alpha: false, powerPreference: 'low-power', stencil: false, depth: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.lowPower ? MOTION.maxMobilePixelRatio : MOTION.maxDesktopPixelRatio));
    this.renderer.setClearColor(COLOR.voidBg, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = !this.lowPower;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.renderer.domElement.setAttribute('role', 'presentation');
    this.renderer.domElement.className = 'lab-canvas';
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost, false);

    this.scene.background = new THREE.Color(COLOR.voidBg);
    this.scene.fog = new THREE.FogExp2(COLOR.fogColor, this.lowPower ? 0.043 : 0.035);
    this.camera.position.copy(stationPositions.home);
    this.camera.lookAt(this.targetLook);

    this.scene.add(new THREE.HemisphereLight(0xb5c6c0, 0x08090b, 1.25));
    const key = new THREE.DirectionalLight(0xe4e2df, this.lowPower ? 2.0 : 2.8);
    key.position.set(-5, 8, 7); key.castShadow = !this.lowPower; key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -9; key.shadow.camera.right = 9; key.shadow.camera.top = 9; key.shadow.camera.bottom = -9;
    this.scene.add(key);
    const rim = new THREE.PointLight(COLOR.emeraldSignal, 18, 24, 2);
    rim.position.set(5, 4, -1); this.scene.add(rim);
    const warm = new THREE.PointLight(0xf0b35c, 10, 18, 2);
    warm.position.set(-6, 3, 2); this.scene.add(warm);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(48, 48), new THREE.MeshStandardMaterial({ color: 0x080a0d, roughness: 0.86, metalness: 0.3 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.08; floor.receiveShadow = !this.lowPower; this.scene.add(floor);
    this.addFloorSeams();
    const table = new THREE.Mesh(new THREE.BoxGeometry(12, 0.22, 7), new THREE.MeshStandardMaterial({ color: COLOR.anodizedDark, roughness: 0.47, metalness: 0.77 }));
    table.position.set(0, 0.14, 0); table.castShadow = true; table.receiveShadow = true; this.scene.add(table);
    this.addBenchLegs();

    this.led = new THREE.MeshStandardMaterial({ color: COLOR.emeraldSignal, emissive: COLOR.emeraldSignal, emissiveIntensity: 1.6, roughness: 0.4, metalness: 0.25 });
    this.phone = this.makePhone();
    this.scene.add(this.phone);
    this.wingLeft = this.makeWing(-1);
    this.wingRight = this.makeWing(1);
    this.scene.add(this.wingLeft, this.wingRight);
    this.makeSignalPaths();
    this.addWorkArtifacts();
    this.addStationBeacon();
    this.addBackWall();
    this.resize();
    this.watchVisibility();
    this.update(initial);
    this.drawStatic();
    if (!initial.paused && !initial.reducedMotion) this.animate();
  }

  private makePhone() {
    const group = new THREE.Group();
    group.position.set(0, 0.7, 0.15);
    const chassis = roundedBox(1.18, 2.35, 0.16, 0.17, new THREE.MeshStandardMaterial({ color: COLOR.anodizedMid, metalness: 0.86, roughness: 0.34 }));
    chassis.rotation.x = -0.12; chassis.castShadow = true; group.add(chassis);
    const bezel = roundedBox(1.02, 2.13, 0.055, 0.12, new THREE.MeshStandardMaterial({ color: COLOR.darkGlass, metalness: 0.28, roughness: 0.16 }));
    bezel.position.z = 0.102; bezel.rotation.x = -0.12; group.add(bezel);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.83), new THREE.MeshStandardMaterial({ color: 0x07100c, emissive: 0x07150f, emissiveIntensity: 0.38, roughness: 0.23, metalness: 0.08 }));
    screen.position.set(0, 0.02, 0.136); screen.rotation.x = -0.12; group.add(screen);
    const earpiece = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.018, 0.01), new THREE.MeshStandardMaterial({ color: 0x5b6567, metalness: 0.55, roughness: 0.4 }));
    earpiece.position.set(0, 0.92, 0.145); group.add(earpiece);
    const pill = new THREE.Mesh(new THREE.CircleGeometry(0.025, 12), this.led.clone()); pill.position.set(0.22, 0.92, 0.15); group.add(pill);
    const interfaceLines = new THREE.Group();
    const labels = [0.56, 0.31, 0.06, -0.19, -0.44];
    for (let i = 0; i < labels.length; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: i === 0 ? COLOR.emeraldBright : 0x53615b, transparent: true, opacity: i === 0 ? 0.9 : 0.6 });
      const line = new THREE.Mesh(new THREE.PlaneGeometry(i === 0 ? 0.49 : i === 2 ? 0.62 : 0.42, 0.026), mat);
      line.position.set(-0.03, labels[i], 0.141); interfaceLines.add(line);
      if (i === 1 || i === 3) {
        const dot = new THREE.Mesh(new THREE.CircleGeometry(0.045, 12), this.led.clone()); dot.position.set(-0.31, labels[i], 0.145); interfaceLines.add(dot);
      }
    }
    group.add(interfaceLines);
    return group;
  }

  private makeWing(direction: -1 | 1) {
    const wing = new THREE.Group();
    wing.position.set(direction * 0.62, 0.7, 0.15);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.09, 1.5), new THREE.MeshStandardMaterial({ color: COLOR.mattePolymer, roughness: 0.66, metalness: 0.48 }));
    plate.castShadow = true; plate.receiveShadow = true; wing.add(plate);
    const traces = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const length = 0.65 + (i % 2) * 0.28;
      const line = new THREE.Mesh(new THREE.BoxGeometry(length, 0.012, 0.025), new THREE.MeshStandardMaterial({ color: i === 0 ? COLOR.emeraldSignal : 0x38433e, emissive: i === 0 ? COLOR.emeraldSignal : 0x101411, emissiveIntensity: i === 0 ? 0.8 : 0.15, metalness: 0.45, roughness: 0.5 }));
      line.position.set(-0.35 + (i % 2) * 0.65, 0.055, -0.38 + i * 0.22); traces.add(line);
    }
    wing.add(traces);
    return wing;
  }

  private addFloorSeams() {
    const seamMat = new THREE.LineBasicMaterial({ color: 0x1e2824, transparent: true, opacity: 0.42 });
    for (let i = -5; i <= 5; i++) {
      const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i * 1.2, -0.055, -14), new THREE.Vector3(i * 1.2, -0.055, 14)]);
      this.scene.add(new THREE.Line(geometry, seamMat));
    }
    for (let i = -7; i <= 7; i++) {
      const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-15, -0.054, i * 1.15), new THREE.Vector3(15, -0.054, i * 1.15)]);
      this.scene.add(new THREE.Line(geometry, seamMat));
    }
  }

  private addBenchLegs() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x15191e, roughness: 0.55, metalness: 0.74 });
    for (const x of [-5.4, 5.4]) for (const z of [-2.9, 2.9]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.05, 0.16), mat);
      leg.position.set(x, -0.45, z); this.scene.add(leg);
    }
  }

  private makeSignalPaths() {
    const points = [
      [new THREE.Vector3(-5.4, 0.27, 0), new THREE.Vector3(-4.2, 0.28, 0), new THREE.Vector3(-3.4, 0.28, -0.7), new THREE.Vector3(-2.6, 0.28, -0.7)],
      [new THREE.Vector3(5.4, 0.28, 0.25), new THREE.Vector3(4.5, 0.28, 0.25), new THREE.Vector3(3.4, 0.28, -0.4), new THREE.Vector3(2.55, 0.28, -0.4)],
      [new THREE.Vector3(-0.6, 0.3, -2.7), new THREE.Vector3(-0.6, 0.3, -1.95), new THREE.Vector3(0, 0.3, -1.32)],
      [new THREE.Vector3(0.65, 0.3, 2.7), new THREE.Vector3(0.65, 0.3, 1.9), new THREE.Vector3(0.15, 0.3, 1.35)],
    ];
    const base = new THREE.LineBasicMaterial({ color: 0x32433a, transparent: true, opacity: 0.65 });
    for (const path of points) {
      const curve = new THREE.CatmullRomCurve3(path);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(36)), base);
      this.scene.add(line);
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), this.led.clone());
      bead.userData.curve = curve; bead.userData.phase = Math.random();
      this.scene.add(bead); this.signal.push(bead);
    }
  }

  private addWorkArtifacts() {
    const stations = [
      { id: 'ternux', x: -4.25, z: -1.0 }, { id: 'ternuxx', x: -2.1, z: 1.2 },
      { id: 'adt', x: 3.85, z: -1.0 }, { id: 'lai', x: 2.15, z: 1.2 },
      { id: 'ggen', x: -4.15, z: 1.2 }, { id: 'songjog', x: 4.2, z: 1.2 },
    ];
    for (const station of stations) {
      const color = projectColors[station.id];
      const group = new THREE.Group();
      group.position.set(station.x, 0, station.z);
      const shell = new THREE.MeshStandardMaterial({ color: COLOR.anodizedDark, roughness: 0.52, metalness: 0.64, emissive: color, emissiveIntensity: 0.08 });
      const accent = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.75, roughness: 0.32, metalness: 0.45 });
      const make = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, ring = false) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
        mesh.userData.project = station.id;
        if (ring) mesh.userData.isRing = true;
        group.add(mesh); return mesh;
      };
      make(new THREE.BoxGeometry(1.48, 0.09, 1.06), shell, 0, 0.34, 0);
      make(new THREE.RingGeometry(0.52, 0.55, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, side: THREE.DoubleSide }), 0, 0.395, 0, true).rotation.x = -Math.PI / 2;

      if (station.id === 'ternux') {
        // A tiny Linux workstation: display + terminal strip + stacked guest layers.
        make(new THREE.BoxGeometry(0.66, 0.46, 0.045), shell, -0.13, 0.67, -0.17);
        make(new THREE.BoxGeometry(0.48, 0.025, 0.016), accent, -0.13, 0.69, -0.143);
        make(new THREE.BoxGeometry(0.12, 0.16, 0.12), shell, -0.13, 0.36, -0.18);
        for (let i = 0; i < 3; i++) make(new THREE.BoxGeometry(0.33, 0.045, 0.21), i === 0 ? accent : shell, 0.44, 0.43 + i * 0.07, 0.18 + i * 0.04);
      } else if (station.id === 'ternuxx') {
        // Native host / optional guest, shown as a native ring around a separated guest core.
        make(new THREE.CylinderGeometry(0.24, 0.24, 0.34, 16), shell, 0, 0.6, 0);
        make(new THREE.TorusGeometry(0.46, 0.025, 8, 48), accent, 0, 0.76, 0);
        make(new THREE.BoxGeometry(0.36, 0.04, 0.32), shell, 0.43, 0.42, 0.15);
        make(new THREE.BoxGeometry(0.24, 0.018, 0.06), accent, 0.43, 0.45, 0.15);
      } else if (station.id === 'adt') {
        // Build → sign → install → debug as a compact rising toolchain forge.
        for (let i = 0; i < 4; i++) {
          const h = 0.18 + i * 0.11;
          make(new THREE.BoxGeometry(0.22, h, 0.25), i === 3 ? accent : shell, -0.48 + i * 0.32, 0.4 + h / 2, 0.03);
          make(new THREE.BoxGeometry(0.15, 0.018, 0.02), accent, -0.48 + i * 0.32, 0.42 + h, -0.1);
        }
      } else if (station.id === 'lai') {
        // Local inference core inside a visible, non-crossing permission boundary.
        make(new THREE.OctahedronGeometry(0.32, 0), shell, 0, 0.88, 0);
        make(new THREE.TorusGeometry(0.53, 0.018, 8, 48), accent, 0, 0.89, 0);
        const boundary = make(new THREE.TorusGeometry(0.53, 0.015, 8, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.44 }), 0, 0.89, 0, true);
        boundary.rotation.x = Math.PI / 2;
      } else if (station.id === 'ggen') {
        // A page/artboard with vector paths and a separate frame edge.
        make(new THREE.BoxGeometry(0.82, 0.035, 0.68), shell, 0, 0.43, 0);
        for (let i = 0; i < 3; i++) make(new THREE.BoxGeometry(0.018, 0.018, 0.46 - i * 0.1), i === 1 ? accent : shell, -0.22 + i * 0.2, 0.46, 0.02);
        make(new THREE.TorusGeometry(0.16, 0.018, 6, 28), accent, 0.26, 0.48, 0.08);
      } else {
        // A ledger surface with parallel entry lines and joined record points.
        make(new THREE.BoxGeometry(0.9, 0.035, 0.68), shell, 0, 0.43, 0);
        for (let i = 0; i < 4; i++) {
          make(new THREE.BoxGeometry(0.58, 0.016, 0.018), i === 0 ? accent : shell, -0.02, 0.46, -0.21 + i * 0.12);
          make(new THREE.SphereGeometry(0.035, 8, 6), accent, -0.36, 0.48, -0.21 + i * 0.12);
        }
      }
      this.scene.add(group);
    }
  }

  private addStationBeacon() {
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x171c20, roughness: 0.42, metalness: 0.82 });
    for (const [x, z, color] of [[-5.5, -2.1, COLOR.emeraldSignal], [5.45, -2.05, COLOR.blueVector], [-5.4, 2.1, COLOR.amberExperimental], [5.4, 2.1, 0x9b8cff]] as [number, number, number][]) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 1.3, 12), baseMat);
      tower.position.set(x, 0.84, z); tower.castShadow = true; this.scene.add(tower);
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.1, roughness: 0.25 }));
      node.position.set(x, 1.58, z); this.scene.add(node);
    }
  }

  private addBackWall() {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(18, 5.8, 0.26), new THREE.MeshStandardMaterial({ color: 0x080b0e, metalness: 0.6, roughness: 0.68 }));
    wall.position.set(0, 2.8, -4.2); wall.receiveShadow = true; this.scene.add(wall);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(11, 0.035, 0.04), new THREE.MeshBasicMaterial({ color: COLOR.emeraldSignal, transparent: true, opacity: 0.52 }));
    strip.position.set(0, 4.7, -4.03); this.scene.add(strip);
    for (let i = 0; i < 8; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.42 + (i % 3) * 0.12, 0.025, 0.04), new THREE.MeshBasicMaterial({ color: i < 3 ? COLOR.emeraldSignal : 0x4a5653, transparent: true, opacity: i < 3 ? 0.48 : 0.22 }));
      b.position.set(-4.2 + i * 1.18, 3.75 + (i % 2) * 0.14, -4.02); this.scene.add(b);
    }
  }

  private watchVisibility() {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.host);
    this.intersectObserver = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) this.start();
      else this.stop();
    }, { threshold: 0.01 });
    this.intersectObserver.observe(this.host);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  private onVisibility = () => {
    if (document.hidden) this.stop();
    else this.start();
  };

  private onContextLost = (event: Event) => {
    event.preventDefault();
    this.stop();
    this.onFailure('WebGL context was lost; switched to the lightweight schematic.');
  };

  private resize() {
    if (this.disposed) return;
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    this.camera.aspect = width / height;
    this.camera.fov = width < 600 ? 45 : 38;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.drawStatic();
  }

  update(next: SceneConfig) {
    this.config = next;
    this.targetCamera.copy(stationPositions[next.view]);
    if (next.view === 'home') this.targetLook.set(0, 0.9, 0);
    else if (next.view === 'work' && next.project) {
      const idx = ['ternux', 'ternuxx', 'adt', 'lai', 'ggen', 'songjog'].indexOf(next.project);
      const side = idx < 2 ? -1 : idx > 3 ? 1 : 0;
      this.targetCamera.x = side * 1.6;
      this.targetLook.set(side * 1.15, 0.58, 0.1);
    } else if (next.view === 'process') this.targetLook.set(0, 0.4, 0);
    else if (next.view === 'services') this.targetLook.set(2.2, 0.5, 0);
    else if (next.view === 'about') this.targetLook.set(-2.4, 0.7, 0);
    else if (next.view === 'notes') this.targetLook.set(-3.0, 0.8, -0.1);
    else this.targetLook.set(3.2, 0.7, 0);
    this.scene.traverse(obj => {
      if (!obj.userData.project || !(obj instanceof THREE.Mesh)) return;
      const selected = obj.userData.project === next.project && next.view === 'work';
      if (obj.material instanceof THREE.MeshStandardMaterial) obj.material.emissiveIntensity = selected ? 0.82 : 0.08;
      if (obj.userData.isRing && obj.material instanceof THREE.MeshBasicMaterial) obj.material.opacity = selected ? 0.95 : 0.25;
    });
    // The phone remains the central artifact in every destination; project stations reveal connected work rather than teleporting to an unrelated demo.
    this.phone.visible = true;
    this.wingLeft.visible = true;
    this.wingRight.visible = true;
    const open = next.view === 'home' ? 0.45 : 1;
    this.wingTargets = { left: -0.62 - 1.15 * open, right: 0.62 + 1.15 * open };
    if (next.reducedMotion || next.paused) {
      this.wingLeft.position.x = this.wingTargets.left;
      this.wingRight.position.x = this.wingTargets.right;
    }
    if (next.reducedMotion || next.paused) this.stop(); else this.start();
    this.drawStatic();
  }

  setPaused(paused: boolean) { this.update({ ...this.config, paused }); }
  setReducedMotion(reducedMotion: boolean) { this.update({ ...this.config, reducedMotion }); }

  private animate = () => {
    if (this.disposed || this.config.paused || this.config.reducedMotion || document.hidden) return;
    this.frame = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const easing = 1 - Math.exp(-MOTION.cameraDamping * delta);
    this.camera.position.lerp(this.targetCamera, easing);
    const look = this.camera.userData.lookTarget as THREE.Vector3 | undefined;
    if (!look) this.camera.userData.lookTarget = this.targetLook.clone();
    const target = this.camera.userData.lookTarget as THREE.Vector3;
    target.lerp(this.targetLook, easing);
    this.camera.lookAt(target);
    const time = this.clock.elapsedTime;
    if (this.phone.visible) {
      const wingEase = 1 - Math.exp(-MOTION.unfoldSpeed * delta);
      this.wingLeft.position.x = THREE.MathUtils.lerp(this.wingLeft.position.x, this.wingTargets.left, wingEase);
      this.wingRight.position.x = THREE.MathUtils.lerp(this.wingRight.position.x, this.wingTargets.right, wingEase);
      this.wingLeft.rotation.z = THREE.MathUtils.lerp(this.wingLeft.rotation.z, -0.018, wingEase);
      this.wingRight.rotation.z = THREE.MathUtils.lerp(this.wingRight.rotation.z, 0.018, wingEase);
      this.phone.rotation.y = Math.sin(time * 0.22) * 0.025;
    }
    for (const bead of this.signal) {
      const curve = bead.userData.curve as THREE.CatmullRomCurve3;
      const phase = (time * 0.09 + bead.userData.phase) % 1;
      bead.position.copy(curve.getPoint(phase));
    }
    if (time - this.lastDraw > (this.lowPower ? 1 / 30 : 1 / 45)) {
      this.renderer.render(this.scene, this.camera);
      this.lastDraw = time;
    }
  };

  private drawStatic() {
    if (this.disposed || !this.renderer) return;
    if (this.config.reducedMotion || this.config.paused) {
      this.camera.position.copy(this.targetCamera);
      this.camera.lookAt(this.targetLook);
    }
    this.renderer.render(this.scene, this.camera);
  }

  private start() {
    if (this.disposed || this.config.paused || this.config.reducedMotion || document.hidden || !this.host.isConnected || this.frame) return;
    this.clock.start();
    this.frame = requestAnimationFrame(this.animate);
  }

  private stop() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.drawStatic();
  }

  dispose() {
    this.disposed = true;
    this.stop();
    this.resizeObserver?.disconnect();
    this.intersectObserver?.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => material.dispose());
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
