/* ═══════════════════════════════════════════════════════════════════════════
   GrupoCEM — main.js
   - Nav sticky + active links on scroll
   - Hamburger mobile menu
   - Noticias desde /api/news (admin gestionado vía /admin/)
   ═══════════════════════════════════════════════════════════════════════════ */

const NEWS_ENDPOINT = '/api/news';

/* ─── Año en footer ──────────────────────────────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ─── Nav: scroll shadow ─────────────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 10);
  updateActiveLink();
}, { passive: true });

/* ─── Nav: active link al hacer scroll ──────────────────────────────────── */
const sections = document.querySelectorAll('section[id], footer[id]');
const navLinks = document.querySelectorAll('nav a[href^="#"]');

const ACTIVE_CLASSES   = ['text-primary', 'font-bold', 'border-b-2', 'border-primary'];
const INACTIVE_CLASSES = ['text-on-surface'];

function updateActiveLink() {
  let current = '';
  const nearBottom = (window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 60;

  if (nearBottom) {
    current = 'contacto';
  } else {
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 100) current = sec.id;
    });
  }

  navLinks.forEach(link => {
    const href = link.getAttribute('href').replace('#', '');
    const active = href === current;
    ACTIVE_CLASSES.forEach(c   => link.classList.toggle(c, active));
    INACTIVE_CLASSES.forEach(c => link.classList.toggle(c, !active));
  });
}

/* ─── Hamburger ──────────────────────────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const navMenu   = document.getElementById('nav-links');

if (hamburger && navMenu) {
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    navMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
  });
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ─── Noticias desde Google Sheets ──────────────────────────────────────── */
const newsGrid = document.getElementById('news-grid');

const BRAND_COLORS = {
  carnave:  '#c0392b',
  avigan:   '#2e7d32',
  avicola:  '#1565c0',
  ovofood:  '#e65100',
  grupocem: '#8b6914',
};

function sanitizeText(str) {
  return String(str || '').slice(0, 500);
}

function sanitizeUrl(str) {
  const s = String(str || '').trim();
  if (!s) return '';
  if (/^https?:\/\//.test(s)) return s;
  // Permitimos paths relativos locales (ej. assets/news/...)
  if (/^[\w./-]+\.(jpg|jpeg|png|webp|gif|avif)$/i.test(s)) return s;
  return '';
}

/* Placeholder mustard si la imagen no carga: SVG inline 1x1 cream con monograma marca. */
function mediaPlaceholderURL(brand) {
  const initial = (brand || 'CEM').slice(0, 1).toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23fdfcf0'/><stop offset='1' stop-color='%23ede9d9'/></linearGradient></defs><rect width='800' height='500' fill='url(%23g)'/><text x='400' y='280' text-anchor='middle' font-family='Newsreader, serif' font-style='italic' font-weight='800' font-size='200' fill='%23c9a227' opacity='0.55'>${initial}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + svg.replace(/#/g, '%23');
}

/* ── A2: Bento editorial — hero card + mini-cards stack ─────────────── */
let _newsItems = [];
let _heroCard  = null;
let _miniCards = [];
let _newsIndex        = 0;
let _newsProgressTween = null;
let _newsPaused       = false;
let _newsInView       = false;
let _lastCursor       = { x: null, y: null };
const NEWS_AUTO_MS    = 7000;

function buildHeroShell() {
  const hero = document.createElement('article');
  hero.className = 'nc-hero';

  const media = document.createElement('div');
  media.className = 'nc-hero-media';
  const img = document.createElement('img');
  img.alt = '';
  img.addEventListener('error', () => {
    const brand = img.getAttribute('data-brand') || 'CEM';
    img.src = mediaPlaceholderURL(brand);
  });
  media.appendChild(img);

  // Medallón mustard editorial con ring SVG progress (reemplaza al "01/03").
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const medallion = document.createElement('div');
  medallion.className = 'nc-hero-medallion';
  const ringSvg = document.createElementNS(SVG_NS, 'svg');
  ringSvg.setAttribute('class', 'nc-hero-medallion-ring');
  ringSvg.setAttribute('viewBox', '0 0 88 88');
  ringSvg.setAttribute('aria-hidden', 'true');
  const ringTrack = document.createElementNS(SVG_NS, 'circle');
  ringTrack.setAttribute('class', 'ring-track');
  ringTrack.setAttribute('cx', '44');
  ringTrack.setAttribute('cy', '44');
  ringTrack.setAttribute('r', '42');
  const ringProgress = document.createElementNS(SVG_NS, 'circle');
  ringProgress.setAttribute('class', 'ring-progress');
  ringProgress.setAttribute('cx', '44');
  ringProgress.setAttribute('cy', '44');
  ringProgress.setAttribute('r', '42');
  ringSvg.appendChild(ringTrack);
  ringSvg.appendChild(ringProgress);
  medallion.appendChild(ringSvg);
  const medNum = document.createElement('span');
  medNum.className = 'nc-hero-medallion-num';
  medNum.textContent = '01';
  medallion.appendChild(medNum);
  media.appendChild(medallion);
  hero.appendChild(media);

  const body = document.createElement('div');
  body.className = 'nc-hero-body';
  const meta = document.createElement('span');
  meta.className = 'nc-hero-meta';
  body.appendChild(meta);
  const title = document.createElement('h3');
  title.className = 'nc-hero-title';
  body.appendChild(title);
  const desc = document.createElement('p');
  desc.className = 'nc-hero-desc';
  body.appendChild(desc);
  const btn = document.createElement('button');
  btn.className = 'nc-hero-readmore';
  btn.type = 'button';
  btn.style.display = 'none';
  btn.textContent = 'Leer más';
  body.appendChild(btn);
  hero.appendChild(body);

  // Link externo opcional — anchor superpuesto, hidden por defecto, se actualiza por item.
  const linkAnchor = document.createElement('a');
  linkAnchor.className = 'nc-hero-link';
  linkAnchor.target = '_blank';
  linkAnchor.rel = 'noopener noreferrer';
  linkAnchor.hidden = true;
  linkAnchor.setAttribute('aria-label', 'Abrir noticia en nueva pestaña');
  const linkArrow = document.createElement('span');
  linkArrow.className = 'news-link-arrow';
  linkArrow.textContent = '↗';
  linkArrow.setAttribute('aria-hidden', 'true');
  linkAnchor.appendChild(linkArrow);
  hero.appendChild(linkAnchor);

  btn.addEventListener('click', () => {
    const expanded = desc.classList.toggle('expanded');
    btn.textContent = expanded ? 'Leer menos' : 'Leer más';
    if (expanded) pauseNewsAutoRotate();
    else resumeNewsAutoRotate();
    if (window.gsap) {
      gsap.fromTo(desc, { opacity: 0.4 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    }
  });
  return hero;
}

function updateHeroCard(hero, item, index, total) {
  const marca  = sanitizeText(item.marca  || 'GrupoCEM');
  const fecha  = sanitizeText(item.fecha  || '');
  const titulo = sanitizeText(item.titulo || 'Sin título');
  const desc   = sanitizeText(item.descripcion || '');
  const imgUrl = sanitizeUrl(item.imagen_url || '');
  const key    = marca.toLowerCase().replace(/\s/g, '');
  const color  = BRAND_COLORS[key] || BRAND_COLORS.grupocem;

  hero.style.setProperty('--nc-active-color', color);

  const img        = hero.querySelector('.nc-hero-media img');
  const medNum     = hero.querySelector('.nc-hero-medallion-num');
  const meta       = hero.querySelector('.nc-hero-meta');
  const title      = hero.querySelector('.nc-hero-title');
  const descEl     = hero.querySelector('.nc-hero-desc');
  const btn        = hero.querySelector('.nc-hero-readmore');

  img.setAttribute('data-brand', marca);
  if (imgUrl) { img.src = imgUrl; img.alt = titulo; }
  else        { img.src = mediaPlaceholderURL(marca); img.alt = ''; }

  if (medNum) medNum.textContent = String(index + 1).padStart(2, '0');

  meta.textContent = fecha ? (marca + ' · ' + fecha) : marca;
  title.textContent = titulo;
  descEl.classList.remove('expanded');
  descEl.textContent = desc;

  if (desc && desc.length > 140) {
    btn.style.display = 'inline-block';
    btn.textContent = 'Leer más';
  } else {
    btn.style.display = 'none';
  }

  const linkAnchor = hero.querySelector('.nc-hero-link');
  if (linkAnchor) {
    if (item.link && /^https?:\/\//.test(item.link)) {
      linkAnchor.href = item.link;
      linkAnchor.hidden = false;
    } else {
      linkAnchor.removeAttribute('href');
      linkAnchor.hidden = true;
    }
  }
}

function buildMiniCard(item, index) {
  const marca  = sanitizeText(item.marca  || 'GrupoCEM');
  const fecha  = sanitizeText(item.fecha  || '');
  const titulo = sanitizeText(item.titulo || 'Sin título');
  const imgUrl = sanitizeUrl(item.imagen_url || '');
  const key    = marca.toLowerCase().replace(/\s/g, '');
  const color  = BRAND_COLORS[key] || BRAND_COLORS.grupocem;

  const btn = document.createElement('button');
  btn.className = 'nc-mini';
  btn.type = 'button';
  btn.style.setProperty('--nc-color', color);

  const imgWrap = document.createElement('span');
  imgWrap.className = 'nc-mini-img';
  const im = document.createElement('img');
  im.alt = titulo;
  im.loading = 'lazy';
  im.src = imgUrl || mediaPlaceholderURL(marca);
  im.addEventListener('error', () => { im.src = mediaPlaceholderURL(marca); });
  imgWrap.appendChild(im);
  btn.appendChild(imgWrap);

  const body = document.createElement('span');
  body.className = 'nc-mini-body';
  const m = document.createElement('span');
  m.className = 'nc-mini-meta';
  m.textContent = fecha ? (marca + ' · ' + fecha) : marca;
  body.appendChild(m);
  const t = document.createElement('span');
  t.className = 'nc-mini-title';
  t.textContent = titulo;
  body.appendChild(t);
  btn.appendChild(body);

  if (item.link && /^https?:\/\//.test(item.link)) {
    const arrow = document.createElement('span');
    arrow.className = 'news-link-arrow nc-mini-arrow';
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    btn.appendChild(arrow);
  }

  btn.addEventListener('mouseenter', () => { if (_newsIndex !== index) showNews(index); });
  btn.addEventListener('focus',      () => { if (_newsIndex !== index) showNews(index); });
  btn.addEventListener('click', () => {
    if (item.link && /^https?:\/\//.test(item.link)) {
      window.open(item.link, '_blank', 'noopener,noreferrer');
      return;
    }
    showNews(index, { userInitiated: true });
  });
  return btn;
}

function scheduleNewsAutoRotate() {
  if (_newsProgressTween) { _newsProgressTween.kill(); _newsProgressTween = null; }
  if (_ringEl && window.gsap) gsap.set(_ringEl, { strokeDasharray: _ringLen, strokeDashoffset: _ringLen });
  _heroDots.forEach((dot, i) => {
    const fill = dot.firstElementChild;
    if (!fill || !window.gsap) return;
    if (i === _newsIndex) gsap.set(fill, { width: '0%' });
    else gsap.set(fill, { width: '0%' });
  });
  if (!_newsInView || _newsPaused || _newsItems.length < 2 || !window.gsap) return;

  const activeDotFill = _heroDots[_newsIndex] && _heroDots[_newsIndex].firstElementChild;
  const ring = _ringEl;
  if (!ring && !activeDotFill) return;

  const tl = gsap.timeline({
    onComplete: () => {
      if (!_newsInView || _newsPaused) return;
      const next = (_newsIndex + 1) % _newsItems.length;
      showNews(next);
    },
  });
  if (ring) tl.fromTo(ring, { strokeDashoffset: _ringLen }, { strokeDashoffset: 0, duration: NEWS_AUTO_MS / 1000, ease: 'none' }, 0);
  if (activeDotFill) tl.fromTo(activeDotFill, { width: '0%' }, { width: '100%', duration: NEWS_AUTO_MS / 1000, ease: 'none' }, 0);
  _newsProgressTween = tl;
}

function pauseNewsAutoRotate() {
  _newsPaused = true;
  if (_newsProgressTween) _newsProgressTween.pause();
}

function resumeNewsAutoRotate() {
  _newsPaused = false;
  if (!_newsInView || _newsItems.length < 2) return;
  if (_newsProgressTween && _newsProgressTween.progress() < 1) {
    _newsProgressTween.play();
  } else {
    scheduleNewsAutoRotate();
  }
}

function showNews(index, opts = {}) {
  const item = _newsItems[index];
  if (!item || !_heroCard) return;
  const changed = _newsIndex !== index;
  _newsIndex = index;

  _miniCards.forEach((c, i) => c.classList.toggle('active', i === index));
  _heroDots.forEach((d, i) => d.classList.toggle('active', i === index));

  updateHeroCard(_heroCard, item, index, _newsItems.length);

  if (window.gsap && changed && !opts.initial) {
    const media = _heroCard.querySelector('.nc-hero-media');
    const body  = _heroCard.querySelector('.nc-hero-body');
    if (media) {
      const rect = media.getBoundingClientRect();
      let cx = 50, cy = 50;
      if (_lastCursor.x !== null && rect.width > 0 && rect.height > 0) {
        cx = Math.max(0, Math.min(100, ((_lastCursor.x - rect.left) / rect.width)  * 100));
        cy = Math.max(0, Math.min(100, ((_lastCursor.y - rect.top)  / rect.height) * 100));
      }
      gsap.fromTo(media,
        { clipPath: 'circle(0% at ' + cx + '% ' + cy + '%)' },
        {
          clipPath: 'circle(140% at ' + cx + '% ' + cy + '%)',
          duration: 0.8,
          ease: 'expo.out',
          onComplete: () => gsap.set(media, { clearProps: 'clipPath' }),
        }
      );
    }
    if (body) gsap.fromTo(body, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45, delay: 0.1, ease: 'power2.out' });
  }

  if (opts.userInitiated) _newsPaused = false;
  scheduleNewsAutoRotate();
}

function renderNewsBento(rows) {
  newsGrid.textContent = '';
  newsGrid.className = 'news-bento';
  _newsItems = rows;
  _miniCards = [];
  _heroDots  = [];

  // Wrapper col-1 que contiene hero + dots pagination editorial.
  const heroCol = document.createElement('div');
  _heroCard = buildHeroShell();
  heroCol.appendChild(_heroCard);

  // Dots pagination — uno por noticia, click = jump.
  if (rows.length > 1) {
    const dots = document.createElement('div');
    dots.className = 'nc-hero-dots';
    rows.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'nc-hero-dot';
      d.type = 'button';
      d.setAttribute('aria-label', 'Noticia ' + (i + 1));
      const fill = document.createElement('span');
      fill.style.cssText = 'position:absolute;left:0;top:0;bottom:0;width:0;background:var(--brand-gold);';
      d.appendChild(fill);
      d.addEventListener('click', () => showNews(i, { userInitiated: true }));
      dots.appendChild(d);
      _heroDots.push(d);
    });
    heroCol.appendChild(dots);
  }
  newsGrid.appendChild(heroCol);

  // Cache ring + length para animar progress.
  const ring = _heroCard.querySelector('.nc-hero-medallion-ring .ring-progress');
  if (ring) {
    _ringEl  = ring;
    _ringLen = (typeof ring.getTotalLength === 'function') ? ring.getTotalLength() : (2 * Math.PI * 42);
    if (window.gsap) gsap.set(ring, { strokeDasharray: _ringLen, strokeDashoffset: _ringLen });
  }

  const stack = document.createElement('div');
  stack.className = 'nc-mini-stack';
  rows.forEach((row, i) => {
    const mini = buildMiniCard(row, i);
    _miniCards.push(mini);
    stack.appendChild(mini);
  });
  newsGrid.appendChild(stack);

  newsGrid.addEventListener('mousemove', (e) => {
    _lastCursor.x = e.clientX;
    _lastCursor.y = e.clientY;
  }, { passive: true });

  showNews(0, { initial: true });

  const vpIo = new IntersectionObserver((entries) => {
    _newsInView = entries[0].isIntersecting;
    if (_newsInView) {
      if (!_newsPaused) scheduleNewsAutoRotate();
    } else {
      if (_newsProgressTween) _newsProgressTween.pause();
    }
  }, { threshold: 0.25 });
  vpIo.observe(newsGrid);

}

function renderFallback(msg) {
  newsGrid.textContent = '';
  const div = document.createElement('div');
  div.className = 'news-loading';
  div.textContent = msg;
  newsGrid.appendChild(div);
}

async function loadNoticias() {
  try {
    const res = await fetch(NEWS_ENDPOINT, { credentials: 'omit' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()).map((n) => ({
      titulo: n.titulo,
      fecha: n.fecha,
      marca: n.marca,
      descripcion: n.descripcion,
      imagen_url: n.imagen,
      link: n.link || null,
    }));
    if (!rows.length) {
      renderFallback('No hay noticias disponibles aún.');
      return;
    }
    renderNewsBento(rows);
  } catch (err) {
    console.warn('No se pudieron cargar las noticias:', err);
    renderFallback('Las noticias no están disponibles en este momento.');
  }
}

loadNoticias();
