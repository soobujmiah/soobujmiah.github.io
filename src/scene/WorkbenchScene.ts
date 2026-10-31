import * as THREE from 'three';

const PALETTE = {
  void: 0x06100c,
  board: 0x0a1711,
  boardEdge: 0x203a2d,
  metal: 0x29352e,
  metalLight: 0x647365,
  lime: 0xcfff69,
  mint: 0x62dbb2,
  ink: 0xeff2e8,
  muted: 0x93a394,
};

function roundedShape(width: number, height: number, radius: number) {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  return shape;
}

function roundedPanel(width: number, height: number, depth: number, radius: number, material: THREE.Material) {
  const geometry = new THREE.ExtrudeGeometry(roundedShape(width, height, radius), {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: Math.min(0.065, depth * 0.22),
    bevelThickness: Math.min(0.065, depth * 0.22),
    curveSegments: 10,
  });
  geometry.translate(0, 0, -depth / 2);
  return new THREE.Mesh(geometry, material);
}

function makeDisplayTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 1360;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas display texture is unavailable');
  const gradient = ctx.createLinearGradient(0, 0, 720, 1360);
  gradient.addColorStop(0, '#1b3021');
  gradient.addColorStop(0.56, '#14291c');
  gradient.addColorStop(1, '#102017');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(205,255,105,.24)';
  ctx.lineWidth = 1;
  for (let y = 40; y < canvas.height; y += 88) {
    ctx.beginPath(); ctx.moveTo(34, y); ctx.lineTo(686, y); ctx.stroke();
  }
  ctx.fillStyle = '#cfff69';
  ctx.fillRect(42, 62, 48, 4);
  ctx.font = '500 22px monospace';
  ctx.fillStyle = '#eff2e8';
  ctx.fillText('SOBUJ MIAH  /  SYSTEMS', 42, 112);
  ctx.font = '500 15px monospace';
  ctx.fillStyle = '#b2c3b2';
  ctx.fillText('INDEPENDENT ENGINEERING', 42, 145);

  ctx.font = '500 18px monospace';
  ctx.fillStyle = '#62dbb2';
  ctx.fillText('01  /  OPERATIONS', 42, 246);
  ctx.fillStyle = '#f4f5ee';
  ctx.font = '500 34px sans-serif';
  ctx.fillText('Work, in order.', 42, 302);
  ctx.fillStyle = '#b2c3b2';
  ctx.font = '22px sans-serif';
  ctx.fillText('Records · coordination · delivery', 42, 344);

  ctx.fillStyle = '#cfff69';
  ctx.font = '500 18px monospace';
  ctx.fillText('02  /  ENGINEERING', 42, 462);
  ctx.fillStyle = '#f4f5ee';
  ctx.font = '500 34px sans-serif';
  ctx.fillText('Systems, made useful.', 42, 518);
  ctx.fillStyle = '#b2c3b2';
  ctx.font = '22px sans-serif';
  ctx.fillText('Android · ARM64 · local AI', 42, 560);

  const cards = [
    ['TERNux', 'ANDROID / LINUX'],
    ['ADT', 'ARM64 TOOLING'],
    ['LAI', 'LOCAL AI'],
    ['GGEN', 'CREATIVE SOFTWARE'],
  ];
  cards.forEach(([name, label], index) => {
    const x = 42 + (index % 2) * 324;
    const y = 662 + Math.floor(index / 2) * 176;
    ctx.fillStyle = '#0e2118';
    ctx.strokeStyle = 'rgba(126,159,133,.30)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x, y, 294, 136, 18); ctx.fill(); ctx.stroke();
    ctx.fillStyle = index === 0 ? '#cfff69' : '#e8ede3';
    ctx.font = '600 28px sans-serif';
    ctx.fillText(name, x + 22, y + 50);
    ctx.fillStyle = '#b2c3b2';
    ctx.font = '500 14px monospace';
    ctx.fillText(label, x + 22, y + 84);
    ctx.fillStyle = index === 0 ? '#62dbb2' : '#64786a';
    ctx.beginPath(); ctx.arc(x + 258, y + 36, 5, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = '#91a391';
  ctx.font = '500 14px monospace';
  ctx.fillText('FIELD BENCH  /  SAVAR · DHAKA', 42, 1268);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeModuleTexture(title: string, subtitle: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 420;
  canvas.height = 260;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas module texture is unavailable');
  ctx.fillStyle = '#0d1b13'; ctx.fillRect(0, 0, 420, 260);
  ctx.strokeStyle = 'rgba(205,255,105,.16)'; ctx.strokeRect(10, 10, 400, 240);
  ctx.fillStyle = '#cfff69'; ctx.fillRect(28, 34, 30, 3);
  ctx.fillStyle = '#eaf0e5'; ctx.font = '600 27px sans-serif'; ctx.fillText(title, 28, 103);
  ctx.fillStyle = '#b2c3b2'; ctx.font = '500 15px monospace'; ctx.fillText(subtitle, 28, 143);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i === 0 ? '#62dbb2' : '#294133';
    ctx.fillRect(28 + i * 33, 190, 19, 6);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class WorkbenchScene {
  private host: HTMLDivElement;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  private renderer: THREE.WebGLRenderer;
  private assembly = new THREE.Group();
  private phone = new THREE.Group();
  private resizeObserver: ResizeObserver;
  private frame = 0;
  private clock = new THREE.Clock();
  private paused: boolean;
  private disposed = false;
  private pointerX = 0;
  private pointerY = 0;
  private targetX = 0;
  private targetY = 0;
  private lastRender = 0;
  private motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  constructor(host: HTMLDivElement, paused: boolean) {
    this.host = host;
    this.paused = paused || this.motionQuery.matches;
    const compact = host.clientWidth < 780;
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !compact, powerPreference: 'default', stencil: false, depth: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.2 : 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.16;
    this.renderer.shadowMap.enabled = !compact;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = 'workbench-canvas';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.renderer.domElement.setAttribute('role', 'presentation');
    host.appendChild(this.renderer.domElement);

    this.scene.background = null;
    this.scene.fog = new THREE.FogExp2(PALETTE.void, compact ? 0.035 : 0.025);
    this.scene.add(new THREE.HemisphereLight(0xbce5c7, 0x07100b, 1.55));
    const key = new THREE.DirectionalLight(0xe7f4df, compact ? 2.2 : 2.8);
    key.position.set(-4.5, 9, 9); key.castShadow = !compact; key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -9; key.shadow.camera.right = 9; key.shadow.camera.top = 9; key.shadow.camera.bottom = -9;
    this.scene.add(key);
    const mint = new THREE.PointLight(PALETTE.mint, 18, 19, 2);
    mint.position.set(5, 3, 3); this.scene.add(mint);
    const lime = new THREE.PointLight(PALETTE.lime, 11, 15, 2);
    lime.position.set(-4, 0, 4); this.scene.add(lime);

    this.buildWorkbench(compact);
    this.scene.add(this.assembly);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.host.addEventListener('pointermove', this.onPointerMove, { passive: true });
    this.host.addEventListener('pointerleave', this.onPointerLeave, { passive: true });
    this.motionQuery.addEventListener('change', this.onMotionPreference);
    this.resize();
    this.drawStatic();
    if (!this.paused) this.start();
  }

  private buildWorkbench(compact: boolean) {
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(9.4, 0.28, 7.5),
      new THREE.MeshStandardMaterial({ color: PALETTE.board, metalness: 0.62, roughness: 0.4, emissive: 0x07140c, emissiveIntensity: 0.35 }),
    );
    board.position.set(1.0, -3.45, -0.15);
    board.castShadow = !compact; board.receiveShadow = !compact;
    this.assembly.add(board);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(9.55, 0.08, 7.64), new THREE.MeshStandardMaterial({ color: PALETTE.boardEdge, metalness: 0.78, roughness: 0.28 }));
    edge.position.set(1.0, -3.61, -0.15); this.assembly.add(edge);

    const traceMaterial = new THREE.LineBasicMaterial({ color: PALETTE.mint, transparent: true, opacity: 0.43 });
    const traces: Array<Array<[number, number]>> = [
      [[-3.25, -2.55], [-1.95, -2.55], [-1.48, -1.95], [-0.2, -1.95]],
      [[-3.1, 1.9], [-1.98, 1.9], [-1.45, 1.15], [-0.1, 1.15]],
      [[4.0, -2.2], [3.15, -2.2], [2.62, -1.62], [1.9, -1.62]],
      [[4.0, 2.15], [3.06, 2.15], [2.64, 1.62], [1.9, 1.62]],
      [[-3.2, 0.05], [-2.45, 0.05], [-2.14, -0.42], [-1.88, -0.42]],
      [[4.0, -0.05], [3.42, -0.05], [3.02, 0.38], [2.45, 0.38]],
    ];
    traces.forEach(points => {
      const geometry = new THREE.BufferGeometry().setFromPoints(points.map(([x, z]) => new THREE.Vector3(x, -3.28, z)));
      this.assembly.add(new THREE.Line(geometry, traceMaterial));
    });

    const moduleInfo = [
      { x: -3.05, z: -2.12, title: 'LINUX', subtitle: 'TERMUX / ARM64' },
      { x: -3.05, z: 2.05, title: 'OPERATIONS', subtitle: 'RECORDS / DELIVERY' },
      { x: 4.2, z: -2.05, title: 'LOCAL AI', subtitle: 'CPU / DEVICE-TESTED' },
      { x: 4.2, z: 2.08, title: 'SOFTWARE', subtitle: 'TOOLS / WORKFLOWS' },
    ];
    moduleInfo.forEach((item, index) => {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 1.36), new THREE.MeshStandardMaterial({ color: 0x16241b, metalness: 0.67, roughness: 0.35 }));
      slab.position.set(item.x, -3.19, item.z); slab.castShadow = !compact; slab.receiveShadow = !compact; this.assembly.add(slab);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.98), new THREE.MeshBasicMaterial({ map: makeModuleTexture(item.title, item.subtitle), toneMapped: false, side: THREE.DoubleSide }));
      screen.rotation.x = -Math.PI / 2; screen.position.set(item.x, -3.055, item.z); this.assembly.add(screen);
      const indicator = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.035), new THREE.MeshBasicMaterial({ color: index % 2 ? PALETTE.mint : PALETTE.lime }));
      indicator.position.set(item.x + 0.66, -3.045, item.z - 0.37); this.assembly.add(indicator);
    });

    const phoneBody = roundedPanel(3.55, 6.65, 0.38, 0.39, new THREE.MeshStandardMaterial({ color: 0x111b15, metalness: 0.84, roughness: 0.24 }));
    phoneBody.castShadow = !compact; phoneBody.receiveShadow = !compact; this.phone.add(phoneBody);
    const backInset = roundedPanel(3.38, 6.46, 0.08, 0.32, new THREE.MeshStandardMaterial({ color: PALETTE.metal, metalness: 0.78, roughness: 0.34 }));
    backInset.position.z = 0.22; this.phone.add(backInset);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(3.14, 6.22),
      new THREE.MeshBasicMaterial({ map: makeDisplayTexture(), toneMapped: false, side: THREE.DoubleSide }),
    );
    screen.position.z = 0.273; screen.renderOrder = 3; this.phone.add(screen);
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.065, 0.03), new THREE.MeshStandardMaterial({ color: 0x172019, metalness: 0.58, roughness: 0.31 }));
    ear.position.set(0, 3.14, 0.28); this.phone.add(ear);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.043, 18), new THREE.MeshBasicMaterial({ color: PALETTE.mint }));
    lens.position.set(0.44, 3.13, 0.298); this.phone.add(lens);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 1.1, 0.06), new THREE.MeshStandardMaterial({ color: PALETTE.metalLight, metalness: 0.84, roughness: 0.25 }));
    rail.position.set(1.81, 0.75, 0.01); this.phone.add(rail);
    this.phone.position.set(0.9, -0.05, 0.18);
    this.phone.rotation.set(0.08, -0.2, -0.035);
    this.assembly.add(this.phone);

    const stand = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.56, 1.15), new THREE.MeshStandardMaterial({ color: 0x25332a, metalness: 0.77, roughness: 0.3 }));
    stand.position.set(0.95, -3.02, 0.4); stand.castShadow = !compact; this.assembly.add(stand);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.12, 2.0), new THREE.MeshStandardMaterial({ color: 0x4b6250, metalness: 0.82, roughness: 0.28 }));
    foot.position.set(0.95, -3.31, 0.5); this.assembly.add(foot);

    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x6a8a70, transparent: true, opacity: 0.11 });
    for (let i = -4; i <= 6; i++) {
      const vertical = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i, -3.24, -3.3), new THREE.Vector3(i, -3.24, 3.1)]);
      this.assembly.add(new THREE.Line(vertical, gridMaterial));
    }
    for (let i = -3; i <= 3; i++) {
      const horizontal = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-3.55, -3.24, i), new THREE.Vector3(5.55, -3.24, i)]);
      this.assembly.add(new THREE.Line(horizontal, gridMaterial));
    }
  }

  private onPointerMove = (event: PointerEvent) => {
    const bounds = this.host.getBoundingClientRect();
    this.targetX = (event.clientX - bounds.left) / bounds.width - 0.5;
    this.targetY = (event.clientY - bounds.top) / bounds.height - 0.5;
  };
  private onPointerLeave = () => { this.targetX = 0; this.targetY = 0; };
  private onMotionPreference = (event: MediaQueryListEvent) => this.setPaused(event.matches);

  private resize() {
    if (this.disposed) return;
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    const portrait = width < height;
    this.camera.aspect = width / height;
    this.camera.fov = portrait ? 37 : 34;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    if (portrait) {
      this.camera.position.set(0.7, 1.35, 13.9);
      this.camera.lookAt(0.8, 0.82, 0);
      this.assembly.position.set(0.05, -0.13, 0);
      this.assembly.scale.setScalar(1.0);
    } else {
      this.camera.position.set(7.2, 3.1, 13.6);
      this.camera.lookAt(1.1, -0.12, 0);
      this.assembly.position.set(1.4, 0, 0);
      this.assembly.scale.setScalar(1.0);
    }
    this.drawStatic();
  }

  setPaused(paused: boolean) {
    this.paused = paused || this.motionQuery.matches;
    if (this.paused) this.stop();
    else this.start();
    this.drawStatic();
  }

  private drawStatic() {
    if (this.disposed || !this.renderer) return;
    this.renderer.render(this.scene, this.camera);
  }

  private animate = () => {
    if (this.disposed || this.paused || document.hidden) return;
    this.frame = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const easing = 1 - Math.exp(-2.6 * delta);
    this.pointerX = THREE.MathUtils.lerp(this.pointerX, this.targetX, easing);
    this.pointerY = THREE.MathUtils.lerp(this.pointerY, this.targetY, easing);
    this.assembly.rotation.y = Math.sin(this.clock.elapsedTime * 0.11) * 0.018 + this.pointerX * 0.055;
    this.assembly.rotation.x = -this.pointerY * 0.025;
    this.phone.rotation.y = -0.2 + Math.sin(this.clock.elapsedTime * 0.19) * 0.025;
    if (this.clock.elapsedTime - this.lastRender >= 1 / 30) {
      this.renderer.render(this.scene, this.camera);
      this.lastRender = this.clock.elapsedTime;
    }
  };

  private start() {
    if (this.disposed || this.paused || document.hidden || this.frame) return;
    this.clock.start();
    this.frame = requestAnimationFrame(this.animate);
  }
  private stop() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    this.resizeObserver.disconnect();
    this.host.removeEventListener('pointermove', this.onPointerMove);
    this.host.removeEventListener('pointerleave', this.onPointerLeave);
    this.motionQuery.removeEventListener('change', this.onMotionPreference);
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => { if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose(); material.dispose(); });
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
