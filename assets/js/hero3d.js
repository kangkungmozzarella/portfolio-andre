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

  const loader = new THREE.TextureLoader();

  function makeFloater(url, w, h, x, y, z) {
    const tex = loader.load(url);
    if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }

  // `spinZ` = how many radians this object spins in-plane (like a clock
  // hand / pinwheel) per pixel scrolled. Rotating on Z keeps the flat image
  // facing the camera at every angle, so it never shows its "edge" (no more
  // flat/gepeng look) — each object spins at a slightly different rate so
  // they don't move in lockstep.
  const objs = [
    { mesh: makeFloater('assets/images/floaters/laptop.svg', 1.5, 1.1, -1.9, 1.15, -1), baseY: 1.15, bobSpeed: 0.9, bobAmp: 0.1, offset: 0, spinZ: 0.0026 },
    { mesh: makeFloater('assets/images/floaters/coffee.png', 0.85, 0.85, 1.85, -1.05, 0.5), baseY: -1.05, bobSpeed: 1.2, bobAmp: 0.08, offset: 2, spinZ: 0.0034 },
    { mesh: makeFloater('assets/images/floaters/code-icon.png', 0.62, 0.62, -1.6, -1.15, 1), baseY: -1.15, bobSpeed: 1.5, bobAmp: 0.07, offset: 4, spinZ: -0.003 },
  ];

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', e => {
    mouseX = e.clientX / window.innerWidth - 0.5;
    mouseY = e.clientY / window.innerHeight - 0.5;
  });

  let lastScrollY = window.scrollY;

  function animate(t) {
    requestAnimationFrame(animate);
    const s = t * 0.0006;
    const scrollDelta = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;

    objs.forEach(o => {
      o.mesh.position.y = o.baseY + Math.sin(s * o.bobSpeed + o.offset) * o.bobAmp;
      o.mesh.rotation.z += scrollDelta * o.spinZ;
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
