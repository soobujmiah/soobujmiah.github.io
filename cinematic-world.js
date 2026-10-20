(() => {
  const canvas = document.getElementById('cinematic-world');
  if (!canvas) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileDevice = window.innerWidth < 700;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const lowMemory = Boolean(navigator.deviceMemory && navigator.deviceMemory <= 2);
  const constrainedDevice = saveData || lowMemory || mobileDevice;

  // Paint the authored CSS field scene immediately. It stays useful on devices
  // without WebGL, and fades only after the 3D scene has actually initialized.
  document.body.classList.add('world-fallback');

  const stageNames = ['opening', 'notes', 'workstation', 'systems', 'practice', 'knowledge', 'experience', 'capabilities', 'closing'];
  const stageSections = Array.from(document.querySelectorAll('[data-world-stage]'));
  const route = document.querySelector('.world-route');
  const routeTitle = document.getElementById('world-route-title');
  const routeTitles = [
    { en: '01 — ARRIVAL', bn: '০১ — পরিচয়' },
    { en: '02 — FIELD NOTES', bn: '০২ — ফিল্ড নোট' },
    { en: '03 — MOBILE WORKSTATION', bn: '০৩ — মোবাইল কর্মপরিবেশ' },
    { en: '04 — SELECTED SYSTEMS', bn: '০৪ — বাছাই করা সিস্টেম' },
    { en: '05 — ENGINEERING PRACTICE', bn: '০৫ — প্রকৌশলচর্চা' },
    { en: '06 — LIVING KNOWLEDGE', bn: '০৬ — জীবন্ত জ্ঞান' },
    { en: '07 — EXPERIENCE', bn: '০৭ — অভিজ্ঞতা' },
    { en: '08 — CAPABILITIES', bn: '০৮ — সক্ষমতা' },
    { en: '09 — CONTACT', bn: '০৯ — যোগাযোগ' }
  ];
  let targetStage = 0;
  let displayedRoute = -1;

  function updateRoute() {
    if (!route || !routeTitle) return;
    const next = Math.max(0, Math.min(routeTitles.length - 1, Math.round(targetStage)));
    if (next === displayedRoute) return;
    displayedRoute = next;
    const language = document.body.classList.contains('lang-bn') ? 'bn' : 'en';
    routeTitle.textContent = routeTitles[next][language];
    route.querySelector('.world-route-index').textContent = `${String(next + 1).padStart(2, '0')} / ${String(routeTitles.length).padStart(2, '0')}`;
    route.querySelectorAll('.world-route-markers i').forEach((marker, index) => marker.classList.toggle('is-active', index === next));
  }

  function updateTargetStage() {
    const middle = window.innerHeight * 0.52;
    let bestDistance = Infinity;
    let bestIndex = 0;
    stageSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const index = stageNames.indexOf(section.dataset.worldStage);
      if (index < 0) return;
      if (rect.top <= middle && rect.bottom >= middle) {
        bestIndex = index;
        bestDistance = 0;
        return;
      }
      const distance = Math.min(Math.abs(rect.top - middle), Math.abs(rect.bottom - middle));
      if (distance < bestDistance) { bestDistance = distance; bestIndex = index; }
    });
    targetStage = bestIndex;
    document.body.dataset.worldStage = stageNames[bestIndex];
    const travel = bestIndex - (stageNames.length - 1) / 2;
    document.body.style.setProperty('--fallback-x', `${travel * -1.5}vw`);
    document.body.style.setProperty('--fallback-y', `${Math.abs(travel) * -0.45}vh`);
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = window.scrollY / scrollable;
    document.body.style.setProperty('--journey-progress', `${progress}`);
    document.body.style.setProperty('--journey-x', `${progress * -4}vw`);
    document.body.style.setProperty('--journey-phone-x', `${progress * -7}vw`);
    document.body.style.setProperty('--journey-y', `${progress * -2}vh`);
    document.body.style.setProperty('--journey-phone-y', `${progress * 3}vh`);
    document.body.style.setProperty('--journey-rotate', `${progress * 8}deg`);
    document.body.style.setProperty('--journey-phone-rotate', `${progress * 28}deg`);
    updateRoute();
  }
  window.addEventListener('scroll', updateTargetStage, { passive: true });
  window.addEventListener('resize', updateTargetStage, { passive: true });
  window.addEventListener('portfolio:language-change', updateRoute);
  updateTargetStage();

  const schedule = window.requestIdleCallback || ((fn) => window.setTimeout(fn, 900));
  schedule(() => loadWorld().catch(() => {
    document.body.classList.remove('has-world');
    document.body.classList.add('world-fallback');
    canvas.hidden = true;
  }), { timeout: 1800 });

  async function loadWorld() {
    const THREE = await import('./vendor/three.module.js');
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
      stencil: false,
      depth: true
    });
    canvas.hidden = false;
    renderer.setClearColor(0x000000, 0);
    const renderScale = saveData ? 0.8 : lowMemory ? 0.9 : mobileDevice ? 1.18 : 1.35;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, renderScale));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x081810, 0.018);
    // Wider mobile framing leaves a clear visual lane beside the hero copy.
    const camera = new THREE.PerspectiveCamera(mobileDevice ? 61 : 39, window.innerWidth / window.innerHeight, 0.1, 80);
    camera.position.set(0, 3.1, 10.8);

    scene.add(new THREE.HemisphereLight(0xdcebd0, 0x07130f, 1.6));
    const keyLight = new THREE.DirectionalLight(0xbad59e, 2.2);
    keyLight.position.set(-4, 8, 5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x71b47b, 24, 18, 2);
    rimLight.position.set(3, 3.5, -2);
    scene.add(rimLight);

    const world = new THREE.Group();
    scene.add(world);

    function groundHeight(x, z) {
      return 0.23 * Math.sin(x * 0.38 + z * 0.15)
        + 0.16 * Math.cos(z * 0.43 - x * 0.22)
        + 0.08 * Math.sin((x + z) * 0.75)
        - 0.13;
    }

    const terrainWidth = constrainedDevice ? 52 : 90;
    const terrainDepth = constrainedDevice ? 62 : 100;
    const terrainSizeX = 20;
    // Give the camera a real route through the portfolio instead of reframing
    // one isolated hero scene.
    const terrainSizeZ = 150;
    const positions = [];
    const colors = [];
    const indices = [];
    let minHeight = Infinity;
    let maxHeight = -Infinity;
    for (let z = 0; z <= terrainDepth; z++) {
      for (let x = 0; x <= terrainWidth; x++) {
        const px = (x / terrainWidth - 0.5) * terrainSizeX;
        const pz = (z / terrainDepth - 0.5) * terrainSizeZ;
        const py = groundHeight(px, pz);
        positions.push(px, py, pz);
        minHeight = Math.min(minHeight, py);
        maxHeight = Math.max(maxHeight, py);
      }
    }
    for (let z = 0; z < terrainDepth; z++) {
      for (let x = 0; x < terrainWidth; x++) {
        const a = z * (terrainWidth + 1) + x;
        const b = a + 1;
        const c = a + terrainWidth + 1;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
    const low = new THREE.Color('#10271c');
    const middle = new THREE.Color('#254834');
    const high = new THREE.Color('#526b49');
    for (let i = 1; i < positions.length; i += 3) {
      const t = (positions[i] - minHeight) / (maxHeight - minHeight);
      const shade = t < 0.58
        ? low.clone().lerp(middle, t / 0.58)
        : middle.clone().lerp(high, (t - 0.58) / 0.42);
      colors.push(shade.r, shade.g, shade.b);
    }
    const terrainGeometry = new THREE.BufferGeometry();
    terrainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    terrainGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    terrainGeometry.setIndex(indices);
    terrainGeometry.computeVertexNormals();
    const terrain = new THREE.Mesh(terrainGeometry, new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.94,
      metalness: 0.04,
      transparent: true,
      opacity: 0.91
    }));
    terrain.position.y = -0.18;
    world.add(terrain);

    // Isolines are sampled from the terrain itself, giving the field-map its depth cues.
    const contourPoints = [];
    const contourCount = constrainedDevice ? 8 : 14;
    const sample = (x, z) => groundHeight((x / terrainWidth - 0.5) * terrainSizeX, (z / terrainDepth - 0.5) * terrainSizeZ);
    for (let levelIndex = 1; levelIndex <= contourCount; levelIndex++) {
      const level = minHeight + (maxHeight - minHeight) * levelIndex / (contourCount + 1);
      for (let z = 0; z < terrainDepth; z += 1) {
        for (let x = 0; x < terrainWidth; x += 1) {
          const x0 = (x / terrainWidth - 0.5) * terrainSizeX;
          const x1 = ((x + 1) / terrainWidth - 0.5) * terrainSizeX;
          const z0 = (z / terrainDepth - 0.5) * terrainSizeZ;
          const z1 = ((z + 1) / terrainDepth - 0.5) * terrainSizeZ;
          const values = [sample(x, z), sample(x + 1, z), sample(x + 1, z + 1), sample(x, z + 1)];
          const corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
          const crossings = [];
          for (let edge = 0; edge < 4; edge++) {
            const next = (edge + 1) % 4;
            const va = values[edge] - level;
            const vb = values[next] - level;
            if ((va < 0 && vb >= 0) || (vb < 0 && va >= 0)) {
              const t = va / (va - vb);
              crossings.push([
                THREE.MathUtils.lerp(corners[edge][0], corners[next][0], t),
                THREE.MathUtils.lerp(corners[edge][1], corners[next][1], t)
              ]);
            }
          }
          for (let p = 0; p + 1 < crossings.length; p += 2) {
            const a = crossings[p];
            const b = crossings[p + 1];
            contourPoints.push(a[0], groundHeight(a[0], a[1]) - 0.155, a[1], b[0], groundHeight(b[0], b[1]) - 0.155, b[1]);
          }
        }
      }
    }
    const contourGeometry = new THREE.BufferGeometry();
    contourGeometry.setAttribute('position', new THREE.Float32BufferAttribute(contourPoints, 3));
    const contourMaterial = new THREE.LineBasicMaterial({ color: 0xa9bd92, transparent: true, opacity: 0.39 });
    const contours = new THREE.LineSegments(contourGeometry, contourMaterial);
    world.add(contours);

    function makeCanvasTexture(draw, width = 512, height = 1024) {
      const surface = document.createElement('canvas');
      surface.width = width;
      surface.height = height;
      const context = surface.getContext('2d');
      draw(context, width, height);
      const texture = new THREE.CanvasTexture(surface);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return texture;
    }

    const phoneScreen = makeCanvasTexture((ctx, width, height) => {
      ctx.fillStyle = '#0b1c15';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#a9bd92';
      ctx.font = '20px monospace';
      ctx.fillText('TERMUX / WORKBENCH', 32, 58);
      ctx.strokeStyle = 'rgba(197,215,179,.23)';
      ctx.beginPath(); ctx.moveTo(32, 82); ctx.lineTo(width - 32, 82); ctx.stroke();
      ctx.fillStyle = '#e7eadb';
      ctx.font = '28px monospace';
      ctx.fillText('~/projects/adt', 32, 137);
      const rows = [
        ['01  PLAN', '#c5d7b3'], ['02  EDIT', '#c5d7b3'], ['03  REMOTE CI', '#8ea67d'],
        ['04  DEVICE TEST', '#c5d7b3'], ['05  VERIFY', '#c5d7b3'], ['06  RECORD', '#8ea67d']
      ];
      rows.forEach((row, index) => {
        const y = 220 + index * 76;
        ctx.fillStyle = row[1];
        ctx.font = '24px monospace';
        ctx.fillText(row[0], 38, y);
        ctx.fillStyle = 'rgba(169,189,146,.28)';
        ctx.fillRect(38, y + 18, width - 76, 2);
        ctx.fillStyle = 'rgba(169,189,146,.12)';
        ctx.fillRect(38, y + 30, width * (0.42 + index % 3 * 0.12), 8);
      });
      ctx.fillStyle = '#c5d7b3';
      ctx.font = '20px monospace';
      ctx.fillText('BUILD · TEST · LEARN', 32, height - 62);
    }, 512, 1024);

    function roundedRect(width, height, radius) {
      const shape = new THREE.Shape();
      const x = -width / 2;
      const y = -height / 2;
      shape.moveTo(x + radius, y);
      shape.lineTo(x + width - radius, y);
      shape.absarc(x + width - radius, y + radius, radius, -Math.PI / 2, 0, false);
      shape.lineTo(x + width, y + height - radius);
      shape.absarc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2, false);
      shape.lineTo(x + radius, y + height);
      shape.absarc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI, false);
      shape.lineTo(x, y + radius);
      shape.absarc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5, false);
      shape.closePath();
      return shape;
    }

    const phone = new THREE.Group();
    const frameGeometry = new THREE.ExtrudeGeometry(roundedRect(0.92, 1.8, 0.11), { depth: 0.12, bevelEnabled: true, bevelSegments: 5, steps: 1, bevelSize: 0.018, bevelThickness: 0.025, curveSegments: 10 });
    frameGeometry.translate(0, 0, -0.06);
    const frame = new THREE.Mesh(frameGeometry, new THREE.MeshStandardMaterial({ color: 0x18251d, roughness: 0.28, metalness: 0.72 }));
    phone.add(frame);
    const glass = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(0.82, 1.64, 0.075), 12), new THREE.MeshBasicMaterial({ color: 0x07120d }));
    glass.position.z = 0.067;
    phone.add(glass);
    const screen = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(0.78, 1.58, 0.065), 12), new THREE.MeshBasicMaterial({ map: phoneScreen }));
    screen.position.z = 0.069;
    phone.add(screen);
    const earpiece = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.025, 0.012), new THREE.MeshStandardMaterial({ color: 0x15271c, roughness: 0.4 }));
    earpiece.position.set(0, 0.83, 0.074);
    phone.add(earpiece);
    const cameraDot = new THREE.Mesh(new THREE.CircleGeometry(0.024, 12), new THREE.MeshBasicMaterial({ color: 0x71916f }));
    cameraDot.position.set(0.17, 0.83, 0.075);
    phone.add(cameraDot);
    const sideKey = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.25, 0.04), new THREE.MeshStandardMaterial({ color: 0x48624d, metalness: 0.5, roughness: 0.4 }));
    sideKey.position.set(0.47, 0.34, 0);
    phone.add(sideKey);
    phone.position.set(3.2, 1.2, 0.1);
    phone.rotation.set(0.04, -0.18, -0.045);
    world.add(phone);

    const noteCard = new THREE.Group();
    const noteTexture = makeCanvasTexture((ctx, width, height) => {
      ctx.fillStyle = '#d9dfc9'; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#344a37'; ctx.font = '24px monospace'; ctx.fillText('FIELD NOTE / 01', 34, 52);
      ctx.strokeStyle = 'rgba(43,70,48,.25)';
      for (let y = 100; y < height - 40; y += 42) { ctx.beginPath(); ctx.moveTo(32, y); ctx.lineTo(width - 30, y); ctx.stroke(); }
      ctx.fillStyle = '#243a2a'; ctx.font = 'bold 38px sans-serif';
      ctx.fillText('Observe', 34, 176); ctx.fillText('the work.', 34, 224);
      ctx.font = '22px monospace'; ctx.fillText('CONSTRAINT → TEST', 34, 296);
      ctx.beginPath(); ctx.arc(374, 386, 62, 0, Math.PI * 2); ctx.strokeStyle = '#718565'; ctx.lineWidth = 2; ctx.stroke();
    });
    const notePaper = new THREE.Mesh(new THREE.BoxGeometry(1.32, 1.68, 0.035), new THREE.MeshStandardMaterial({ map: noteTexture, roughness: 0.92, metalness: 0.01 }));
    noteCard.add(notePaper);
    noteCard.position.set(1.9, 1.15, 5.2);
    noteCard.rotation.set(0.1, 0.23, -0.08);
    world.add(noteCard);

    const nodePositions = mobileDevice
      ? [[-1.1, 0.08, -6], [-0.55, 0.12, -9], [0, 0.18, -12], [0.55, 0.08, -15], [1.1, 0.14, -18]]
      : [[-2.5, 0.08, -6], [-1.25, 0.12, -9], [0, 0.18, -12], [1.25, 0.08, -15], [2.5, 0.14, -18]];
    const projectNodes = new THREE.Group();
    const projectPoints = [];
    const projectColors = [0xa9bd92, 0x819d75, 0xc5d7b3, 0x79a77a, 0xd7dfc2];
    nodePositions.forEach((pos, i) => {
      const point = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.52, 5), new THREE.MeshBasicMaterial({ color: 0xa9bd92, transparent: true, opacity: 0.65 }));
      stem.position.y = 0.2;
      point.add(stem);
      const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), new THREE.MeshStandardMaterial({ color: projectColors[i], emissive: projectColors[i], emissiveIntensity: 0.32, roughness: 0.35 }));
      sphere.position.y = 0.52;
      point.add(sphere);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.008, 4, 32), new THREE.MeshBasicMaterial({ color: projectColors[i], transparent: true, opacity: 0.75 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.25;
      point.add(ring);
      point.position.set(pos[0], groundHeight(pos[0], pos[2]) - 0.11, pos[2]);
      projectNodes.add(point);
      projectPoints.push(point);
    });
    const networkPoints = [];
    for (let i = 0; i < nodePositions.length - 1; i++) {
      const a = nodePositions[i];
      const b = nodePositions[i + 1];
      networkPoints.push(new THREE.Vector3(a[0], groundHeight(a[0], a[2]) + 0.55, a[2]));
      networkPoints.push(new THREE.Vector3(b[0], groundHeight(b[0], b[2]) + 0.55, b[2]));
    }
    const networkGeo = new THREE.BufferGeometry().setFromPoints(networkPoints);
    const network = new THREE.LineSegments(networkGeo, new THREE.LineBasicMaterial({ color: 0xa9bd92, transparent: true, opacity: 0.7 }));
    projectNodes.add(network);
    projectNodes.visible = false;
    world.add(projectNodes);

    // Each selected system becomes a distinct physical artifact along the field route.
    const projectModels = [];
    const metal = new THREE.MeshStandardMaterial({ color: 0x68806a, roughness: 0.38, metalness: 0.66 });
    const paper = new THREE.MeshStandardMaterial({ color: 0xd0d8bf, roughness: 0.84, metalness: 0.02, side: THREE.DoubleSide });
    const glowMaterials = projectColors.map((color) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.42, roughness: 0.42, metalness: 0.16 }));
    const addBox = (group, size, position, material, rotation = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      group.add(mesh);
      return mesh;
    };
    const addLine = (group, points, color = 0xa9bd92, opacity = 0.86) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(...point)));
      const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      const line = new THREE.Line(geometry, material);
      group.add(line);
      return line;
    };
    nodePositions.forEach((pos, index) => {
      const artifact = new THREE.Group();
      const tint = glowMaterials[index];
      if (index === 0) {
        // Ternuxx: a small, open native terminal workstation.
        addBox(artifact, [1.7, 1.14, 0.12], [0, 1.02, 0], metal, [-0.08, -0.16, 0.02]);
        addBox(artifact, [1.52, 0.91, 0.018], [0, 1.03, 0.071], new THREE.MeshBasicMaterial({ map: phoneScreen }));
        addBox(artifact, [1.9, 0.1, 0.52], [0, 0.37, 0.03], metal);
        addLine(artifact, [[-0.67, 0.42, 0.3], [-0.67, 0.24, 0.3], [0.67, 0.24, 0.3]], 0xc5d7b3, 0.74);
      } else if (index === 1) {
        // Ternux: layered Linux ground forms above a native Android base.
        for (let layer = 0; layer < 4; layer++) {
          const slab = new THREE.Mesh(new THREE.CylinderGeometry(0.92 - layer * 0.13, 1.02 - layer * 0.12, 0.16, 7), layer % 2 ? metal : tint);
          slab.position.set(0, 0.22 + layer * 0.21, 0);
          slab.rotation.y = layer * 0.22;
          artifact.add(slab);
        }
        const linuxMark = new THREE.Mesh(new THREE.IcosahedronGeometry(0.27, 1), paper);
        linuxMark.position.set(0, 1.28, 0);
        artifact.add(linuxMark);
      } else if (index === 2) {
        // ADT: three linked stages of an Android toolchain.
        const blocks = [[-0.82, 0.45, 0], [0, 1.05, 0], [0.82, 0.45, 0]];
        blocks.forEach((point, blockIndex) => {
          addBox(artifact, [0.66, 0.66, 0.66], point, blockIndex === 1 ? tint : metal, [0.18, 0.26, 0.18]);
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.016, 5, 32), glowMaterials[blockIndex]);
          ring.position.set(point[0], point[1], 0.38);
          artifact.add(ring);
        });
        addLine(artifact, [[-0.45, 0.48, 0.02], [-0.08, 0.9, 0.02], [0.4, 0.48, 0.02]], 0xc5d7b3, 0.9);
      } else if (index === 3) {
        // LAI: a local inference core inside a consent-gated orbit.
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.52, 2), tint);
        core.position.y = 0.93;
        artifact.add(core);
        [0.9, 1.18].forEach((radius, ringIndex) => {
          const orbit = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.012, 5, 64), new THREE.MeshBasicMaterial({ color: ringIndex ? 0x80976d : 0xc5d7b3, transparent: true, opacity: 0.76 }));
          orbit.position.y = 0.93;
          orbit.rotation.set(0.74 + ringIndex * 0.46, 0.2, 0.18);
          artifact.add(orbit);
        });
        for (let point = 0; point < 7; point++) {
          const angle = point * Math.PI * 2 / 7;
          const bead = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), paper);
          bead.position.set(Math.cos(angle) * 1.08, 0.93 + Math.sin(angle) * 0.48, Math.sin(angle) * 0.72);
          artifact.add(bead);
        }
      } else {
        // GGEN: a floating folio assembled from editable document layers.
        for (let sheet = 0; sheet < 3; sheet++) {
          const page = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.72), sheet === 2 ? paper : metal);
          page.position.set((sheet - 1) * 0.15, 0.88 - sheet * 0.12, (2 - sheet) * 0.09);
          page.rotation.set(0.08, (sheet - 1) * 0.12, -0.12 + sheet * 0.12);
          artifact.add(page);
        }
        for (let row = 0; row < 5; row++) {
          addLine(artifact, [[-0.46, 1.35 - row * 0.2, 0.24], [0.28 + (row % 2) * 0.16, 1.35 - row * 0.2, 0.24]], 0x36533b, 0.72);
        }
        const mark = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 7, 28), tint);
        mark.position.set(0.36, 0.52, 0.28);
        artifact.add(mark);
      }
      artifact.position.set(pos[0], groundHeight(pos[0], pos[2]), pos[2]);
      artifact.scale.setScalar(1.48);
      artifact.visible = false;
      world.add(artifact);
      projectModels.push(artifact);
    });

    // The non-project chapters each have their own landmark along the route:
    // a measured rig, an archive, a work timeline, a capability constellation,
    // then a quiet closing horizon.
    const chapterLandmarks = new THREE.Group();
    const addLandmark = (mesh, position, rotation = [0, 0, 0]) => {
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      chapterLandmarks.add(mesh);
      return mesh;
    };
    [-3.2, -2.1, -1, 0.1].forEach((x, index) => {
      addLandmark(new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.05 + index * 0.16, 0.32), index % 2 ? metal : glowMaterials[2]), [x, 0.65 + index * 0.08, -27]);
    });
    addLine(chapterLandmarks, [[-3.2, 0.2, -27], [-2.1, 0.4, -27], [-1, 0.2, -27], [0.1, 0.4, -27]], 0xc5d7b3, 0.8);
    for (let sheet = 0; sheet < 4; sheet++) {
      addLandmark(new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.92), sheet % 2 ? metal : paper), [sheet * 0.5 - 0.8, 0.9 + sheet * 0.18, -38 - sheet * 0.18], [0.08, sheet * 0.12, (sheet - 1.5) * 0.07]);
    }
    [-1.2, -0.1, 1, 2.1].forEach((x, index) => {
      addLandmark(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.1 + (index % 2) * 0.8, 7), glowMaterials[index]), [x, 1.1, -48]);
      addLandmark(new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.018, 5, 24), paper), [x, 0.3 + index * 0.16, -48], [Math.PI / 2, 0, 0]);
    });
    [0.65, 1.1, 1.55].forEach((radius, index) => {
      addLandmark(new THREE.Mesh(new THREE.TorusGeometry(radius, 0.018, 6, 56), glowMaterials[index + 1]), [0, 1.2, -58], [0.25 + index * 0.55, 0.15, 0.18]);
    });
    const closingCore = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 2), glowMaterials[0]);
    closingCore.scale.set(1.15, 0.56, 0.2);
    addLandmark(closingCore, [0, 1.1, -68], [0.3, -0.4, 0.45]);
    addLandmark(new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.012, 5, 72), paper), [0, 1, -68], [0.7, 0.1, 0.2]);
    world.add(chapterLandmarks);

    let currentStage = 0;
    let selectedProject = 0;
    window.addEventListener('portfolio:project-change', (event) => {
      selectedProject = Math.max(0, Math.min(projectPoints.length - 1, Number(event.detail?.index) || 0));
    });
    const cameraPositions = mobileDevice
      ? [[0, 3.2, 17], [-1.6, 3.1, 10], [0.2, 2.6, 4], [0, 3.5, -7], [-1.8, 3.2, -22], [0.4, 4.2, -32], [1.2, 4, -42], [-1.2, 3.1, -52], [0.2, 4.8, -62]].map((p) => new THREE.Vector3(...p))
      : [[0, 3.4, 19], [-1.5, 2.9, 11], [0.2, 2.3, 5], [0, 4, -7], [-2, 3.3, -23], [0.4, 4.5, -33], [1.2, 4.1, -43], [-1.2, 3.4, -53], [0.2, 5.2, -63]].map((p) => new THREE.Vector3(...p));
    const cameraTargets = mobileDevice
      ? [[0, 0, 14], [-1.8, 0.2, 6], [1.5, 0.8, 0], [0, 0.2, -11], [-2, 0.2, -27], [0.3, 0.6, -37], [1.1, 0.2, -47], [-1.2, 0.4, -57], [0, 0, -67]].map((p) => new THREE.Vector3(...p))
      : [[0, 0, 16], [-1.8, 0.2, 7], [1.8, 0.8, 0], [0, 0.2, -11], [-2.2, 0.2, -28], [0.4, 0.6, -38], [1.4, 0.2, -48], [-1.4, 0.4, -58], [0, 0, -68]].map((p) => new THREE.Vector3(...p));
    const phonePositions = mobileDevice
      ? [[2, 1.2, 14.2], [-2, 1.2, 6.5], [1.7, 1.2, 0.6], [3.1, 1.1, -11], [-3, 1.1, -27], [1.8, 1.4, -37], [3.5, 1.2, -47], [-3, 1.2, -57], [3.4, 1.4, -67]].map((p) => new THREE.Vector3(...p))
      : [[4, 1.2, 16.2], [-2.5, 1.2, 7.5], [1.7, 1.2, 0.6], [4, 1.2, -11], [-3.6, 1.2, -28], [2.3, 1.2, -38], [4.2, 1.3, -48], [-3.5, 1.2, -58], [4.2, 1.4, -68]].map((p) => new THREE.Vector3(...p));
    const phoneRotations = [[0.12, -0.34, -0.08], [0.1, 0.22, -0.04], [-0.15, 0.08, 0.06], [0.2, 0.48, 0.09], [0.05, -0.42, 0.06], [0.12, 0.35, -0.08], [0.18, -0.1, 0.06], [-0.06, 0.48, -0.05], [-0.08, -0.4, -0.04]].map((r) => new THREE.Euler(...r));
    const phoneScales = mobileDevice ? [1.8, 1.35, 1.95, 1.25, 1.22, 1.45, 1.3, 1.35, 1.4] : [1.65, 1.25, 2, 1.2, 1.18, 1.35, 1.2, 1.25, 1.3];
    const cameraFovs = mobileDevice ? [61, 57, 48, 55, 56, 54, 56, 58, 62] : [41, 39, 34, 40, 42, 41, 43, 45, 48];
    const clock = new THREE.Clock();
    let frameId = 0;
    let lastFrame = 0;
    let resizeTimer;
    function resize() {
      const mobile = window.innerWidth < 700;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, renderScale));
      camera.fov = mobile ? 61 : 39;
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 120);
    }, { passive: true });

    function mixVector(target, values, amount) {
      const low = Math.floor(amount);
      const high = Math.min(values.length - 1, low + 1);
      return target.copy(values[low]).lerp(values[high], amount - low);
    }
    function render(now) {
      frameId = window.requestAnimationFrame(render);
      if (document.hidden || now - lastFrame < (saveData || lowMemory ? 50 : mobileDevice ? 33 : 32)) return;
      lastFrame = now;
      const delta = Math.min(clock.getDelta(), 0.05);
      const motion = reducedMotion.matches;
      currentStage = motion ? targetStage : THREE.MathUtils.damp(currentStage, targetStage, 3.0, delta);
      const low = Math.floor(currentStage);
      const high = Math.min(cameraFovs.length - 1, low + 1);
      const nextFov = THREE.MathUtils.lerp(cameraFovs[low], cameraFovs[high], currentStage - low);
      if (Math.abs(camera.fov - nextFov) > 0.08) { camera.fov = nextFov; camera.updateProjectionMatrix(); }
      mixVector(camera.position, cameraPositions, currentStage);
      const look = new THREE.Vector3();
      mixVector(look, cameraTargets, currentStage);
      const projectFocus = THREE.MathUtils.smoothstep(currentStage, 2.58, 2.96)
        * (1 - THREE.MathUtils.smoothstep(currentStage, 3.08, 3.48));
      const selectedNode = nodePositions[selectedProject];
      look.lerp(new THREE.Vector3(selectedNode[0], 0.34, selectedNode[2]), projectFocus);
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, selectedNode[0], projectFocus);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, selectedNode[2] + 7, projectFocus);
      camera.lookAt(look);
      mixVector(phone.position, phonePositions, currentStage);
      const phoneHigh = Math.min(phoneRotations.length - 1, low + 1);
      phone.rotation.set(
        THREE.MathUtils.lerp(phoneRotations[low].x, phoneRotations[phoneHigh].x, currentStage - low),
        THREE.MathUtils.lerp(phoneRotations[low].y, phoneRotations[phoneHigh].y, currentStage - low),
        THREE.MathUtils.lerp(phoneRotations[low].z, phoneRotations[phoneHigh].z, currentStage - low)
      );
      const scale = THREE.MathUtils.lerp(phoneScales[low], phoneScales[phoneHigh], currentStage - low);
      phone.scale.setScalar(scale);
      const nodeAmount = projectFocus;
      projectNodes.visible = nodeAmount > 0.01;
      projectNodes.scale.setScalar(THREE.MathUtils.lerp(0.72, 1, nodeAmount));
      projectPoints.forEach((point, index) => point.scale.setScalar(index === selectedProject ? 1.28 : 0.82));
      projectModels.forEach((model, index) => {
        model.visible = index === selectedProject && nodeAmount > 0.01;
        if (model.visible) {
          model.rotation.y = motion ? 0.12 : Math.sin(now * 0.00025) * 0.13;
          model.scale.setScalar(1.18 + nodeAmount * 0.3);
        }
      });
      projectNodes.traverse((object) => {
        if (object.material && 'opacity' in object.material) {
          object.material.transparent = true;
          object.material.opacity = object === network ? nodeAmount * 0.72 : nodeAmount;
        }
      });
      const noteAmount = 1 - THREE.MathUtils.smoothstep(currentStage, 0.65, 1.2);
      notePaper.material.transparent = true;
      notePaper.material.opacity = noteAmount;
      notePaper.visible = noteAmount > 0.01;
      if (!motion) {
        const drift = Math.sin(now * 0.00042) * 0.025;
        phone.position.y += drift;
        noteCard.rotation.y = 0.23 + Math.sin(now * 0.00028) * 0.035;
        projectNodes.rotation.y = Math.sin(now * 0.00018) * 0.025;
        chapterLandmarks.rotation.y = Math.sin(now * 0.00007) * 0.012;
        world.rotation.y = Math.sin(now * 0.0001) * 0.025;
      }
      renderer.render(scene, camera);
    }
    document.body.classList.remove('world-fallback');
    document.body.classList.add('has-world');
    frameId = window.requestAnimationFrame(render);
    window.addEventListener('pagehide', () => {
      window.cancelAnimationFrame(frameId);
      renderer.dispose();
      terrainGeometry.dispose();
      contourGeometry.dispose();
      networkGeo.dispose();
      phoneScreen.dispose();
      noteTexture.dispose();
    }, { once: true });
  }
})();
