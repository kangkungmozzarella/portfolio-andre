(function () {
  const canvas = document.getElementById('hero3d');
  if (!canvas || typeof THREE === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Measure the canvas's own rendered box (set via CSS inset trick), not its
  // parent's — and pass `false` to setSize so three.js doesn't clobber that
  // CSS sizing with inline width/height matching some other box.
  function measure() {
    const r = canvas.getBoundingClientRect();
    return { w: r.width, h: r.height };
  }
  let { w: width, h: height } = measure();
  if (!width || !height) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.z = 8;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);

  scene.add(new THREE.AmbientLight(0xffffff, 1));

  // Two tilted rings of glowing points orbiting the photo, spinning in
  // opposite directions — replaces the old flat laptop/coffee/code-icon
  // sprites with an abstract "orbit" motif matching the Constellation theme.
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
    const points = new THREE.Points(geo, mat);
    points.rotation.x = tiltX;
    points.rotation.z = tiltZ;
    scene.add(points);
    return points;
  }

  const rings = [
    { mesh: makeRing(2.15, 64, 0x38bdf8, 0.05, Math.PI / 2.6, 0), spin: 0.00035, scrollSpin: 0.0022 },
    { mesh: makeRing(1.7, 44, 0xa78bfa, 0.045, -Math.PI / 3.1, Math.PI / 5), spin: -0.00048, scrollSpin: -0.0018 },
  ];

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', e => {
    mouseX = e.clientX / window.innerWidth - 0.5;
    mouseY = e.clientY / window.innerHeight - 0.5;
  });

  let lastScrollY = window.scrollY;

  function animate(t) {
    requestAnimationFrame(animate);
    const scrollDelta = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;

    rings.forEach(r => {
      r.mesh.rotation.y += r.spin * 16.6; // constant per-frame drift (~60fps)
      r.mesh.rotation.y += scrollDelta * r.scrollSpin;
    });

    camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 0.35 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  window.addEventListener('resize', () => {
    ({ w: width, h: height } = measure());
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  });
})();
