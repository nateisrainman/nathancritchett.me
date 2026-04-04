// ---- Floating Particles (Zero-Gravity Drift) ----
function createParticles() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const container = document.createElement('div');
  container.classList.add('particles');
  hero.appendChild(container);

  const count = window.innerWidth < 768 ? 10 : 30;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');

    const size = Math.random() * 2 + 1;
    const left = Math.random() * 100;
    const duration = Math.random() * 15 + 10;
    const delay = Math.random() * 15;
    const isWarm = Math.random() > 0.6;

    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = left + '%';
    p.style.animationDuration = duration + 's';
    p.style.animationDelay = delay + 's';

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

// ---- Custom Cursor (removed) ----
function createCustomCursor() {}

// ---- 3D Card Tilt (disabled) ----
function initCardTilt() {}

// ---- Parallax Scrolling ----
function initParallax() {
  const sections = document.querySelectorAll('.about, .thesis, .speaking, .contact');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top + scrollY;
      const offset = (scrollY - sectionTop) * 0.05;

      if (rect.top < window.innerHeight && rect.bottom > 0) {
        section.style.setProperty('--parallax-y', offset + 'px');
      }
    });
  });
}

// ---- Text Reveal on Scroll ----
function initTextReveal() {
  const headlines = document.querySelectorAll('.hero-headline, .section-headline');

  headlines.forEach(headline => {
    const text = headline.innerHTML;
    const words = text.split(/(\s+|<br\s*\/?>)/);
    headline.innerHTML = '';

    words.forEach((word, i) => {
      if (word.match(/^<br/)) {
        headline.innerHTML += '<br>';
      } else if (word.match(/^\s+$/)) {
        headline.innerHTML += ' ';
      } else {
        const span = document.createElement('span');
        span.classList.add('word-reveal');
        span.style.transitionDelay = `${i * 40}ms`;
        span.textContent = word;
        headline.appendChild(span);
        headline.appendChild(document.createTextNode(' '));
      }
    });
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.word-reveal').forEach(word => {
          word.classList.add('revealed');
        });
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  headlines.forEach(h => revealObserver.observe(h));
}

// ---- Wave Canvas (subtle water motif) ----
function createWaveSection() {
  const dividers = document.querySelectorAll('.thesis, .built, .writing, .contact');

  dividers.forEach(section => {
    const wave = document.createElement('div');
    wave.classList.add('wave-divider');
    wave.innerHTML = `<svg viewBox="0 0 1440 60" preserveAspectRatio="none">
      <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,20 1440,30 L1440,0 L0,0 Z" fill="currentColor"/>
    </svg>`;
    section.prepend(wave);
  });
}

// ---- Button Ripple Effect ----
function initButtonRipple() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.classList.add('btn-ripple');
      const rect = this.getBoundingClientRect();
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top = (e.clientY - rect.top) + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

// ---- Nav link active state on scroll ----
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 200;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('nav-active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('nav-active');
      }
    });
  });
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
  createCustomCursor();
  initCardTilt();
  initParallax();
  initTextReveal();
  createWaveSection();
  initButtonRipple();
  initActiveNav();

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
  '.section-label, .thesis-card, .thesis-intro, ' +
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

// ---- Spotify player toggle ----
const spotifyToggle = document.getElementById('spotify-toggle');
const spotifyPlayer = document.getElementById('spotify-player');

if (spotifyToggle && spotifyPlayer) {
  spotifyToggle.addEventListener('click', () => {
    spotifyPlayer.classList.toggle('open');
    spotifyToggle.classList.toggle('active');
  });
}

// ---- Lazy video loading ----
const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const video = entry.target;
      const source = video.querySelector('source[data-src]');
      if (source) {
        source.src = source.dataset.src;
        video.load();
        video.play();
      }
      videoObserver.unobserve(video);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('[data-lazy-video]').forEach(v => videoObserver.observe(v));

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
