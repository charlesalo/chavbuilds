/* ============================================
   CHARLES MARVIN ALO — PORTFOLIO
   main.js
   ============================================ */

// ── SHARED MOTION TOKENS (resolved once for the Web Animations API) ──
const MOTION = (() => {
  const s = getComputedStyle(document.documentElement);
  return {
    easeOut: s.getPropertyValue('--ease-out').trim() || 'ease-out',
    easePremium: s.getPropertyValue('--ease-premium').trim() || 'ease-out',
  };
})();

// ── NAV: scroll state ──────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── NAV: mobile hamburger ──────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');

hamburger.addEventListener('click', () => {
  navMobile.classList.toggle('open');
});

// Close mobile nav when a link is clicked
navMobile.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navMobile.classList.remove('open'));
});

// ── ACTIVE NAV LINK on scroll ──────────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a, .nav-mobile a');

function updateActiveNav() {
  const scrollY = window.scrollY + 100;
  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    if (scrollY >= top && scrollY < top + height) {
      navAnchors.forEach(a => {
        a.classList.toggle('nav-active', a.getAttribute('href') === `#${id}`);
      });
    }
  });
}
window.addEventListener('scroll', updateActiveNav, { passive: true });

// ── SLIDER ────────────────────────────────────────────────────
function initSlider(wrapperId, dotsId) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  const clip = wrapper.querySelector('.slider-clip');
  const track = wrapper.querySelector('.slider-track');
  const cards = Array.from(track.querySelectorAll('.project-card'));
  const dotsContainer = document.getElementById(dotsId);
  const prevBtn = wrapper.querySelector('.slider-prev');
  const nextBtn = wrapper.querySelector('.slider-next');

  if (!cards.length) return;

  // How many cards visible at once depends on card width vs clip width
  function visibleCount() {
    const clipW = clip.offsetWidth;
    const cardW = cards[0].offsetWidth;
    return Math.round(clipW / cardW) || 1;
  }

  let current = 0;

  function totalSteps() {
    return Math.ceil(cards.length / visibleCount());
  }

  function buildDots() {
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalSteps(); i++) {
      const dot = document.createElement('button');
      dot.className = 'slider-dot' + (i === current ? ' active' : '');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    }
  }

  function goTo(index) {
    const steps = totalSteps();
    current = Math.max(0, Math.min(index, steps - 1));

    const cardW = cards[0].offsetWidth + 24; // 24 = gap (1.5rem)
    const perPage = visibleCount();
    track.style.transform = `translateX(-${current * perPage * cardW}px)`;
    track.style.transition = 'transform var(--duration-medium) var(--ease-out)';

    // Update dots
    dotsContainer.querySelectorAll('.slider-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current >= steps - 1;
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  // Rebuild on resize
  window.addEventListener('resize', () => {
    current = 0;
    buildDots();
    goTo(0);
  });

  buildDots();
  goTo(0);
}

initSlider('tab-templates', 'dots-templates');
initSlider('tab-websites', 'dots-websites');
initSlider('tab-tools', 'dots-tools');

// ── WORK TABS (FLIP transition) ────────────────────────────────
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = {
  templates: document.getElementById('tab-templates'),
  websites: document.getElementById('tab-websites'),
  tools: document.getElementById('tab-tools'),
};
const tabIntros = {
  templates: document.getElementById('templates-intro'),
  websites: document.getElementById('websites-intro'),
  tools: document.getElementById('tools-intro'),
};
const tabsReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let activeTab = 'templates';
let tabSwitching = false;

// Instant swap — the final state both paths land on
function showTab(target) {
  Object.entries(tabIntros).forEach(([key, intro]) => {
    if (intro) intro.style.display = key === target ? '' : 'none';
  });
  Object.entries(tabPanels).forEach(([key, panel]) => {
    panel.classList.toggle('hidden', key !== target);
  });
  initSlider(`tab-${target}`, `dots-${target}`);
}

function enterTab(newPanel, firstHeight) {
  // LAST: measure the incoming panel, then INVERT + PLAY the
  // height difference so content below never jumps
  const lastHeight = newPanel.offsetHeight;
  if (Math.abs(lastHeight - firstHeight) > 1) {
    newPanel.style.overflow = 'hidden';
    const heightAnim = newPanel.animate(
      [{ height: `${firstHeight}px` }, { height: `${lastHeight}px` }],
      { duration: 400, easing: MOTION.easePremium }
    );
    heightAnim.onfinish = () => { newPanel.style.overflow = ''; };
  }

  newPanel.animate(
    [{ opacity: 0 }, { opacity: 1 }],
    { duration: 200, easing: MOTION.easeOut }
  );

  newPanel.querySelectorAll('.project-card').forEach((card, i) => {
    // Settle the scroll-reveal state up front, suppressing its
    // transition so it can't replay underneath this entrance
    card.style.transition = 'none';
    card.classList.add('is-visible', 'is-done');
    void card.offsetWidth;
    card.style.transition = '';
    card.animate(
      [
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 400, delay: i * 70, easing: MOTION.easePremium, fill: 'backwards' }
    );
  });
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    if (target === activeTab || tabSwitching) return;

    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const oldPanel = tabPanels[activeTab];
    const newPanel = tabPanels[target];
    activeTab = target;

    if (tabsReducedMotion.matches || !oldPanel.animate) {
      showTab(target);
      return;
    }

    tabSwitching = true;

    // FIRST: measure the outgoing panel before anything changes
    const firstHeight = oldPanel.offsetHeight;

    const exit = oldPanel.animate(
      [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(8px)' },
      ],
      { duration: 200, easing: MOTION.easeOut, fill: 'forwards' }
    );

    exit.onfinish = () => {
      showTab(target);
      exit.cancel(); // hidden now; drop the forwards fill
      enterTab(newPanel, firstHeight);
      tabSwitching = false;
    };
  });
});

// Scroll-in reveals are handled by js/motion.js (.animate-on-scroll)

// ── CONTACT FORM (Web3Forms) ───────────────────────────────────
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

function isValidEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

function setFieldError(groupId, errorId, message) {
  document.getElementById(groupId)?.classList.add('has-error');
  const el = document.getElementById(errorId);
  if (el) el.textContent = message;
}

function clearFieldError(groupId, errorId) {
  document.getElementById(groupId)?.classList.remove('has-error');
  const el = document.getElementById(errorId);
  if (el) el.textContent = '';
}

function validateForm() {
  let valid = true;

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();

  if (!name) {
    setFieldError('group-name', 'error-name', 'Name is required.');
    valid = false;
  } else {
    clearFieldError('group-name', 'error-name');
  }

  if (!email) {
    setFieldError('group-email', 'error-email', 'Email is required.');
    valid = false;
  } else if (!isValidEmail(email)) {
    setFieldError('group-email', 'error-email', 'Please enter a valid email address.');
    valid = false;
  } else {
    clearFieldError('group-email', 'error-email');
  }

  if (!message) {
    setFieldError('group-message', 'error-message', 'Message is required.');
    valid = false;
  } else {
    clearFieldError('group-message', 'error-message');
  }

  return valid;
}

if (contactForm) {
  // Clear field error as user types
  ['name', 'email', 'message'].forEach(fieldId => {
    document.getElementById(fieldId)?.addEventListener('input', () => {
      clearFieldError(`group-${fieldId}`, `error-${fieldId}`);
    });
  });

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const btn = contactForm.querySelector('button[type="submit"]');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    formStatus.textContent = '';
    formStatus.className = 'form-note';

    try {
      const data = new FormData(contactForm);
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data,
      });
      const json = await res.json();

      if (json.success) {
        formStatus.textContent = "Thanks — I'll get back to you soon!";
        formStatus.classList.add('form-success');
        contactForm.reset();
      } else {
        formStatus.textContent = 'Something went wrong. Please try again or email me directly.';
        formStatus.classList.add('form-error');
      }
    } catch {
      formStatus.textContent = 'Network error. Please try again.';
      formStatus.classList.add('form-error');
    }

    btn.textContent = 'Send Message';
    btn.disabled = false;
  });
}

// ── STAT COUNTERS ──────────────────────────────────────────────
function animateCounter(el, target, suffix, duration) {
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    counterObserver.unobserve(entry.target);
    const raw = entry.target.dataset.count;
    const suffix = entry.target.dataset.suffix || '';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      entry.target.textContent = raw + suffix;
    } else {
      animateCounter(entry.target, parseInt(raw, 10), suffix, 800);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.meta-num').forEach(el => {
  const text = el.textContent.trim();
  const match = text.match(/^(\d+)(.*)$/);
  if (!match) return;
  el.dataset.count = match[1];
  el.dataset.suffix = match[2];
  el.textContent = '0' + match[2];
  counterObserver.observe(el);
});

// ── BACK TO TOP ────────────────────────────────────────────────
const backToTop = document.getElementById('back-to-top');
const contactSection = document.getElementById('contact');

const bttObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    backToTop.classList.toggle('visible', entry.isIntersecting);
  });
}, { threshold: 0.1 });

if (contactSection) bttObserver.observe(contactSection);

backToTop.addEventListener('click', () => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
});

// ── SMOOTH ACTIVE NAV STYLING ──────────────────────────────────
const style = document.createElement('style');
style.textContent = `.nav-active { color: var(--white) !important; }`;
document.head.appendChild(style);
