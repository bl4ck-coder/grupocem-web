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
  const closeMenu = () => {
    hamburger.classList.remove('open');
    navMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  };
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    navMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
  });
  const navClose = document.getElementById('nav-close');
  if (navClose) navClose.addEventListener('click', closeMenu);
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
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

/* ── A3: Featured card + filmstrip horizontal ───────────────────────── */
let _newsItems   = [];
let _featureCard = null;
let _filmItems   = [];
let _filmstripEl = null;
let _newsIndex   = 0;
let _autoTween   = null;
let _newsPaused  = false;
let _newsInView  = false;
let _cdFill      = null;
const NEWS_AUTO_MS   = 7000;

function buildFeatureShell() {
  const card = document.createElement('article');
  card.className = 'nc-feature';

  const media = document.createElement('div');
  media.className = 'nc-feature-media';
  const img = document.createElement('img');
  img.alt = '';
  img.addEventListener('error', () => {
    const brand = img.getAttribute('data-brand') || 'CEM';
    img.src = mediaPlaceholderURL(brand);
  });
  media.appendChild(img);
  card.appendChild(media);

  const body = document.createElement('div');
  body.className = 'nc-feature-body';
  // Número editorial gris (Inter), reemplaza al medallón rojo.
  const num = document.createElement('span');
  num.className = 'nc-feature-num';
  body.appendChild(num);
  const meta = document.createElement('span');
  meta.className = 'nc-feature-meta';
  body.appendChild(meta);
  const title = document.createElement('h3');
  title.className = 'nc-feature-title';
  body.appendChild(title);
  const desc = document.createElement('p');
  desc.className = 'nc-feature-desc';
  body.appendChild(desc);
  const btn = document.createElement('button');
  btn.className = 'nc-feature-readmore';
  btn.type = 'button';
  btn.style.display = 'none';
  btn.textContent = 'Leer más';
  body.appendChild(btn);
  card.appendChild(body);

  // Link externo opcional — anchor superpuesto, hidden por defecto.
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
  card.appendChild(linkAnchor);

  btn.addEventListener('click', () => {
    const expanded = desc.classList.toggle('expanded');
    btn.textContent = expanded ? 'Leer menos' : 'Leer más';
    if (expanded) pauseNews();
    else resumeNews();
    if (window.gsap) {
      gsap.fromTo(desc, { opacity: 0.4 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    }
  });

  // Toda la card es clickeable hacia el link externo. Se maneja por JS (no por un
  // overlay <a>) porque la animación GSAP del body crea un stacking context que
  // dejaría al botón "Leer más" debajo de un overlay. El botón y la propia flecha
  // ↗ se excluyen para no navegar de más / no duplicar la apertura.
  card.addEventListener('click', (e) => {
    if (e.target.closest('.nc-feature-readmore')) return; // control interno
    if (e.target.closest('.nc-hero-link')) return;        // la flecha abre sola
    const a = card.querySelector('.nc-hero-link');
    if (a && !a.hidden) {
      const href = a.getAttribute('href');
      if (href) window.open(href, '_blank', 'noopener,noreferrer');
    }
  });
  return card;
}

function updateFeature(card, item, index) {
  const marca  = sanitizeText(item.marca  || 'GrupoCEM');
  const fecha  = sanitizeText(item.fecha  || '');
  const titulo = sanitizeText(item.titulo || 'Sin título');
  const desc   = sanitizeText(item.descripcion || '');
  const imgUrl = sanitizeUrl(item.imagen_url || '');
  const key    = marca.toLowerCase().replace(/\s/g, '');
  const color  = BRAND_COLORS[key] || BRAND_COLORS.grupocem;

  card.style.setProperty('--nc-active-color', color);

  const img    = card.querySelector('.nc-feature-media img');
  const num     = card.querySelector('.nc-feature-num');
  const meta    = card.querySelector('.nc-feature-meta');
  const title   = card.querySelector('.nc-feature-title');
  const descEl  = card.querySelector('.nc-feature-desc');
  const btn     = card.querySelector('.nc-feature-readmore');

  img.setAttribute('data-brand', marca);
  if (imgUrl) { img.src = imgUrl; img.alt = titulo; }
  else        { img.src = mediaPlaceholderURL(marca); img.alt = ''; }

  if (num) num.textContent = String(index + 1).padStart(2, '0');

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

  const linkAnchor = card.querySelector('.nc-hero-link');
  const hasLink = !!(item.link && /^https?:\/\//.test(item.link));
  if (linkAnchor) {
    if (hasLink) {
      linkAnchor.href = item.link;
      linkAnchor.hidden = false;
    } else {
      linkAnchor.removeAttribute('href');
      linkAnchor.hidden = true;
    }
  }
  // Card entera clickeable (cursor + handler) solo cuando hay link.
  card.classList.toggle('nc-clickable', hasLink);
}

function buildFilmItem(item, index) {
  const marca  = sanitizeText(item.marca  || 'GrupoCEM');
  const fecha  = sanitizeText(item.fecha  || '');
  const titulo = sanitizeText(item.titulo || 'Sin título');
  const imgUrl = sanitizeUrl(item.imagen_url || '');
  const key    = marca.toLowerCase().replace(/\s/g, '');
  const color  = BRAND_COLORS[key] || BRAND_COLORS.grupocem;

  const btn = document.createElement('button');
  btn.className = 'nc-film';
  btn.type = 'button';
  btn.style.setProperty('--nc-color', color);
  btn.setAttribute('role', 'listitem');
  btn.setAttribute('aria-label', 'Noticia ' + (index + 1) + ': ' + titulo);

  const imgWrap = document.createElement('span');
  imgWrap.className = 'nc-film-img';
  const im = document.createElement('img');
  im.alt = titulo;
  im.loading = 'lazy';
  im.src = imgUrl || mediaPlaceholderURL(marca);
  im.addEventListener('error', () => { im.src = mediaPlaceholderURL(marca); });
  imgWrap.appendChild(im);
  const num = document.createElement('span');
  num.className = 'nc-film-num';
  num.textContent = String(index + 1).padStart(2, '0');
  imgWrap.appendChild(num);
  btn.appendChild(imgWrap);

  const body = document.createElement('span');
  body.className = 'nc-film-body';
  const m = document.createElement('span');
  m.className = 'nc-film-meta';
  m.textContent = fecha ? (marca + ' · ' + fecha) : marca;
  body.appendChild(m);
  const t = document.createElement('span');
  t.className = 'nc-film-title';
  t.textContent = titulo;
  body.appendChild(t);
  btn.appendChild(body);

  if (item.link && /^https?:\/\//.test(item.link)) {
    const arrow = document.createElement('span');
    arrow.className = 'news-link-arrow nc-film-arrow';
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    btn.appendChild(arrow);
  }

  // Click = traer al frente (la card destacada). El enlace externo se abre
  // desde la flecha ↗ de la card destacada.
  btn.addEventListener('click', () => showNews(index, { userInitiated: true }));
  return btn;
}

function scrollFilmIntoView(index) {
  const el = _filmItems[index];
  if (!el || !_filmstripEl) return;
  const stripRect = _filmstripEl.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  if (elRect.left < stripRect.left + 4 || elRect.right > stripRect.right - 4) {
    const offset = el.offsetLeft - (_filmstripEl.clientWidth - el.clientWidth) / 2;
    _filmstripEl.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
  }
}

/* Countdown lineal: barra que se llena entre noticias. */
function startCountdown() {
  if (_autoTween) { _autoTween.kill(); _autoTween = null; }
  if (_cdFill && window.gsap) gsap.set(_cdFill, { width: '0%' });
  if (!_newsInView || _newsPaused || _newsItems.length < 2 || !window.gsap) return;

  const state = { p: 0 };
  _autoTween = gsap.to(state, {
    p: 1,
    duration: NEWS_AUTO_MS / 1000,
    ease: 'none',
    onUpdate: () => {
      if (_cdFill) gsap.set(_cdFill, { width: (state.p * 100) + '%' });
    },
    onComplete: () => {
      if (!_newsInView || _newsPaused) return;
      showNews((_newsIndex + 1) % _newsItems.length);
    },
  });
}

function pauseNews() {
  _newsPaused = true;
  if (_autoTween) _autoTween.pause();
}

function resumeNews() {
  _newsPaused = false;
  if (!_newsInView || _newsItems.length < 2) return;
  if (_autoTween && _autoTween.progress() < 1) {
    _autoTween.play();
  } else {
    startCountdown();
  }
}

function showNews(index, opts = {}) {
  const item = _newsItems[index];
  if (!item || !_featureCard) return;
  const changed = _newsIndex !== index;
  _newsIndex = index;

  _filmItems.forEach((c, i) => c.classList.toggle('active', i === index));
  scrollFilmIntoView(index);

  updateFeature(_featureCard, item, index);

  if (window.gsap && changed && !opts.initial) {
    const media = _featureCard.querySelector('.nc-feature-media');
    const body  = _featureCard.querySelector('.nc-feature-body');
    // Wipe horizontal izquierda → derecha al cambiar de noticia.
    if (media) {
      gsap.fromTo(media,
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          duration: 0.7,
          ease: 'expo.out',
          onComplete: () => gsap.set(media, { clearProps: 'clipPath' }),
        }
      );
    }
    if (body) gsap.fromTo(body, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45, delay: 0.08, ease: 'power2.out' });
  }

  if (opts.userInitiated) _newsPaused = false;
  startCountdown();
}

function renderNews(rows) {
  newsGrid.textContent = '';
  newsGrid.className = 'news-feature-wrap';
  _newsItems = rows;
  _filmItems = [];

  // 1. Card destacada.
  _featureCard = buildFeatureShell();
  newsGrid.appendChild(_featureCard);

  // 2. Countdown lineal (solo con 2+ noticias).
  if (rows.length > 1) {
    const cd = document.createElement('div');
    cd.className = 'nc-countdown';
    const track = document.createElement('div');
    track.className = 'nc-countdown-track';
    _cdFill = document.createElement('span');
    _cdFill.className = 'nc-countdown-fill';
    track.appendChild(_cdFill);
    cd.appendChild(track);
    newsGrid.appendChild(cd);
  } else {
    _cdFill = null;
  }

  // 3. Filmstrip horizontal — una card por noticia, scroll ilimitado.
  const strip = document.createElement('div');
  strip.className = 'nc-filmstrip';
  strip.setAttribute('role', 'list');
  strip.setAttribute('aria-label', 'Todas las noticias');
  rows.forEach((row, i) => {
    const film = buildFilmItem(row, i);
    _filmItems.push(film);
    strip.appendChild(film);
  });
  _filmstripEl = strip;
  newsGrid.appendChild(strip);

  // El auto-avance NO se pausa al pasar el mouse: las noticias siguen pasando
  // siempre (solo se frena al expandir "Leer más" y al salir del viewport).

  showNews(0, { initial: true });

  const vpIo = new IntersectionObserver((entries) => {
    _newsInView = entries[0].isIntersecting;
    if (_newsInView) {
      if (!_newsPaused) startCountdown();
    } else if (_autoTween) {
      _autoTween.pause();
    }
  }, { threshold: 0.2 });
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
    renderNews(rows);
  } catch (err) {
    console.warn('No se pudieron cargar las noticias:', err);
    renderFallback('Las noticias no están disponibles en este momento.');
  }
}

loadNoticias();
