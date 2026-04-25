/* ═══════════════════════════════════════════════════════════════════════════
   GrupoCEM — animations.js
   Stack: GSAP 3 + ScrollTrigger + Lenis + IntersectionObserver
   Capa de polish + cinema sobre el MVP (scope aprobado 2026-04-24).
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── 1. GSAP + Lenis init ──────────────────────────────────────────────── */
gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const CAN_HOVER = window.matchMedia('(hover: hover)').matches;
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── 2. IntersectionObserver reveal helper ────────────────────────────── */
function revealOnScroll(selector, { stagger = 0, threshold = 0.15 } = {}) {
  const els = Array.from(document.querySelectorAll(selector));
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      const idx = els.indexOf(entry.target);
      gsap.fromTo(entry.target,
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, delay: idx * stagger, ease: 'power2.out' }
      );
    });
  }, { threshold });

  els.forEach(el => {
    gsap.set(el, { opacity: 0, y: 28 });
    io.observe(el);
  });
}

/* ─── 3. Hero: char-level stagger + "de" italic + video parallax/scale ── */
(function initHero() {
  const h1 = document.querySelector('header h1');
  if (!h1) return;

  // Collect chars walking child nodes to preserve italic flag for <em>de</em>.
  const chars = [];
  Array.from(h1.childNodes).forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      Array.from(node.textContent).forEach(c => chars.push({ char: c, italic: false }));
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'EM') {
      Array.from(node.textContent).forEach(c => chars.push({ char: c, italic: true }));
    }
  });

  h1.textContent = '';
  const charSpans = [];
  let currentWord = null;
  chars.forEach(({ char, italic }) => {
    if (char === ' ') {
      currentWord = null;
      const sp = document.createElement('span');
      sp.className = 'hero-char hero-char-space';
      sp.textContent = ' ';
      h1.appendChild(sp);
      charSpans.push(sp);
    } else {
      if (!currentWord) {
        currentWord = document.createElement('span');
        currentWord.className = 'hero-word';
        h1.appendChild(currentWord);
      }
      const sp = document.createElement('span');
      sp.className = 'hero-char' + (italic ? ' hero-char-em' : '');
      sp.textContent = char;
      currentWord.appendChild(sp);
      charSpans.push(sp);
    }
  });

  const badge    = document.querySelector('header .w-16');
  const subtitle = document.querySelector('header .flex.flex-col.items-center.gap-2');
  const brandLogos = document.querySelectorAll('.hero-brand-logo');
  const tl = gsap.timeline({ delay: 0.2 });

  if (badge) tl.from(badge, { scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' });

  gsap.set(charSpans, { y: 30, opacity: 0, rotate: () => (Math.random() - 0.5) * 3 });
  tl.to(charSpans, {
    y: 0, opacity: 1, rotate: 0,
    duration: 0.7, stagger: 0.03, ease: 'power3.out',
  }, badge ? '-=0.2' : 0);

  if (subtitle) tl.from(subtitle, { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.35');

  if (brandLogos.length) {
    gsap.set(brandLogos, { y: 12, opacity: 0 });
    tl.to(brandLogos, {
      y: 0, opacity: 0.5, duration: 0.5, stagger: 0.08, ease: 'power2.out',
      onComplete() { gsap.set(brandLogos, { clearProps: 'opacity,y' }); },
    }, '-=0.1');
  }

  // Video parallax + scale (1.02 → 1) tied to hero scroll progress.
  const heroVideo = document.querySelector('header video');
  if (heroVideo && !REDUCED_MOTION) {
    gsap.set(heroVideo, { scale: 1.02, transformOrigin: 'center center' });
    gsap.to(heroVideo, {
      yPercent: -8,
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: 'header',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }
})();

/* ─── 4. KPI odometer — digit reels, stagger per KPI ───────────────────── */
(function initKpiOdometer() {
  const kpis = Array.from(document.querySelectorAll('[data-count]'));
  if (!kpis.length) return;

  const kpiColumns = []; // per KPI: array of { col, target }
  kpis.forEach((el) => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const digits = String(target).split('');
    const odo = el.querySelector('.kpi-odometer');
    if (!odo) return;

    odo.textContent = '';
    const cols = [];
    digits.forEach(d => {
      const reel = document.createElement('span');
      reel.className = 'kpi-reel';
      const col = document.createElement('span');
      col.className = 'kpi-reel-column';
      for (let i = 0; i <= 9; i++) {
        const dg = document.createElement('span');
        dg.className = 'kpi-reel-digit';
        dg.textContent = String(i);
        col.appendChild(dg);
      }
      reel.appendChild(col);
      odo.appendChild(reel);
      cols.push({ col, target: +d });
    });
    if (suffix) {
      const suf = document.createElement('span');
      suf.className = 'kpi-suffix';
      suf.textContent = suffix;
      odo.appendChild(suf);
    }
    kpiColumns.push(cols);
  });

  const band = document.getElementById('kpi-band');
  if (!band) return;

  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    kpiColumns.forEach((cols, kpiIdx) => {
      cols.forEach(({ col, target }) => {
        gsap.fromTo(col,
          { y: 0 },
          { y: `-${target}em`, duration: 1.5, ease: 'power3.out', delay: kpiIdx * 0.15 }
        );
      });
    });
  }, { threshold: 0.5 });
  io.observe(band);
})();

/* ─── 5. Section heading reveals ───────────────────────────────────────── */
revealOnScroll('#noticias span.text-primary, #noticias h2',        { stagger: 0.1 });
revealOnScroll('#marcas span.text-primary, #marcas h2',            { stagger: 0.1 });
revealOnScroll('#nosotros span.text-primary, #nosotros h2',        { stagger: 0.1 });

/* ─── 6. Nosotros body, pull-quote, CTA ─────────────────────────────────── */
revealOnScroll('#nosotros .space-y-4 p', { stagger: 0.1 });
revealOnScroll('#nosotros .pt-6',        { stagger: 0 });
revealOnScroll('#nosotros .pull-quote',  { stagger: 0 });

/* ─── 7. Marcas tabs — y-only, never opacity ────────────────────────────── */
(function revealBrandTabs() {
  const tabs = Array.from(document.querySelectorAll('.brand-tab'));
  if (!tabs.length) return;

  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    gsap.from(tabs, { y: 18, duration: 0.5, stagger: 0.08, ease: 'power2.out', clearProps: 'transform' });
  }, { threshold: 0.2 });

  io.observe(tabs[0]);
})();

/* ─── 7b. Marcas accordion rows: stagger reveal one-by-one al entrar viewport */
(function revealBrandRows() {
  const rows = Array.from(document.querySelectorAll('.brand-row'));
  if (!rows.length) return;

  // Estado inicial oculto antes del reveal.
  gsap.set(rows, { opacity: 0, y: 44 });

  const accordion = document.querySelector('.brand-accordion') || rows[0];
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    gsap.to(rows, {
      opacity: 1,
      y: 0,
      duration: 1.0,
      stagger: 0.45,
      ease: 'expo.out',
      clearProps: 'transform',
    });
  }, { threshold: 0.15 });
  io.observe(accordion);
})();

/* ─── 8. Nosotros: img fade-in suave + parallax scrub ──────────────────── */
const nosotrosImg = document.querySelector('#nosotros img.rounded-2xl');
if (nosotrosImg) {
  // Reveal simple: opacity + scale sutil. Nunca queda oculta permanentemente.
  const fadeIo = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    fadeIo.disconnect();
    gsap.fromTo(nosotrosImg,
      { opacity: 0, scale: 1.04 },
      { opacity: 1, scale: 1, duration: 1.1, ease: 'expo.out' }
    );
  }, { threshold: 0.15 });
  fadeIo.observe(nosotrosImg);

  gsap.to(nosotrosImg, {
    yPercent: -12, ease: 'none',
    scrollTrigger: { trigger: '#nosotros', start: 'top bottom', end: 'bottom top', scrub: true },
  });
}

const medallion1974 = document.querySelector('#nosotros .medallion-1974');
if (medallion1974) {
  gsap.set(medallion1974, { opacity: 0, scale: 0, rotation: -22 });
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    gsap.to(medallion1974, { opacity: 1, scale: 1, rotation: -4, duration: 0.75, ease: 'back.out(1.8)' });
  }, { threshold: 0.3 });
  io.observe(medallion1974);
}

/* ─── 9. Noticias cards: stagger when rendered (MutationObserver) ────────── */
(function observeNewsGrid() {
  const newsGrid = document.getElementById('news-grid');
  if (!newsGrid) return;

  let animated = false;
  const animate = () => {
    if (animated) return;
    const items = newsGrid.querySelectorAll('.nc-hero, .nc-mini');
    if (!items.length) return;
    animated = true;

    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      gsap.from(Array.from(items), { y: 20, opacity: 0, stagger: 0.08, duration: 0.5, ease: 'power2.out' });
    }, { threshold: 0.1 });

    io.observe(newsGrid);
  };

  const mo = new MutationObserver(() => animate());
  mo.observe(newsGrid, { childList: true });
  setTimeout(animate, 100);
})();

/* ─── 10. showBrand() crossfade + stagger pills + ghost index reveal ───── */
const PANEL_COLORS = { carnave: '#b71c1c', avigan: '#2e7d32', cia: '#C8860A', ovo: '#0277BD' };

function revealBrandPanel(panel) {
  const ghost = panel.querySelector('.panel-index');
  const logo  = panel.querySelector('.flex.flex-col img');
  const tag   = panel.querySelector('.panel-brand-tag');
  const desc  = panel.querySelector('.md\\:col-span-2 > p');
  const pills = panel.querySelectorAll('.md\\:col-span-2 .grid > div');
  const cta   = panel.querySelector('a.inline-flex');

  const tl = gsap.timeline();
  tl.fromTo(panel, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
  if (ghost) tl.fromTo(ghost, { opacity: 0, x: 40 }, { opacity: 0.06, x: 0, duration: 0.9, ease: 'expo.out' }, 0);
  if (logo)  tl.fromTo(logo,  { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }, 0.05);
  if (tag)   tl.fromTo(tag,   { opacity: 0, y: 8 }, { opacity: 0.75, y: 0, duration: 0.4, ease: 'power2.out' }, 0.1);
  if (cta)   tl.fromTo(cta,   { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.15);
  if (desc)  tl.fromTo(desc,  { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.1);
  if (pills.length) tl.fromTo(pills, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.42, stagger: 0.055, ease: 'power2.out' }, 0.15);
}

window.showBrand = function(id) {
  const current = document.querySelector('.brand-panel:not(.hidden)');
  const next    = document.getElementById('panel-' + id);
  if (!next || current === next) return;

  const applyTab = () => {
    document.querySelectorAll('.brand-tab').forEach(t => {
      t.style.borderBottomColor = 'transparent';
      t.style.backgroundColor   = '';
      t.classList.remove('active-mustard');
    });
    const tab = document.getElementById('tab-' + id);
    if (tab) {
      tab.style.borderBottomColor = PANEL_COLORS[id] || '#b71c1c';
      tab.style.backgroundColor   = 'white';
      tab.classList.add('active-mustard');
    }
  };

  if (!current) {
    next.classList.remove('hidden');
    applyTab();
    revealBrandPanel(next);
    return;
  }

  gsap.to(current, {
    opacity: 0, duration: 0.18,
    onComplete: () => {
      document.querySelectorAll('.brand-panel').forEach(p => {
        p.classList.add('hidden');
        gsap.set(p, { opacity: 1 });
      });
      applyTab();
      next.classList.remove('hidden');
      revealBrandPanel(next);
    },
  });
};

/* ─── 11. Cinematic anchor scroll ──────────────────────────────────────── */
const easeExpoOut = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href   = link.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: 1.4, easing: easeExpoOut });
  });
});

/* ─── 12. Nav hover: underline scaleX ──────────────────────────────────── */
document.querySelectorAll('nav a[href^="#"]').forEach(link => {
  const line = document.createElement('span');
  line.style.cssText = 'position:absolute;bottom:-2px;left:0;right:0;height:2px;background:currentColor;transform-origin:center;transform:scaleX(0);pointer-events:none';
  link.style.position = 'relative';
  link.appendChild(line);
  link.addEventListener('mouseenter', () => gsap.to(line, { scaleX: 1, duration: 0.25, ease: 'power2.out' }));
  link.addEventListener('mouseleave', () => gsap.to(line, { scaleX: 0, duration: 0.2,  ease: 'power2.in'  }));
});

/* ─── 13. Hero brand logos: canvas white-on-transparent processing ──────── */
(function processHeroLogos() {
  document.querySelectorAll('.hero-brand-logo img').forEach(img => {
    const process = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          const a = d[i + 3];
          if (a < 10) continue;
          const lum = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
          if (lum > 210) {
            d[i + 3] = 0;
          } else {
            d[i] = 255; d[i+1] = 255; d[i+2] = 255;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        img.src = canvas.toDataURL('image/png');
        img.style.filter = 'none';
        img.style.opacity = '1';
      } catch (e) {
        img.style.filter = 'brightness(0) invert(1)';
        img.style.opacity = '0.6';
      }
    };
    if (img.complete && img.naturalWidth > 0) process();
    else img.addEventListener('load', process, { once: true });
  });
})();

/* ─── 14. Magnetic CTAs (bg-primary buttons/links) + mustard ripple ─────── */
(function magneticCTAs() {
  document.querySelectorAll('.bg-primary').forEach(btn => {
    if (btn.tagName !== 'BUTTON' && btn.tagName !== 'A') return;

    // Ripple (funciona en desktop y mobile).
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      if (!btn.style.position || btn.style.position === 'static') btn.style.position = 'relative';
      if (!btn.style.overflow || btn.style.overflow === 'visible') btn.style.overflow = 'hidden';
      const ripple = document.createElement('span');
      ripple.className = 'cta-ripple';
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top  = (e.clientY - rect.top)  + 'px';
      btn.appendChild(ripple);
      gsap.fromTo(ripple,
        { scale: 0, opacity: 0.55 },
        { scale: 14, opacity: 0, duration: 0.65, ease: 'power2.out', onComplete: () => ripple.remove() }
      );
    });

    if (!CAN_HOVER) return; // Magnetic sólo en desktop hover.

    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width  / 2;
      const y = e.clientY - rect.top  - rect.height / 2;
      gsap.to(btn, { x: x * 0.22, y: y * 0.22, duration: 0.3, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.5)' });
    });
  });
})();

/* ─── 15. Timeline SVG: intersection reveal + draw + hits pulse ────────── */
(function initTimeline() {
  const wrap = document.querySelector('.timeline-wrap');
  const path = document.querySelector('.timeline-svg-path');
  if (!wrap || !path) return;

  const pathLen = path.getTotalLength();
  gsap.set(path, { strokeDasharray: pathLen, strokeDashoffset: pathLen });

  const hits = document.querySelectorAll('.timeline-hit');
  const circles = document.querySelectorAll('.timeline-hit circle');
  const years = document.querySelectorAll('.timeline-hit text.year');
  const labels = document.querySelectorAll('.timeline-hit text.label');

  gsap.set(hits,   { opacity: 0 });
  gsap.set(circles,{ scale: 0, transformOrigin: '50% 50%' });
  gsap.set(years,  { opacity: 0, y: 16 });
  gsap.set(labels, { opacity: 0, y: -10 });

  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    const tl = gsap.timeline();
    tl.to(path, { strokeDashoffset: 0, duration: 1.8, ease: 'power3.out' });
    tl.to(hits, { opacity: 1, duration: 0.2, stagger: 0.22 }, 0.1);
    tl.to(circles, { scale: 1, duration: 0.55, stagger: 0.22, ease: 'back.out(2.2)' }, 0.1);
    tl.to(years, { opacity: 1, y: 0, duration: 0.55, stagger: 0.22, ease: 'power3.out' }, 0.2);
    tl.to(labels, { opacity: 1, y: 0, duration: 0.5, stagger: 0.22, ease: 'power2.out' }, 0.3);
    // Subtle pulse on all dots after reveal
    gsap.to(circles, {
      scale: 1.15, duration: 1.4, ease: 'sine.inOut',
      yoyo: true, repeat: -1, stagger: { each: 0.3, from: 'random' },
      delay: 2.5,
      transformOrigin: '50% 50%',
    });
  }, { threshold: 0.3 });
  io.observe(wrap);
})();

/* ─── 16. Section transition: mustard rule (marcas → nosotros) ─────────── */
(function sectionRule() {
  const rule = document.getElementById('rule-marcas-nosotros');
  if (!rule) return;
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    gsap.timeline()
      .to(rule, { width: '100%', opacity: 1, duration: 0.6, ease: 'expo.out' })
      .to(rule, { opacity: 0, duration: 0.45, ease: 'power1.in' }, '+=0.3');
  }, { threshold: 0.6 });
  io.observe(rule);
})();

/* ─── 17. KPI band subtle parallax (reemplaza el pin, no genera blank space) */
(function kpiParallax() {
  const band = document.getElementById('kpi-band');
  if (!band || REDUCED_MOTION) return;
  const inner = band.querySelector('div');
  if (!inner) return;
  gsap.to(inner, {
    yPercent: -10,
    ease: 'none',
    scrollTrigger: {
      trigger: band,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  });
})();

/* ─── 18. Fonts-ready refresh for ScrollTrigger ────────────────────────── */
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
