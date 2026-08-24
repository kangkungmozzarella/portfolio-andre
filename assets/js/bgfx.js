/* Constellation background effects: a fixed full-page particle network
   behind the whole site, and a small orbiting-particle scene that replaces
   the old About-tab photo. Both guard on THREE being loaded and on
   prefers-reduced-motion (falling back to the static CSS gradient / an
   empty panel respectively). */
(function () {
  if (typeof THREE === 'undefined') return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── GLOBAL PARTICLE NETWORK ─────────────────────────────── */
  (function initBackgroundNetwork() {
    const canvas = document.getElementById('bgfx');
    if (!canvas || reduced) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    const count = window.innerWidth < 700 ? 45 : 90;
    const spread = { x: 13, y: 8, z: 6 };
    const nodes = [];
    for (let i = 0; i < count; i++) {
      nodes.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * spread.x * 2,
          (Math.random() - 0.5) * spread.y * 2,
          (Math.random() - 0.5) * spread.z * 2
        ),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.004,
          (Math.random() - 0.5) * 0.004,
          (Math.random() - 0.5) * 0.003
        ),
      });
    }

    // Connect each node to its 2 nearest neighbors once at start — cheap
    // "constellation" topology without per-frame O(n^2) distance checks.
    const edges = [];
    nodes.forEach((n, i) => {
      const dists = nodes
        .map((o, j) => ({ j, d: i === j ? Infinity : n.pos.distanceToSquared(o.pos) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      dists.forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!edges.some(e => e.key === key)) edges.push({ key, a: i, b: j });
      });
    });

    const pointPositions = new Float32Array(count * 3);
    const pointGeo = new THREE.BufferGeometry();
    pointGeo.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
    const pointMat = new THREE.PointsMaterial({
      color: 0x8fd6ff, size: 0.06, transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    const points = new THREE.Points(pointGeo, pointMat);
    scene.add(points);

    const linePositions = new Float32Array(edges.length * 2 * 3);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x5b6ed6, transparent: true, opacity: 0.22,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    function writeBuffers() {
      nodes.forEach((n, i) => {
        pointPositions[i * 3] = n.pos.x;
        pointPositions[i * 3 + 1] = n.pos.y;
        pointPositions[i * 3 + 2] = n.pos.z;
      });
      pointGeo.attributes.position.needsUpdate = true;

      edges.forEach((e, i) => {
        const a = nodes[e.a].pos, b = nodes[e.b].pos;
        linePositions[i * 6] = a.x; linePositions[i * 6 + 1] = a.y; linePositions[i * 6 + 2] = a.z;
        linePositions[i * 6 + 3] = b.x; linePositions[i * 6 + 4] = b.y; linePositions[i * 6 + 5] = b.z;
      });
      lineGeo.attributes.position.needsUpdate = true;
    }
    writeBuffers();

    let mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', e => {
      mouseX = e.clientX / window.innerWidth - 0.5;
      mouseY = e.clientY / window.innerHeight - 0.5;
    });

    function docScrollFraction() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, window.scrollY / max) : 0;
    }

    function animate() {
      requestAnimationFrame(animate);

      nodes.forEach(n => {
        n.pos.add(n.vel);
        if (Math.abs(n.pos.x) > spread.x) n.vel.x *= -1;
        if (Math.abs(n.pos.y) > spread.y) n.vel.y *= -1;
        if (Math.abs(n.pos.z) > spread.z) n.vel.z *= -1;
      });
      writeBuffers();

      // subtle scroll-linked brightness dip deeper into the page
      const sf = docScrollFraction();
      pointMat.opacity = 0.75 - sf * 0.35;
      lineMat.opacity = 0.22 - sf * 0.12;

      camera.position.x += (mouseX * 0.8 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 0.5 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    });
  })();

  /* ── ABOUT-TAB ORBIT (replaces the old second profile photo) ────── */
  (function initAboutOrbit() {
    const canvas = document.getElementById('aboutOrbit');
    const panel = document.getElementById('tab-about');
    if (!canvas || !panel) return;

    if (reduced) return; // leave the panel empty — no static fallback needed

    function measure() {
      const r = canvas.getBoundingClientRect();
      return { w: r.width || 340, h: r.height || 340 };
    }
    let { w: width, h: height } = measure();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.z = 6.5;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);

    function makeRing(radius, count, color, size, tiltX, tiltZ) {
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        positions[i * 3] = Math.cos(a) * radius;
        positions[i * 3 + 1] = Math.sin(a) * radius;
        positions[i * 3 + 2] = 0;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color, size, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
      });
      const pts = new THREE.Points(geo, mat);
      pts.rotation.x = tiltX;
      pts.rotation.z = tiltZ;
      scene.add(pts);
      return pts;
    }

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.55, 1),
      new THREE.MeshBasicMaterial({ color: 0x34d399, wireframe: true, transparent: true, opacity: 0.55 })
    );
    scene.add(core);

    const rings = [
      { mesh: makeRing(1.5, 50, 0x38bdf8, 0.045, Math.PI / 2.3, 0), spin: 0.0006 },
      { mesh: makeRing(2.0, 60, 0xa78bfa, 0.04, -Math.PI / 2.7, Math.PI / 6), spin: -0.00042 },
      { mesh: makeRing(1.05, 34, 0xf472b6, 0.05, Math.PI / 6, Math.PI / 2), spin: 0.0009 },
    ];

    let running = false;
    let rafId = null;

    function tick() {
      core.rotation.y += 0.004;
      core.rotation.x += 0.0015;
      rings.forEach(r => { r.mesh.rotation.y += r.spin * 16.6; });
      renderer.render(scene, camera);
      if (running) rafId = requestAnimationFrame(tick);
    }

    function start() {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    }
    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => { entry.isIntersecting ? start() : stop(); });
    }, { threshold: 0.05 });
    io.observe(panel);

    window.addEventListener('resize', () => {
      ({ w: width, h: height } = measure());
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    });
  })();
})();
