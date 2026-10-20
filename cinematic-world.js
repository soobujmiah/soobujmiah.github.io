(() => {
  const canvas = document.getElementById('cinematic-world');
  if (!canvas) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const constrainedDevice = Boolean((navigator.connection && navigator.connection.saveData) || (navigator.deviceMemory && navigator.deviceMemory <= 2) || window.innerWidth < 700);

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
    const mobileDevice = window.innerWidth < 700;
    const renderScale = constrainedDevice ? 0.82 : 1.35;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, renderScale));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    const scene = new THREE.Scene();
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
    const terrainSizeZ = 25;
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

    const phone = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.8, 0.12), new THREE.MeshStandardMaterial({ color: 0x101b15, roughness: 0.36, metalness: 0.58 }));
    phone.add(frame);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.64), new THREE.MeshBasicMaterial({ map: phoneScreen }));
    screen.position.z = 0.066;
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
    noteCard.position.set(1.9, 1.15, -1.1);
    noteCard.rotation.set(0.1, 0.23, -0.08);
    world.add(noteCard);

    const nodePositions = mobileDevice
      ? [[-1.65, 0.08, -2.7], [-0.82, 0.12, 1.3], [0, 0.18, -2.5], [0.82, 0.08, 1.1], [1.65, 0.14, -2.3]]
      : [[-4.0, 0.08, -2.7], [-2.0, 0.12, 1.3], [0.0, 0.18, -2.5], [2.1, 0.08, 1.1], [4.0, 0.14, -2.3]];
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

    const stageNames = ['notes', 'workstation', 'systems', 'knowledge'];
    const stageSections = Array.from(document.querySelectorAll('[data-world-stage]'));
    let targetStage = 0;
    let currentStage = 0;
    let selectedProject = 0;
    window.addEventListener('portfolio:project-change', (event) => {
      selectedProject = Math.max(0, Math.min(projectPoints.length - 1, Number(event.detail?.index) || 0));
    });
    const cameraPositions = mobileDevice
      ? [new THREE.Vector3(-0.5, 2.8, 9.6), new THREE.Vector3(-0.15, 2.1, 6.2), new THREE.Vector3(0.45, 3.9, 10.8), new THREE.Vector3(-0.55, 4.4, 12.2)]
      : [new THREE.Vector3(0.3, 3.15, 12.4), new THREE.Vector3(-0.35, 2.35, 7.5), new THREE.Vector3(0.65, 4.45, 13.2), new THREE.Vector3(-0.5, 5.1, 15.2)];
    const cameraTargets = mobileDevice
      ? [new THREE.Vector3(-0.65, 0.2, 0), new THREE.Vector3(-0.2, 0.35, 0), new THREE.Vector3(0.5, 0.1, -0.3), new THREE.Vector3(-0.6, -0.1, 0)]
      : [new THREE.Vector3(1.2, 0.25, 0), new THREE.Vector3(-0.2, 0.35, 0), new THREE.Vector3(0.5, 0.15, -0.5), new THREE.Vector3(-0.8, 0, -1)];
    const phonePositions = mobileDevice
      ? [new THREE.Vector3(2.05, 1.35, 1.1), new THREE.Vector3(1.8, 1.25, 0.8), new THREE.Vector3(1.35, 1.0, 0.7), new THREE.Vector3(1.9, 1.35, 0.1)]
      : [new THREE.Vector3(4.0, 1.2, 0.1), new THREE.Vector3(1.7, 1.2, 0.1), new THREE.Vector3(2.0, 1.0, 0.3), new THREE.Vector3(4.1, 1.3, -0.7)];
    const phoneRotations = [new THREE.Euler(0.12, -0.34, -0.08), new THREE.Euler(-0.15, 0.08, 0.06), new THREE.Euler(0.2, 0.48, 0.09), new THREE.Euler(-0.08, -0.4, -0.04)];
    const phoneScales = mobileDevice ? [1.85, 2.05, 1.72, 1.5] : [1.8, 2.15, 1.65, 1.48];
    const cameraFovs = mobileDevice ? [61, 49, 58, 66] : [39, 34, 43, 52];
    const route = document.querySelector('.world-route');
    const routeTitle = document.getElementById('world-route-title');
    const routeTitles = [
      { en: '01 — FIELD NOTES', bn: '০১ — ফিল্ড নোট' },
      { en: '02 — MOBILE WORKSTATION', bn: '০২ — মোবাইল কর্মপরিবেশ' },
      { en: '03 — SELECTED SYSTEMS', bn: '০৩ — বাছাই করা সিস্টেম' },
      { en: '04 — LIVING KNOWLEDGE', bn: '০৪ — জীবন্ত জ্ঞান' }
    ];
    let displayedRoute = -1;

    function updateRoute() {
      if (!route || !routeTitle) return;
      const next = Math.max(0, Math.min(routeTitles.length - 1, Math.round(targetStage)));
      if (next === displayedRoute) return;
      displayedRoute = next;
      const language = document.body.classList.contains('lang-bn') ? 'bn' : 'en';
      routeTitle.textContent = routeTitles[next][language];
      route.querySelector('.world-route-index').textContent = `${String(next + 1).padStart(2, '0')} / 04`;
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
      updateRoute();
    }
    window.addEventListener('scroll', updateTargetStage, { passive: true });
    window.addEventListener('resize', updateTargetStage, { passive: true });
    updateTargetStage();

    const clock = new THREE.Clock();
    let frameId = 0;
    let lastFrame = 0;
    let resizeTimer;
    function resize() {
      const mobile = window.innerWidth < 700;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, constrainedDevice ? 0.82 : 1.35));
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
      if (document.hidden || now - lastFrame < (constrainedDevice ? 42 : 32)) return;
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
      const projectFocus = THREE.MathUtils.smoothstep(currentStage, 1.5, 2.5) * 0.52;
      look.lerp(new THREE.Vector3(nodePositions[selectedProject][0], 0.12, nodePositions[selectedProject][2]), projectFocus);
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
      const nodeAmount = THREE.MathUtils.smoothstep(currentStage, 1.15, 2.15);
      projectNodes.visible = nodeAmount > 0.01;
      projectNodes.scale.setScalar(THREE.MathUtils.lerp(0.72, 1, nodeAmount));
      projectPoints.forEach((point, index) => point.scale.setScalar(index === selectedProject ? 1.28 : 0.82));
      projectNodes.traverse((object) => {
        if (object.material && 'opacity' in object.material) {
          object.material.transparent = true;
          object.material.opacity = object === network ? nodeAmount * 0.72 : nodeAmount;
        }
      });
      const noteAmount = 1 - THREE.MathUtils.smoothstep(currentStage, 0.35, 1.05);
      notePaper.material.transparent = true;
      notePaper.material.opacity = noteAmount;
      notePaper.visible = noteAmount > 0.01;
      if (!motion) {
        const drift = Math.sin(now * 0.00042) * 0.025;
        phone.position.y += drift;
        noteCard.rotation.y = 0.23 + Math.sin(now * 0.00028) * 0.035;
        projectNodes.rotation.y = Math.sin(now * 0.00018) * 0.025;
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
