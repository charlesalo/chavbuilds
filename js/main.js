/* ============================================
   CHARLES MARVIN ALO — PORTFOLIO
   main.js
   ============================================ */

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
    track.style.transition = 'transform 0.4s ease';

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

initSlider('tab-websites', 'dots-websites');
initSlider('tab-tools', 'dots-tools');

// ── WORK TABS ──────────────────────────────────────────────────
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = {
  websites: document.getElementById('tab-websites'),
  tools: document.getElementById('tab-tools'),
};
const workIntro = document.querySelector('.work-intro:not(#tools-intro)');
const toolsIntro = document.getElementById('tools-intro');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;

    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (workIntro) workIntro.style.display = target === 'websites' ? '' : 'none';
    if (toolsIntro) toolsIntro.style.display = target === 'tools' ? '' : 'none';

    Object.entries(tabPanels).forEach(([key, panel]) => {
      panel.classList.toggle('hidden', key !== target);
    });

    // Re-init slider for newly visible tab
    if (target === 'websites') initSlider('tab-websites', 'dots-websites');
    if (target === 'tools') initSlider('tab-tools', 'dots-tools');
  });
});

// ── SCROLL-IN ANIMATIONS ───────────────────────────────────────
const aosObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      aosObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('[data-aos]').forEach((el, i) => {
  el.style.transitionDelay = `${i * 80}ms`;
  aosObserver.observe(el);
});

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
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── SMOOTH ACTIVE NAV STYLING ──────────────────────────────────
const style = document.createElement('style');
style.textContent = `.nav-active { color: var(--white) !important; }`;
document.head.appendChild(style);
