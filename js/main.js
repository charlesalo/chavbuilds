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

    // Toggle intros
    if (workIntro) workIntro.style.display = target === 'websites' ? '' : 'none';
    if (toolsIntro) toolsIntro.style.display = target === 'tools' ? '' : 'none';

    Object.entries(tabPanels).forEach(([key, panel]) => {
      panel.classList.toggle('hidden', key !== target);
    });

    // Re-trigger animations for newly visible cards
    tabPanels[target].querySelectorAll('[data-aos]').forEach(el => {
      el.classList.remove('visible');
      requestAnimationFrame(() => {
        setTimeout(() => el.classList.add('visible'), 50);
      });
    });
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

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
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
