import * as THREE from 'three';

const PALETTE = {
  void: 0x07100c,
  board: 0x13261b,
  boardEdge: 0x45574a,
  darkMetal: 0x17251c,
  metal: 0x718574,
  silver: 0xc5d1c3,
  lime: 0xcfff69,
  mint: 0x62dbb2,
  ink: 0x102018,
  paper: 0xe3eadb,
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
  const bevel = Math.min(0.07, depth * 0.2);
  const geometry = new THREE.ExtrudeGeometry(roundedShape(width, height, radius), {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: 12,
  });
  geometry.translate(0, 0, -depth / 2);
  return new THREE.Mesh(geometry, material);
}

function textureFromCanvas(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makePhoneScreen() {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1800;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas display texture is unavailable');

  const bg = ctx.createLinearGradient(0, 0, 900, 1800);
  bg.addColorStop(0, '#edf1e5');
  bg.addColorStop(0.66, '#d9e5d4');
  bg.addColorStop(1, '#c6d8c8');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#10241a';
  ctx.fillRect(0, 0, 900, 340);
  ctx.fillStyle = '#cfff69';
  ctx.fillRect(72, 76, 65, 6);
  ctx.fillStyle = '#f2f5eb';
  ctx.font = '600 31px monospace';
  ctx.fillText('SOBUJ MIAH  /  FIELD WORKBENCH', 72, 137);
  ctx.fillStyle = '#a8beb0';
  ctx.font = '500 22px monospace';
  ctx.fillText('SOFTWARE  ·  ANDROID  ·  OPERATIONS', 72, 184);

  const cards = [
    { y: 410, n: '01', title: 'OPERATIONS', sub: 'Records · coordination · delivery', accent: '#426f54' },
    { y: 690, n: '02', title: 'LINUX / ARM64', sub: 'Native tools · reproducible builds', accent: '#548a70' },
    { y: 970, n: '03', title: 'LOCAL AI', sub: 'CPU baseline · device evidence', accent: '#779447' },
    { y: 1250, n: '04', title: 'SOFTWARE', sub: 'Useful tools · careful workflows', accent: '#477b73' },
  ];
  for (const item of cards) {
    ctx.fillStyle = '#f7f8f2';
    ctx.beginPath(); ctx.roundRect(60, item.y, 780, 226, 26); ctx.fill();
    ctx.fillStyle = item.accent;
    ctx.fillRect(60, item.y, 9, 226);
    ctx.fillStyle = '#738277';
    ctx.font = '600 21px monospace';
    ctx.fillText(item.n, 100, item.y + 53);
    ctx.fillStyle = '#12231a';
    ctx.font = '600 38px sans-serif';
    ctx.fillText(item.title, 100, item.y + 112);
    ctx.fillStyle = '#657367';
    ctx.font = '24px sans-serif';
    ctx.fillText(item.sub, 100, item.y + 166);
    ctx.fillStyle = item.accent;
    ctx.beginPath(); ctx.arc(790, item.y + 42, 9, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#47594a';
  ctx.font = '500 19px monospace';
  ctx.fillText('SAVAR · DHAKA  /  EVIDENCE BEFORE CLAIMS', 72, 1694);
  return textureFromCanvas(canvas);
}

function makeModuleTexture(title: string, subtitle: string, index: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 560;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas module texture is unavailable');
  ctx.fillStyle = '#e3eadb'; ctx.fillRect(0, 0, 560, 360);
  ctx.fillStyle = '#22362a'; ctx.fillRect(0, 0, 560, 17);
  ctx.fillStyle = '#628a63'; ctx.fillRect(34, 49, 54, 5);
  ctx.fillStyle = '#5e6e5f'; ctx.font = '500 21px monospace'; ctx.fillText(`FIELD MODULE  /  ${index}`, 34, 100);
  ctx.fillStyle = '#102018'; ctx.font = '600 37px sans-serif'; ctx.fillText(title, 34, 171);
  ctx.fillStyle = '#58695b'; ctx.font = '22px monospace'; ctx.fillText(subtitle, 34, 224);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i === 0 ? '#b5dc62' : '#aab9aa';
    ctx.beginPath(); ctx.roundRect(34 + i * 42, 277, 27, 8, 4); ctx.fill();
  }
  return textureFromCanvas(canvas);
}

function makeCable(points: THREE.Vector3[], material: THREE.Material) {
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, Math.max(16, points.length * 8), 0.025, 6, false);
  return new THREE.Mesh(geometry, material);
}

function setShadow(mesh: THREE.Mesh, enabled: boolean) {
  mesh.castShadow = enabled;
  mesh.receiveShadow = enabled;
  return mesh;
}

export class WorkbenchScene {
  private host: HTMLDivElement;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
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

  constructor(host: HTMLDivElement, paused: boolean) {
    this.host = host;
    this.paused = paused;
    const compact = host.clientWidth < 780;
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !compact, powerPreference: 'default', stencil: false, depth: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.2 : 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.14;
    this.renderer.shadowMap.enabled = !compact;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = 'workbench-canvas';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.renderer.domElement.setAttribute('role', 'presentation');
    host.appendChild(this.renderer.domElement);

    this.scene.background = null;
    this.scene.fog = new THREE.FogExp2(PALETTE.void, compact ? 0.018 : 0.014);
    this.scene.add(new THREE.HemisphereLight(0xe1f0df, 0x213326, 1.85));
    const key = new THREE.DirectionalLight(0xfff4db, compact ? 3.1 : 3.8);
    key.position.set(-6, 9, 10); key.castShadow = !compact; key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -9; key.shadow.camera.right = 9; key.shadow.camera.top = 9; key.shadow.camera.bottom = -9;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x80d9ae, 2.3);
    rim.position.set(8, 4, -7); this.scene.add(rim);
    const fill = new THREE.PointLight(PALETTE.lime, 22, 20, 2);
    fill.position.set(-5, 1, 6); this.scene.add(fill);
    const bounce = new THREE.PointLight(PALETTE.mint, 17, 18, 2);
    bounce.position.set(5, 1, 5); this.scene.add(bounce);

    this.buildWorkbench(compact);
    this.scene.add(this.assembly);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.host.addEventListener('pointermove', this.onPointerMove, { passive: true });
    this.host.addEventListener('pointerleave', this.onPointerLeave, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.resize();
    this.drawStatic();
    if (!this.paused) this.start();
  }

  private buildWorkbench(compact: boolean) {
    const shadowed = (mesh: THREE.Mesh) => setShadow(mesh, !compact);
    const plinth = shadowed(new THREE.Mesh(
      new THREE.BoxGeometry(11.4, 0.22, 8.5),
      new THREE.MeshStandardMaterial({ color: PALETTE.board, metalness: 0.68, roughness: 0.31, emissive: 0x17271b, emissiveIntensity: 0.28 }),
    ));
    plinth.position.set(0.4, -3.35, -0.1); this.assembly.add(plinth);
    const lowerLip = shadowed(new THREE.Mesh(
      new THREE.BoxGeometry(11.55, 0.13, 8.65),
      new THREE.MeshStandardMaterial({ color: PALETTE.boardEdge, metalness: 0.8, roughness: 0.24, emissive: 0x122019, emissiveIntensity: 0.18 }),
    ));
    lowerLip.position.set(0.4, -3.51, -0.1); this.assembly.add(lowerLip);
    const surface = new THREE.Mesh(
      new THREE.BoxGeometry(11.12, 0.035, 8.22),
      new THREE.MeshStandardMaterial({ color: 0x20382a, metalness: 0.37, roughness: 0.55, emissive: 0x15261b, emissiveIntensity: 0.22 }),
    );
    surface.position.set(0.4, -3.22, -0.1); surface.receiveShadow = !compact; this.assembly.add(surface);

    const railMaterial = new THREE.MeshStandardMaterial({ color: PALETTE.silver, metalness: 0.82, roughness: 0.25, emissive: 0x25362a, emissiveIntensity: 0.12 });
    for (const z of [-4.18, 3.98]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(10.45, 0.07, 0.08), railMaterial);
      rail.position.set(0.4, -3.18, z); this.assembly.add(rail);
    }
    for (const x of [-5.0, 5.8]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 7.7), railMaterial);
      rail.position.set(x, -3.18, -0.1); this.assembly.add(rail);
    }

    const traceMaterial = new THREE.MeshStandardMaterial({ color: PALETTE.mint, emissive: PALETTE.mint, emissiveIntensity: 0.48, metalness: 0.44, roughness: 0.28 });
    const routes = [
      [[-3.15, -3.15, -2.55], [-2.25, -3.15, -2.55], [-1.68, -3.15, -1.98], [-0.1, -3.15, -1.98]],
      [[-3.25, -3.15, 2.35], [-2.28, -3.15, 2.35], [-1.72, -3.15, 1.82], [-0.12, -3.15, 1.82]],
      [[3.75, -3.15, -2.5], [2.9, -3.15, -2.5], [2.34, -3.15, -1.9], [1.48, -3.15, -1.9]],
      [[3.85, -3.15, 2.4], [2.95, -3.15, 2.4], [2.42, -3.15, 1.82], [1.45, -3.15, 1.82]],
    ];
    routes.forEach(route => this.assembly.add(makeCable(route.map(point => new THREE.Vector3(...point as [number, number, number])), traceMaterial)));

    const moduleInfo = [
      { x: -3.5, z: -2.55, title: 'LINUX / ARM64', subtitle: 'TERMUX · TOOLCHAINS', index: '01' },
      { x: -3.5, z: 2.42, title: 'OPERATIONS', subtitle: 'RECORDS · DELIVERY', index: '02' },
      { x: 4.25, z: -2.52, title: 'LOCAL AI', subtitle: 'CPU · VERIFIED PATH', index: '03' },
      { x: 4.25, z: 2.48, title: 'SOFTWARE', subtitle: 'TOOLS · WORKFLOWS', index: '04' },
    ];
    moduleInfo.forEach((item, index) => {
      const card = shadowed(roundedPanel(2.1, 1.48, 0.2, 0.16, new THREE.MeshStandardMaterial({ color: PALETTE.metal, metalness: 0.58, roughness: 0.32 })));
      card.position.set(item.x, -2.18, item.z); this.assembly.add(card);
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(1.92, 1.3),
        new THREE.MeshBasicMaterial({ map: makeModuleTexture(item.title, item.subtitle, item.index), toneMapped: false, side: THREE.DoubleSide }),
      );
      // Keep the display decal clearly in front of the extruded/bevelled housing.
      // A tiny offset caused the labels to disappear against the case at oblique camera angles.
      face.position.set(item.x, -2.18, item.z + 0.19); face.renderOrder = 10; this.assembly.add(face);
      const postMaterial = new THREE.MeshStandardMaterial({ color: 0x657766, metalness: 0.83, roughness: 0.27 });
      for (const dx of [-0.63, 0.63]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 0.93, 8), postMaterial);
        post.position.set(item.x + dx, -2.85, item.z); post.castShadow = !compact; this.assembly.add(post);
      }
      const indicator = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 12, 8),
        new THREE.MeshBasicMaterial({ color: index % 2 ? PALETTE.mint : PALETTE.lime }),
      );
      indicator.position.set(item.x + 0.77, -1.61, item.z + 0.125); this.assembly.add(indicator);
    });

    const standBase = shadowed(new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.16, 2.3),
      new THREE.MeshStandardMaterial({ color: 0x728477, metalness: 0.84, roughness: 0.23 }),
    ));
    standBase.position.set(0.35, -3.18, 0.42); this.assembly.add(standBase);
    const foot = shadowed(new THREE.Mesh(
      new THREE.BoxGeometry(2.45, 0.16, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xb3c1b0, metalness: 0.78, roughness: 0.28 }),
    ));
    foot.position.set(0.35, -3.03, 0.56); this.assembly.add(foot);
    const brace = shadowed(new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 0.18, 0.32),
      new THREE.MeshStandardMaterial({ color: 0x586b5d, metalness: 0.79, roughness: 0.29 }),
    ));
    brace.position.set(0.35, -1.73, -0.46); brace.rotation.x = -0.18; this.assembly.add(brace);
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.26, 18), railMaterial);
    hinge.rotation.z = Math.PI / 2; hinge.position.set(0.35, -2.78, -0.36); this.assembly.add(hinge);

    const body = shadowed(roundedPanel(3.42, 6.02, 0.44, 0.38, new THREE.MeshStandardMaterial({ color: 0x536458, metalness: 0.88, roughness: 0.21 })));
    this.phone.add(body);
    const back = shadowed(roundedPanel(3.24, 5.84, 0.08, 0.32, new THREE.MeshStandardMaterial({ color: 0x24392a, metalness: 0.75, roughness: 0.27 })));
    back.position.z = 0.23; this.phone.add(back);
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(3.03, 5.66),
      new THREE.MeshBasicMaterial({ map: makePhoneScreen(), toneMapped: false, side: THREE.DoubleSide }),
    );
    glass.position.z = 0.292; glass.renderOrder = 3; this.phone.add(glass);
    const earpiece = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.052, 0.04), new THREE.MeshStandardMaterial({ color: 0x142119, metalness: 0.47, roughness: 0.32 }));
    earpiece.position.set(-0.15, 2.86, 0.31); this.phone.add(earpiece);
    const cameraLens = new THREE.Mesh(new THREE.CircleGeometry(0.055, 20), new THREE.MeshBasicMaterial({ color: PALETTE.mint }));
    cameraLens.position.set(0.42, 2.86, 0.319); this.phone.add(cameraLens);
    const sideButton = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.76, 0.09), new THREE.MeshStandardMaterial({ color: PALETTE.silver, metalness: 0.91, roughness: 0.19 }));
    sideButton.position.set(1.73, 0.62, 0.02); this.phone.add(sideButton);
    const bottomPort = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.07, 0.09), new THREE.MeshStandardMaterial({ color: 0x0b100c, metalness: 0.62, roughness: 0.3 }));
    bottomPort.position.set(0.2, -2.91, 0.02); this.phone.add(bottomPort);
    this.phone.position.set(0.35, -0.02, 0.57);
    this.phone.rotation.set(-0.11, 0.38, -0.085);
    this.assembly.add(this.phone);

    const feetMaterial = new THREE.MeshStandardMaterial({ color: 0x718274, metalness: 0.85, roughness: 0.23 });
    for (const x of [-4.2, 4.95]) {
      for (const z of [-3.1, 2.95]) {
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, 0.35, 10), feetMaterial);
        foot.position.set(x, -3.68, z); foot.castShadow = !compact; this.assembly.add(foot);
      }
    }

    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x8caa91 });
    for (let index = 0; index < 7; index++) {
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.018, 0.025), markerMaterial);
      mark.position.set(-4.6 + index * 0.5, -3.17, 3.79); this.assembly.add(mark);
    }
  }

  private onPointerMove = (event: PointerEvent) => {
    const bounds = this.host.getBoundingClientRect();
    this.targetX = (event.clientX - bounds.left) / bounds.width - 0.5;
    this.targetY = (event.clientY - bounds.top) / bounds.height - 0.5;
  };
  private onPointerLeave = () => { this.targetX = 0; this.targetY = 0; };
  private onVisibilityChange = () => {
    if (document.hidden) this.stop();
    else if (!this.paused) this.start();
  };

  private resize() {
    if (this.disposed) return;
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    const portrait = width / height < 0.9;
    this.camera.aspect = width / height;
    this.camera.fov = portrait ? 43 : 37;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    if (portrait) {
      this.camera.position.set(6.35, 5.9, 14.5);
      this.camera.lookAt(0.38, -0.58, 0);
      this.assembly.position.set(0.02, 0.22, 0);
      this.assembly.scale.setScalar(0.98);
    } else {
      this.camera.position.set(7.8, 5.1, 14.2);
      this.camera.lookAt(0.75, -0.24, 0);
      this.assembly.position.set(1.15, 0.1, 0);
      this.assembly.scale.setScalar(1.02);
    }
    this.drawStatic();
  }

  setPaused(paused: boolean) {
    this.paused = paused;
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
    const easing = 1 - Math.exp(-2.4 * delta);
    this.pointerX = THREE.MathUtils.lerp(this.pointerX, this.targetX, easing);
    this.pointerY = THREE.MathUtils.lerp(this.pointerY, this.targetY, easing);
    this.assembly.rotation.y = Math.sin(this.clock.elapsedTime * 0.22) * 0.085 + this.pointerX * 0.05;
    this.assembly.rotation.x = Math.sin(this.clock.elapsedTime * 0.16) * 0.035 - this.pointerY * 0.024;
    this.assembly.position.y = (this.host.clientWidth / Math.max(this.host.clientHeight, 1) < 0.9 ? 0.22 : 0.1) + Math.sin(this.clock.elapsedTime * 0.55) * 0.14;
    this.phone.rotation.y = 0.38 + Math.sin(this.clock.elapsedTime * 0.31) * 0.1;
    this.phone.rotation.z = -0.085 + this.pointerX * 0.012 + Math.sin(this.clock.elapsedTime * 0.24) * 0.025;
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
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => {
          if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose();
          material.dispose();
        });
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
