/* ============================================
   MOTION FOUNDATION
   Scroll reveals for .animate-on-scroll
   Pairs with css/motion.css. No dependencies.
   ============================================ */

(() => {
  const REVEAL_SELECTOR = '.animate-on-scroll';
  const STAGGER_SELECTOR = '[data-stagger]';
  const VISIBLE_CLASS = 'is-visible';
  const DONE_CLASS = 'is-done';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Auto-assign --stagger-index to reveal items inside [data-stagger]
  // containers, so markup doesn't need hand-numbered indexes.
  function applyStagger() {
    document.querySelectorAll(STAGGER_SELECTOR).forEach(group => {
      group.querySelectorAll(REVEAL_SELECTOR).forEach((el, i) => {
        el.style.setProperty('--stagger-index', i);
      });
    });
  }

  function revealAll(elements) {
    elements.forEach(el => el.classList.add(VISIBLE_CLASS, DONE_CLASS));
  }

  function init() {
    const elements = Array.from(document.querySelectorAll(REVEAL_SELECTOR));
    if (!elements.length) return;

    // Reduced motion (or no observer support): skip animation entirely
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      revealAll(elements);
      return;
    }

    applyStagger();

    const pending = new Set(elements);

    function teardown() {
      observer.disconnect();
      window.removeEventListener('scroll', sweepMissed);
    }

    function reveal(el) {
      if (!pending.has(el)) return;
      pending.delete(el);
      el.classList.add(VISIBLE_CLASS);
      el.addEventListener('transitionend', () => el.classList.add(DONE_CLASS), { once: true });
      observer.unobserve(el);
      if (pending.size === 0) teardown();
    }

    // threshold 0 + no shrunk rootMargin: any overlap at all counts.
    // A fast mobile flick can carry an element across the viewport
    // between two IntersectionObserver samples — a stricter threshold
    // makes that skip more likely, leaving the element stuck at
    // opacity 0 forever.
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) reveal(entry.target);
      });
    }, {
      threshold: 0,
      rootMargin: '0px',
    });

    elements.forEach(el => observer.observe(el));

    // Safety net for the rare case a flick still skips the observer
    // entirely: on scroll, reveal anything already above the fold
    // instead of leaving it invisible for the rest of the session.
    let sweepQueued = false;
    function sweepMissed() {
      if (sweepQueued) return;
      sweepQueued = true;
      requestAnimationFrame(() => {
        sweepQueued = false;
        pending.forEach(el => {
          if (el.getBoundingClientRect().top < window.innerHeight) reveal(el);
        });
      });
    }
    window.addEventListener('scroll', sweepMissed, { passive: true });

    // If the user enables reduced motion mid-session, finish instantly
    reducedMotion.addEventListener('change', (e) => {
      if (!e.matches) return;
      teardown();
      revealAll(elements);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
