/* ═══════════════════════════════════════════════════════════════════════════
   GrupoCEM — main.js
   - Nav sticky + active links on scroll
   - Hamburger mobile menu
   - Google Sheets noticias (CSV público)
   ═══════════════════════════════════════════════════════════════════════════

   CONFIGURACIÓN NOTICIAS:
   Reemplazá SHEET_CSV_URL con la URL del Sheet publicado como CSV.
   Ver INSTRUCCIONES-NOTICIAS.md para el procedimiento completo.
   ═══════════════════════════════════════════════════════════════════════════ */

const SHEET_CSV_URL = '';
// Ejemplo:
// const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/XXXXXXXXXXXXXXXX/export?format=csv&gid=0';

const MAX_NOTICIAS = 3;

/* ─── Noticias de ejemplo (se usan cuando SHEET_CSV_URL está vacío) ──────── */
const DEMO_NOTICIAS = [
  {
    titulo:      'Carnave suma su quinto local en Santa Fe capital',
    fecha:       'Sep 2025',
    marca:       'Carnave',
    imagen_url:  'https://www.radioeme.com/wp-content/uploads/2025/09/WhatsApp-Image-2025-09-02-at-11.12.28-AM.jpeg',
    descripcion: 'Nuevo local en Bv. Gálvez y Sarmiento, frente a Plaza Pueyrredón. El punto de venta ofrece toda la línea de productos frescos, cortes vacunos y porcinos, chacinados y almacén. Con esta apertura Carnave consolida su presencia en la capital provincial y avanza hacia las 150 sucursales en todo el país.',
  },
  {
    titulo:      'Argentina lidera el consumo mundial de huevos',
    fecha:       'Ene 2026',
    marca:       'Avicola',
    imagen_url:  'https://elsantafesino.com/wp-content/uploads/19272_avicola.jpg',
    descripcion: 'Con 398 huevos por habitante al año, Argentina se posiciona como el mayor consumidor de huevos del mundo. Compañía Avícola, con una producción de más de 120 millones de huevos anuales y certificación FSSC 22000, acompaña este crecimiento sostenido abasteciendo a más de 1.500 puntos de venta en todo el país.',
  },
  {
    titulo:      'Avigan lanza nueva línea de balanceados para pollo parrillero',
    fecha:       'Mar 2026',
    marca:       'Avigan',
    imagen_url:  'https://cdn.agroempresario.com/images/posts/a2fb5cf19d2689bdf56b3bb4d7c52e529fec2b2d55c1a63f_840.jpg',
    descripcion: 'Avigan presenta una formulación de balanceado diseñada específicamente para mejorar la conversión y el rendimiento en la producción de pollo parrillero. Desarrollada en el laboratorio de Humboldt con ingredientes trazables de la propia cadena del Grupo, la línea busca reducir costos de producción sin resignar calidad sanitaria.',
  },
];

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

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] || '').trim().replace(/^"|"$/g, '');
    });
    return row;
  });
}

function sanitizeText(str) {
  return String(str || '').slice(0, 500);
}

function sanitizeUrl(str) {
  const s = String(str || '').trim();
  if (!s) return '';
  if (/^https?:\/\//.test(s)) return s;
  return '';
}

/* ── Tab news helpers ──────────────────────────────────────────────────── */
let _newsPanels = [];
let _newsTabs   = [];

function buildNewsPanel(item) {
  const marca  = sanitizeText(item.marca  || 'GrupoCEM');
  const fecha  = sanitizeText(item.fecha  || '');
  const titulo = sanitizeText(item.titulo || 'Sin título');
  const desc   = sanitizeText(item.descripcion || '');
  const imgUrl = sanitizeUrl(item.imagen_url || '');
  const key    = marca.toLowerCase().replace(/\s/g, '');
  const color  = BRAND_COLORS[key] || BRAND_COLORS.grupocem;

  const panel = document.createElement('div');
  panel.className = 'nc-panel';

  if (imgUrl) {
    const img = document.createElement('img');
    img.className = 'nc-panel-img';
    img.src = imgUrl; img.alt = titulo; img.loading = 'lazy';
    panel.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'nc-panel-placeholder';
    ph.style.borderRight = '4px solid ' + color;
    panel.appendChild(ph);
  }

  const body = document.createElement('div');
  body.className = 'nc-panel-body';

  const meta = document.createElement('p');
  meta.className = 'nc-panel-meta';
  meta.style.color = color;
  meta.textContent = fecha ? (marca + ' · ' + fecha) : marca;
  body.appendChild(meta);

  const h3 = document.createElement('h3');
  h3.className = 'nc-panel-title';
  h3.textContent = titulo;
  body.appendChild(h3);

  if (desc) {
    const p = document.createElement('p');
    p.className = 'nc-panel-desc';
    p.textContent = desc;
    body.appendChild(p);

    if (desc.length > 140) {
      const btn = document.createElement('button');
      btn.className = 'nc-read-more';
      btn.style.color = color;
      btn.textContent = 'Leer más';
      btn.addEventListener('click', () => {
        const expanded = p.classList.toggle('expanded');
        btn.textContent = expanded ? 'Leer menos' : 'Leer más';
        if (window.gsap) {
          gsap.fromTo(p, { opacity: 0.4, y: expanded ? 6 : -6 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
        }
      });
      body.appendChild(btn);
    }
  }

  panel.appendChild(body);
  return panel;
}

function buildNewsTab(item, index) {
  const marca  = sanitizeText(item.marca  || 'GrupoCEM');
  const fecha  = sanitizeText(item.fecha  || '');
  const titulo = sanitizeText(item.titulo || 'Sin título');
  const key    = marca.toLowerCase().replace(/\s/g, '');
  const color  = BRAND_COLORS[key] || BRAND_COLORS.grupocem;

  const btn = document.createElement('button');
  btn.className = 'nc-tab-item';
  btn.style.setProperty('--nc-color', color);

  const label = document.createElement('span');
  label.className = 'nc-tab-label';
  label.style.color = color;
  label.textContent = fecha ? (marca + ' · ' + fecha) : marca;
  btn.appendChild(label);

  const title = document.createElement('p');
  title.className = 'nc-tab-title';
  title.textContent = titulo;
  btn.appendChild(title);

  btn.addEventListener('click', () => showNews(index));
  return btn;
}

function showNews(index) {
  const current = _newsPanels.find(p => p.classList.contains('active'));
  const next = _newsPanels[index];
  if (!current || current === next) {
    _newsPanels.forEach((p, i) => p.classList.toggle('active', i === index));
    _newsTabs.forEach((t, i)   => t.classList.toggle('active', i === index));
    return;
  }
  if (window.gsap) {
    gsap.to(current, {
      opacity: 0, duration: 0.15,
      onComplete: () => {
        _newsPanels.forEach((p, i) => {
          p.classList.toggle('active', i === index);
          gsap.set(p, { opacity: 1 });
        });
        _newsTabs.forEach((t, i) => t.classList.toggle('active', i === index));
        gsap.fromTo(next, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
      },
    });
  } else {
    _newsPanels.forEach((p, i) => p.classList.toggle('active', i === index));
    _newsTabs.forEach((t, i)   => t.classList.toggle('active', i === index));
  }
}

function renderNewsTabs(rows) {
  newsGrid.textContent = '';
  newsGrid.className = 'nc-news-container';
  _newsPanels = [];
  _newsTabs   = [];

  const tabNav = document.createElement('div');
  tabNav.className = 'nc-tab-nav';

  rows.forEach((row, i) => {
    const panel = buildNewsPanel(row);
    _newsPanels.push(panel);
    newsGrid.appendChild(panel);

    const tab = buildNewsTab(row, i);
    _newsTabs.push(tab);
    tabNav.appendChild(tab);
  });

  newsGrid.appendChild(tabNav);
  showNews(0);
}

function renderFallback(msg) {
  newsGrid.textContent = '';
  const div = document.createElement('div');
  div.className = 'news-loading';
  div.textContent = msg;
  newsGrid.appendChild(div);
}

async function loadNoticias() {
  if (!SHEET_CSV_URL) {
    renderNewsTabs(DEMO_NOTICIAS);
    return;
  }
  try {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const rows = parseCSV(text).slice(0, MAX_NOTICIAS);
    if (!rows.length) {
      renderFallback('No hay noticias disponibles aún.');
      return;
    }
    renderNewsTabs(rows);
  } catch (err) {
    console.warn('No se pudieron cargar las noticias:', err);
    renderFallback('Las noticias no están disponibles en este momento.');
  }
}

loadNoticias();
