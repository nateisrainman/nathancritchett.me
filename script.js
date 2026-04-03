// ---- Floating Particles (Zero-Gravity Drift) ----
function createParticles() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const container = document.createElement('div');
  container.classList.add('particles');
  hero.appendChild(container);

  const count = 30;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');

    const size = Math.random() * 2 + 1;
    const left = Math.random() * 100;
    const duration = Math.random() * 15 + 10;
    const delay = Math.random() * 15;
    const drift = (Math.random() - 0.5) * 80;
    const isWarm = Math.random() > 0.6;

    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = left + '%';
    p.style.animationDuration = duration + 's';
    p.style.animationDelay = delay + 's';
    p.style.setProperty('--drift', drift + 'px');

    if (isWarm) {
      p.style.background = '#C4874D';
      p.style.boxShadow = '0 0 6px rgba(196, 135, 77, 0.4)';
    } else {
      p.style.background = '#00D4B8';
      p.style.boxShadow = '0 0 6px rgba(0, 212, 184, 0.4)';
    }

    container.appendChild(p);
  }
}

// ---- Nav scroll ----
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
});

// ---- Mobile nav toggle ----
const toggle = document.getElementById('nav-toggle');
const links = document.getElementById('nav-links');

toggle.addEventListener('click', () => {
  links.classList.toggle('open');
});

links.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => links.classList.remove('open'));
});

// ---- Hero entrance ----
document.addEventListener('DOMContentLoaded', () => {
  createParticles();

  const heroEls = document.querySelectorAll('.hero .animate-in');
  heroEls.forEach(el => {
    const delay = parseInt(el.dataset.delay || 0) * 150;
    setTimeout(() => el.classList.add('visible'), 300 + delay);
  });
});

// ---- Scroll fade-ups ----
const observerOptions = {
  threshold: 0.05,
  rootMargin: '0px 0px 0px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll(
  '.section-label, .section-headline, .thesis-card, .thesis-intro, ' +
  '.stat-card, .work-card, .writing-category, .writing-item, ' +
  '.keynote-item, .testimonial-card, .contact-inner, .built-card, .built-intro'
).forEach(el => {
  el.classList.add('fade-up');
  observer.observe(el);
});

// Stagger children
document.querySelectorAll('.thesis-grid, .stats-scroll, .work-grid, .testimonial-scroll, .built-grid').forEach(grid => {
  grid.querySelectorAll('.fade-up').forEach((card, i) => {
    card.style.transitionDelay = `${i * 100}ms`;
  });
});

// ---- Stat number countup ----
function animateCount(el) {
  const target = el.textContent.trim();
  const numMatch = target.match(/(\d+)/);
  if (!numMatch) return;

  const num = parseInt(numMatch[1]);
  const suffix = target.replace(numMatch[1], '');
  const duration = 1500;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * num);
    el.textContent = current + suffix;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = target;
    }
  }

  requestAnimationFrame(step);
}

const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCount(entry.target);
      countObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.stat-number').forEach(el => {
  countObserver.observe(el);
});

// ---- Smooth scroll ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ---- Subtle parallax on god rays ----
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  document.querySelectorAll('.about::before, .thesis::before, .contact::before').forEach(el => {
    // CSS pseudo-elements can't be targeted directly, so we use transform on parent
  });
});
