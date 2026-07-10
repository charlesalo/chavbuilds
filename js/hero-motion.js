/* ============================================
   HERO MOTION
   Mouse parallax + scroll transition for #hero.
   One rAF loop, self-stopping when settled.
   Pairs with the HERO MOTION block in motion.css.
   ============================================ */

(() => {
  const hero = document.getElementById('hero');
  const video = document.getElementById('hero-video');
  if (!hero || !video) return;

  const content = hero.querySelector('.hero-content');
  const shade = hero.querySelector('.hero-shade');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  // Two parallax planes: the video counter-moves slightly, the
  // content follows as a single unit. One depth relationship,
  // nothing drifts independently.
  const DEPTH_VIDEO = 3;
  const DEPTH_CONTENT = 6;

  // Base video scale absorbs the ±3px parallax so edges never show;
  // scroll adds up to +5% on top (≈106% at the bottom of the hero).
  const SCALE_BASE = 1.01;
  const SCALE_RANGE = 0.05;
  const SHADE_MAX = 0.3;   // scroll darkening
  const FADE_RANGE = 0.35; // content fades to 65%, not out
  const LERP = 0.08;

  const lerp = (a, b, t) => a + (b - a) * t;

  // Mouse position normalized to -1..1 from hero center
  let targetX = 0, targetY = 0;
  let curX = 0, curY = 0;
  let scrollProgress = 0;
  let appliedProgress = -1;
  let heroHeight = hero.offsetHeight || 1;
  let rafId = null;

  function apply() {
    const scale = SCALE_BASE + scrollProgress * SCALE_RANGE;
    video.style.transform =
      `translate3d(${(-curX * DEPTH_VIDEO).toFixed(2)}px, ${(-curY * DEPTH_VIDEO).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    if (content) {
      content.style.transform =
        `translate3d(${(curX * DEPTH_CONTENT).toFixed(2)}px, ${(curY * DEPTH_CONTENT).toFixed(2)}px, 0)`;
      content.style.opacity = (1 - scrollProgress * FADE_RANGE).toFixed(3);
    }
    if (shade) shade.style.opacity = (scrollProgress * SHADE_MAX).toFixed(3);
    appliedProgress = scrollProgress;
  }

  function frame() {
    curX = lerp(curX, targetX, LERP);
    curY = lerp(curY, targetY, LERP);
    if (Math.abs(targetX - curX) < 0.001) curX = targetX;
    if (Math.abs(targetY - curY) < 0.001) curY = targetY;

    apply();

    const settled = curX === targetX && curY === targetY;
    rafId = settled ? null : requestAnimationFrame(frame);
  }

  function start() {
    if (rafId === null) rafId = requestAnimationFrame(frame);
  }

  function onMouseMove(e) {
    const r = hero.getBoundingClientRect();
    targetX = ((e.clientX - r.left) / r.width - 0.5) * 2;
    targetY = ((e.clientY - r.top) / r.height - 0.5) * 2;
    start();
  }

  function onMouseLeave() {
    targetX = 0;
    targetY = 0;
    start();
  }

  function onScroll() {
    scrollProgress = Math.min(Math.max(window.scrollY / heroHeight, 0), 1);
    // Past the hero, progress stays clamped at 1 — no more frames
    if (scrollProgress !== appliedProgress) start();
  }

  function onResize() {
    heroHeight = hero.offsetHeight || 1;
    onScroll();
  }

  function enable() {
    if (finePointer.matches) {
      hero.addEventListener('mousemove', onMouseMove);
      hero.addEventListener('mouseleave', onMouseLeave);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    onScroll();
    start();
  }

  function disable() {
    hero.removeEventListener('mousemove', onMouseMove);
    hero.removeEventListener('mouseleave', onMouseLeave);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    video.style.transform = '';
    if (shade) shade.style.opacity = '';
    if (content) {
      content.style.transform = '';
      content.style.opacity = '';
    }
  }

  if (!reducedMotion.matches) enable();

  reducedMotion.addEventListener('change', (e) => {
    if (e.matches) { disable(); } else { enable(); }
  });
})();
