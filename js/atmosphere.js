/* ============================================
   ATMOSPHERE
   Full-page ambient particle canvas (2D API).
   Creates its own <canvas>; styled in motion.css.
   No dependencies.
   ============================================ */

(() => {
  const CONFIG = {
    count: 20,
    color: '255, 220, 170',
    particleAlpha: 0.15,   // per-particle glow opacity
    linkAlpha: 0.05,       // max connection-line opacity
    linkDistance: 150,     // px — draw lines under this distance
    minSpeed: 2,           // px/sec — extremely slow drift
    maxSpeed: 6,
    minRadius: 1.5,        // core radius; glow extends ~8x
    maxRadius: 3,
    glowScale: 8,
    repelRadius: 140,      // px — mouse influence zone
    repelStrength: 30,     // px/sec² at the cursor, falls off to 0
    returnRate: 0.6,       // how quickly drift recovers after repulsion
    dprCap: 2,
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  // ── Canvas setup ────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.id = 'atmosphere';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, CONFIG.dprCap);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ── Glow sprite: rendered once, blitted per particle ──
  const SPRITE_SIZE = 64;
  const sprite = document.createElement('canvas');
  sprite.width = SPRITE_SIZE;
  sprite.height = SPRITE_SIZE;
  {
    const sctx = sprite.getContext('2d');
    const half = SPRITE_SIZE / 2;
    const grad = sctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0, `rgba(${CONFIG.color}, 1)`);
    grad.addColorStop(0.25, `rgba(${CONFIG.color}, 0.35)`);
    grad.addColorStop(1, `rgba(${CONFIG.color}, 0)`);
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  }

  // ── Particles ───────────────────────────────
  const rand = (min, max) => min + Math.random() * (max - min);

  function makeParticle() {
    const angle = Math.random() * Math.PI * 2;
    const speed = rand(CONFIG.minSpeed, CONFIG.maxSpeed);
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,  // current velocity (px/sec)
      vy: Math.sin(angle) * speed,
      bx: Math.cos(angle) * speed,  // base drift it returns to
      by: Math.sin(angle) * speed,
      r: rand(CONFIG.minRadius, CONFIG.maxRadius),
    };
  }

  let particles = [];

  function populate() {
    // Lighter on small screens
    const count = width < 768 ? Math.round(CONFIG.count * 0.6) : CONFIG.count;
    particles = Array.from({ length: count }, makeParticle);
  }

  // ── Mouse ───────────────────────────────────
  const mouse = { x: -1e5, y: -1e5 };

  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }
  function onMouseOut() {
    mouse.x = -1e5;
    mouse.y = -1e5;
  }

  // ── Simulation ──────────────────────────────
  function update(dt) {
    const margin = CONFIG.maxRadius * CONFIG.glowScale;
    const repelR2 = CONFIG.repelRadius * CONFIG.repelRadius;

    for (const p of particles) {
      // Slight mouse repulsion
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < repelR2 && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const falloff = 1 - d / CONFIG.repelRadius;
        const force = CONFIG.repelStrength * falloff * dt;
        p.vx += (dx / d) * force;
        p.vy += (dy / d) * force;
      }

      // Ease velocity back to the base drift
      const k = Math.min(CONFIG.returnRate * dt, 1);
      p.vx += (p.bx - p.vx) * k;
      p.vy += (p.by - p.vy) * k;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Wrap past the glow margin so nothing pops at the edges
      if (p.x < -margin) p.x = width + margin;
      else if (p.x > width + margin) p.x = -margin;
      if (p.y < -margin) p.y = height + margin;
      else if (p.y > height + margin) p.y = -margin;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Faint connection lines between nearby particles
    const maxD = CONFIG.linkDistance;
    const maxD2 = maxD * maxD;
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= maxD2) continue;
        const alpha = CONFIG.linkAlpha * (1 - Math.sqrt(d2) / maxD);
        ctx.strokeStyle = `rgba(${CONFIG.color}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // Glow sprites
    ctx.globalAlpha = CONFIG.particleAlpha;
    for (const p of particles) {
      const size = p.r * CONFIG.glowScale * 2;
      ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  }

  // ── Loop: pauses when the tab is hidden ─────
  let rafId = null;
  let lastTime = 0;

  function frame(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05); // clamp tab-switch jumps
    lastTime = now;
    update(dt);
    draw();
    rafId = requestAnimationFrame(frame);
  }

  function startLoop() {
    if (rafId !== null) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function stopLoop() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function onVisibilityChange() {
    if (document.hidden) stopLoop();
    else if (!reducedMotion.matches) startLoop();
  }

  // ── Wiring ──────────────────────────────────
  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      for (const p of particles) {
        p.x = Math.min(p.x, width);
        p.y = Math.min(p.y, height);
      }
      if (reducedMotion.matches) draw();
    }, 150);
  }

  function enable() {
    // Mouse repulsion only makes sense with a fine pointer
    if (finePointer.matches) {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('mouseout', onMouseOut);
    }
    startLoop();
  }

  function disable() {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseout', onMouseOut);
    stopLoop();
    draw(); // leave a static frame rather than a blank layer
  }

  resize();
  populate();
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibilityChange);

  if (reducedMotion.matches) {
    draw();
  } else {
    enable();
  }

  reducedMotion.addEventListener('change', (e) => {
    if (e.matches) disable();
    else enable();
  });
})();
