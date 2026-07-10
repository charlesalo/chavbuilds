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

    let remaining = elements.length;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        el.classList.add(VISIBLE_CLASS);
        el.addEventListener('transitionend', () => el.classList.add(DONE_CLASS), { once: true });

        observer.unobserve(el);
        remaining -= 1;
        if (remaining === 0) observer.disconnect();
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -10% 0px',
    });

    elements.forEach(el => observer.observe(el));

    // If the user enables reduced motion mid-session, finish instantly
    reducedMotion.addEventListener('change', (e) => {
      if (!e.matches) return;
      observer.disconnect();
      revealAll(elements);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
