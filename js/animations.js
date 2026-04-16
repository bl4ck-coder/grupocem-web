/* ═══════════════════════════════════════════════════════════════════════════
   GrupoCEM — animations.js
   Stack: GSAP 3 + ScrollTrigger (parallax only) + Lenis + IntersectionObserver
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── 1. GSAP + Lenis init ──────────────────────────────────────────────── */
gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ─── 2. IntersectionObserver reveal helper ────────────────────────────── */
// Reliable alternative to ScrollTrigger for simple fade/slide reveals.
// Elements are NEVER set invisible before the observer fires.
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

/* ─── 3. Hero: word stagger on load ────────────────────────────────────── */
(function initHero() {
  const h1 = document.querySelector('header h1');
  if (!h1) return;

  const words = h1.textContent.trim().split(' ');
  h1.textContent = '';
  const innerSpans = [];

  words.forEach((word, i) => {
    const outer = document.createElement('span');
    outer.style.cssText = 'display:inline-block;overflow:hidden;padding-bottom:0.1em;vertical-align:bottom';
    const inner = document.createElement('span');
    inner.style.display = 'inline-block';
    inner.textContent = word;
    outer.appendChild(inner);
    h1.appendChild(outer);
    innerSpans.push(inner);
    if (i < words.length - 1) h1.appendChild(document.createTextNode(' '));
  });

  const badge    = document.querySelector('header .w-24');
  const subtitle = document.querySelector('header .flex.flex-col');
  const tl = gsap.timeline({ delay: 0.2 });

  if (badge) tl.from(badge, { scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' });

  tl.from(innerSpans, {
    y: '105%', opacity: 0, duration: 0.75, stagger: 0.08, ease: 'power3.out',
  }, badge ? '-=0.2' : 0);

  if (subtitle) tl.from(subtitle, { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3');

  // Brand logos entrance — animate to 0.5 then clearProps so CSS hover takes over
  const brandLogos = document.querySelectorAll('.hero-brand-logo');
  if (brandLogos.length) {
    gsap.set(brandLogos, { y: 12, opacity: 0 });
    tl.to(brandLogos, {
      y: 0, opacity: 0.5, duration: 0.5, stagger: 0.08, ease: 'power2.out',
      onComplete() { gsap.set(brandLogos, { clearProps: 'opacity,y' }); },
    }, '-=0.1');
  }
})();

/* ─── 4. KPI counters ───────────────────────────────────────────────────── */
document.querySelectorAll('[data-count]').forEach(el => {
  const target = +el.dataset.count;
  const suffix = el.dataset.suffix || '';
  const obj    = { val: 0 };

  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    gsap.to(obj, {
      val: target, duration: 1.8, ease: 'expo.out',
      onUpdate() { el.textContent = Math.round(obj.val) + suffix; },
    });
  }, { threshold: 0.5 });

  io.observe(el);
});

/* ─── 5. Section heading reveals ───────────────────────────────────────── */
revealOnScroll('#noticias span.text-primary, #noticias h2',        { stagger: 0.1 });
revealOnScroll('#marcas span.text-primary, #marcas h2',            { stagger: 0.1 });
revealOnScroll('#nosotros span.text-primary, #nosotros h2',        { stagger: 0.1 });

/* ─── 6. Nosotros body paragraphs ───────────────────────────────────────── */
revealOnScroll('#nosotros .space-y-4 p', { stagger: 0.1 });
revealOnScroll('#nosotros .pt-6',        { stagger: 0 });

/* ─── 7. Marcas tabs — y-only, never opacity ────────────────────────────── */
// No opacity involved: tabs are always visible, just slide in
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

/* ─── 8. Nosotros: image parallax (ScrollTrigger scrub) + badge spring ──── */
const nosotrosImg = document.querySelector('#nosotros img.rounded-2xl');
if (nosotrosImg) {
  gsap.to(nosotrosImg, {
    yPercent: -12, ease: 'none',
    scrollTrigger: { trigger: '#nosotros', start: 'top bottom', end: 'bottom top', scrub: true },
  });
}

const badge1974 = document.querySelector('#nosotros .absolute.-bottom-6');
if (badge1974) {
  gsap.set(badge1974, { opacity: 0, scale: 0, rotation: -10 });
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    gsap.to(badge1974, { opacity: 1, scale: 1, rotation: 0, duration: 0.65, ease: 'back.out(1.8)' });
  }, { threshold: 0.3 });
  io.observe(badge1974);
}

/* ─── 9. Noticias cards: stagger when rendered (MutationObserver) ────────── */
(function observeNewsGrid() {
  const newsGrid = document.getElementById('news-grid');
  if (!newsGrid) return;

  let animated = false;
  const animate = () => {
    if (animated) return;
    const items = newsGrid.querySelectorAll('.nc-panel, .nc-tab-item');
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

/* ─── 10. showBrand() crossfade override ───────────────────────────────── */
const PANEL_COLORS = { carnave: '#b71c1c', avigan: '#2e7d32', cia: '#C8860A', ovo: '#0277BD' };

window.showBrand = function(id) {
  const current = document.querySelector('.brand-panel:not(.hidden)');
  const next    = document.getElementById('panel-' + id);
  if (!next || current === next) return;

  const applyTab = () => {
    document.querySelectorAll('.brand-tab').forEach(t => {
      t.style.borderBottomColor = 'transparent';
      t.style.backgroundColor   = '';
    });
    const tab = document.getElementById('tab-' + id);
    if (tab) {
      tab.style.borderBottomColor = PANEL_COLORS[id] || '#b71c1c';
      tab.style.backgroundColor   = 'white';
    }
  };

  if (!current) {
    next.classList.remove('hidden');
    applyTab();
    gsap.fromTo(next, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
    return;
  }

  gsap.to(current, {
    opacity: 0, duration: 0.15,
    onComplete: () => {
      document.querySelectorAll('.brand-panel').forEach(p => {
        p.classList.add('hidden');
        gsap.set(p, { opacity: 1 });
      });
      applyTab();
      next.classList.remove('hidden');
      gsap.fromTo(next, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
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
          if (a < 10) continue;                             // already transparent
          const lum = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
          if (lum > 210) {
            d[i + 3] = 0;                                   // near-white → transparent
          } else {
            d[i] = 255; d[i+1] = 255; d[i+2] = 255;        // logo content → white
          }
        }
        ctx.putImageData(imageData, 0, 0);
        img.src = canvas.toDataURL('image/png');
        img.style.filter = 'none';
        img.style.opacity = '1';   // parent .hero-brand-logo controls final opacity via GSAP
      } catch (e) {
        // CORS fallback: show with best-effort filter
        img.style.filter = 'brightness(0) invert(1)';
        img.style.opacity = '0.6';
      }
    };
    if (img.complete && img.naturalWidth > 0) process();
    else img.addEventListener('load', process, { once: true });
  });
})();

/* ─── 14. CTA button hover scale ───────────────────────────────────────── */
document.querySelectorAll('.bg-primary').forEach(btn => {
  if (btn.tagName !== 'BUTTON' && btn.tagName !== 'A') return;
  btn.addEventListener('mouseenter', () => gsap.to(btn, { scale: 1.03, duration: 0.2, ease: 'power2.out' }));
  btn.addEventListener('mouseleave', () => gsap.to(btn, { scale: 1,    duration: 0.2, ease: 'power2.out' }));
});
