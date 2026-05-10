;(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const prefersReduced  = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobileViewport = () => window.matchMedia('(max-width: 960px)').matches || window.matchMedia('(pointer: coarse)').matches;

  let W, H, particles = [], raf, dpr = 1, particleCount = 88, connectDist = 148, maxFps = 60, lastFrameTime = 0;

  function tuneForViewport() {
    const area = window.innerWidth * window.innerHeight;
    if (isMobileViewport()) {
      particleCount = Math.max(36, Math.min(64, Math.round(area / 26000)));
      connectDist = Math.max(92, Math.min(128, Math.round(Math.sqrt(area) / 9.5)));
      maxFps = 30;
      return;
    }
    particleCount = Math.max(88, Math.min(190, Math.round(area / 18000)));
    connectDist = Math.max(148, Math.min(230, Math.round(Math.sqrt(area) / 7.25)));
    maxFps = 60;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, isMobileViewport() ? 1.25 : 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tuneForViewport();
  }

  class Particle {
    constructor(spawning) {
      this.reset(spawning);
    }
    reset(spawning) {
      this.x   = Math.random() * W;
      this.y   = Math.random() * H;
      this.vx  = (Math.random() - 0.5) * 0.38;
      this.vy  = (Math.random() - 0.5) * 0.38;
      this.r   = Math.random() * 1.75 + 0.45;
      this.a   = Math.random() * 0.34 + 0.08;
      this.life    = spawning ? Math.random() * 300 : Math.random() * 300 + 150;
      this.maxLife = this.life;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life--;
      
      if (this.x < -2)  this.x = W + 2;
      if (this.x > W+2) this.x = -2;
      if (this.y < -2)  this.y = H + 2;
      if (this.y > H+2) this.y = -2;
      if (this.life <= 0) this.reset(false);
    }
    draw() {
      const fade = Math.min(1, this.life / 40);  
      const fadeIn = Math.min(1, (this.maxLife - this.life + 1) / 40);
      const alpha = this.a * Math.min(fade, fadeIn);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }
  }

  function init() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(true));
    }
  }

  function drawConnections() {
    const count = particles.length;
    const useMobileOpacity = isMobileViewport();
    for (let i = 0; i < count - 1; i++) {
      const a = particles[i];
      for (let j = i + 1; j < count; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectDist) {
          const alpha = (1 - dist / connectDist) * (useMobileOpacity ? 0.08 : 0.12);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
          ctx.lineWidth = useMobileOpacity ? 0.8 : 0.95;
          ctx.stroke();
        }
      }
    }
  }

  function frame(now = 0) {
    const frameInterval = 1000 / maxFps;
    if (now - lastFrameTime < frameInterval) {
      raf = requestAnimationFrame(frame);
      return;
    }
    lastFrameTime = now;
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    raf = requestAnimationFrame(frame);
  }

  if (prefersReduced) {
    
    resize();
    init();
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => p.draw());
    return;
  }

  window.addEventListener('resize', () => {
    resize();
    init();
    lastFrameTime = 0;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      return;
    }
    lastFrameTime = 0;
    if (!raf) raf = requestAnimationFrame(frame);
  });
  resize();
  init();
  raf = requestAnimationFrame(frame);
})();

;(function () {
  const navLinks  = document.querySelectorAll('.nav-link[data-page]');
  const pages     = document.querySelectorAll('.page');
  const sidebar   = document.getElementById('sidebar');
  const toggle    = document.getElementById('navToggle');
  const backdrop  = document.getElementById('navBackdrop');

  function showPage(id) {
    pages.forEach(p => {
      if (p.id === id) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', a.dataset.page === id);
    });

    const cw = document.querySelector('.content-wrapper');
    if (cw) cw.scrollTop = 0;

    closeMobile();

    history.replaceState(null, '', '#' + id);
  }

  function syncNavAria(isOpen) {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    if (backdrop) backdrop.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  }

  function closeMobile() {
    sidebar?.classList.remove('open');
    backdrop?.classList.remove('visible');
    document.body.classList.remove('mobile-nav-open');
    syncNavAria(false);
  }

  function openMobile() {
    sidebar?.classList.add('open');
    backdrop?.classList.add('visible');
    document.body.classList.add('mobile-nav-open');
    syncNavAria(true);
  }

  function toggleMobileNav() {
    if (!sidebar) return;
    if (sidebar.classList.contains('open')) closeMobile();
    else openMobile();
  }

  navLinks.forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      showPage(a.dataset.page);
    });
  });

  if (toggle) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileNav();
    });
  }
  if (backdrop) backdrop.addEventListener('click', closeMobile);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) closeMobile();
  });

  
  window.showPage = showPage;

  
  const hash = location.hash.replace('#', '');
  if (hash && document.getElementById(hash)) {
    showPage(hash);
  } else {
    showPage('intro');
  }
})();

;(function () {
  document.querySelectorAll('.code-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const block = btn.closest('.code-wrap')?.querySelector('.code-block');
      if (!block) return;
      const text = block.innerText || block.textContent;
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'copy';
          btn.classList.remove('copied');
        }, 1800);
      }).catch(() => {
        btn.textContent = 'err :(';
        setTimeout(() => { btn.textContent = 'copy'; }, 1400);
      });
    });
  });
})();
