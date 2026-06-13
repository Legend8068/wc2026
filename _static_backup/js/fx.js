/* ============================================================
   WC2026 — Motion effects
   Scroll reveals, stat count-ups and the champion confetti.
   ============================================================ */
window.WC = window.WC || {};

WC.fx = (() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* fade-up sections & cards as they scroll into view */
  function reveals() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(n => io.observe(n));
  }

  /* count the hero stat numbers up from zero on first view */
  function countUps() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const node = e.target;
        const target = parseInt(node.dataset.count, 10);
        if (reduced || isNaN(target)) { node.textContent = node.dataset.count; return; }
        const t0 = performance.now(), dur = 1400;
        const step = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          node.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-count]').forEach(n => io.observe(n));
  }

  /* gold & vermilion confetti when a champion is crowned */
  function confetti() {
    if (reduced) return;
    const colors = ['#e8b84b', '#d5372a', '#f4ead6', '#f3d79c', '#e8503e'];
    for (let i = 0; i < 120; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      const size = 6 + Math.random() * 8;
      c.style.cssText = `
        left:${Math.random() * 100}vw;
        width:${size}px;height:${size * (0.5 + Math.random())}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        animation-duration:${2.4 + Math.random() * 2.6}s;
        animation-delay:${Math.random() * 1.4}s;`;
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 7000);
    }
  }

  function init() {
    reveals();
    countUps();
  }

  return { init, confetti };
})();
