  /* ── TAB SYSTEM ─────────────────────────────────────────── */
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  function switchTab(name) {
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    tabContents.forEach(c => c.classList.toggle('active', c.id === 'tab-' + name));

    const tabBar = document.getElementById('tab-bar');
    const navHeight = document.getElementById('heroNav').offsetHeight;
    const targetY = tabBar.getBoundingClientRect().top + window.scrollY - navHeight;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }
  tabBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  document.getElementById('viewWorkBtn').addEventListener('click', e => { e.preventDefault(); switchTab('about'); });

  /* ── NAVBAR SCROLL ──────────────────────────────────────── */
  window.addEventListener('scroll', () => {
    document.getElementById('heroNav').classList.toggle('scrolled', window.scrollY > 40);
  });

  /* ── PARALLAX: SCROLL (background orbs) ─────────────────── */
  const orbs = [
    { el: document.querySelector('.bg-orb-parallax-1'), speed: 0.15 },
    { el: document.querySelector('.bg-orb-parallax-2'), speed: 0.3 },
    { el: document.querySelector('.bg-orb-parallax-3'), speed: 0.22 },
  ].filter(o => o.el);

  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      orbs.forEach(o => { o.el.style.transform = `translateY(${y * o.speed}px)`; });
      scrollTicking = false;
    });
  });

  /* ── PARALLAX: MOUSE TILT (hero photo) ──────────────────── */
  const heroSection = document.getElementById('hero');
  const heroVisual = document.querySelector('.hero-visual');
  const photoWrap = document.querySelector('.hero-photo-wrap');

  if (heroSection && heroVisual && photoWrap) {
    let tiltTicking = false, tiltX = 0, tiltY = 0;

    heroSection.addEventListener('mousemove', e => {
      const r = heroSection.getBoundingClientRect();
      tiltX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      tiltY = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (tiltTicking) return;
      tiltTicking = true;
      requestAnimationFrame(() => {
        photoWrap.style.transform = `rotateY(${tiltX * 8}deg) rotateX(${-tiltY * 8}deg)`;
        heroVisual.style.transform = `translate(${tiltX * -12}px, ${tiltY * -8}px)`;
        tiltTicking = false;
      });
    });

    heroSection.addEventListener('mouseleave', () => {
      photoWrap.style.transform = 'rotateY(0deg) rotateX(0deg)';
      heroVisual.style.transform = 'translate(0,0)';
    });
  }

  /* ── AGE ────────────────────────────────────────────────── */
  (function(){
    const d = new Date('2002-08-15'), n = new Date();
    let a = n.getFullYear() - d.getFullYear();
    if (n.getMonth() < d.getMonth() || (n.getMonth()===d.getMonth() && n.getDate()<d.getDate())) a--;
    document.getElementById('age-num').textContent = a;
  })();

  /* ── MODAL ──────────────────────────────────────────────── */
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
  }
  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
  }
  document.querySelectorAll('.modal-bd').forEach(b => {
    b.addEventListener('click', e => { if (e.target === b) closeModal(b.id); });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-bd.open').forEach(b => closeModal(b.id));
      closeLB();
    }
  });

  /* ── LIGHTBOX ───────────────────────────────────────────── */
  let lbImgs = [], lbIdx = 0;
  function openLB(imgs, idx) {
    lbImgs = imgs; lbIdx = idx;
    document.getElementById('lb-img').src = imgs[idx];
    document.getElementById('lb-cur').textContent = idx + 1;
    document.getElementById('lb-tot').textContent = imgs.length;
    document.getElementById('lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLB() {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
  }
  function lbNav(dir) {
    lbIdx = (lbIdx + dir + lbImgs.length) % lbImgs.length;
    document.getElementById('lb-img').src = lbImgs[lbIdx];
    document.getElementById('lb-cur').textContent = lbIdx + 1;
  }
  document.getElementById('lightbox').addEventListener('click', e => { if (e.target === e.currentTarget) closeLB(); });
  document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox').classList.contains('open')) return;
    if (e.key === 'ArrowRight') lbNav(1);
    if (e.key === 'ArrowLeft')  lbNav(-1);
  });
