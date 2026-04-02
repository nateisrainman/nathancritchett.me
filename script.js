// ---- Nav scroll effect ----
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

// Close mobile nav on link click
links.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => links.classList.remove('open'));
});

// ---- Hero entrance animations ----
document.addEventListener('DOMContentLoaded', () => {
  const heroEls = document.querySelectorAll('.hero .animate-in');
  heroEls.forEach(el => {
    const delay = parseInt(el.dataset.delay || 0) * 150;
    setTimeout(() => el.classList.add('visible'), 300 + delay);
  });
});

// ---- Scroll-triggered fade-ups ----
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

// Add fade-up to section elements
document.querySelectorAll('.section-label, .section-headline, .thesis-card, .stat-card, .work-card, .writing-category, .writing-item, .keynote-item, .testimonial-card, .contact-inner').forEach(el => {
  el.classList.add('fade-up');
  observer.observe(el);
});

// Stagger cards within groups
document.querySelectorAll('.thesis-grid, .stats-scroll, .work-grid, .testimonial-scroll').forEach(grid => {
  grid.querySelectorAll('.fade-up').forEach((card, i) => {
    card.style.transitionDelay = `${i * 100}ms`;
  });
});

// ---- Smooth scroll for anchor links ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
