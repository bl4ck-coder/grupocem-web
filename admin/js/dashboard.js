// admin/js/dashboard.js
const listEl = document.getElementById('news-list');
const emptyEl = document.getElementById('empty-state');
const toastEl = document.getElementById('toast');
const refreshBtn = document.getElementById('refresh-btn');
const logoutBtn = document.getElementById('logout-btn');

const PUBLIC_LIMIT = 5;
let _items = [];

function showToast(msg, kind = '') {
  toastEl.textContent = msg;
  toastEl.className = 'toast show ' + kind;
  setTimeout(() => { toastEl.classList.remove('show'); }, 2200);
}

function el(tag, opts = {}, ...children) {
  const node = document.createElement(tag);
  if (opts.className) node.className = opts.className;
  if (opts.text != null) node.textContent = opts.text;
  if (opts.attrs) for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
  if (opts.on) for (const [k, v] of Object.entries(opts.on)) node.addEventListener(k, v);
  for (const c of children) if (c) node.appendChild(c);
  return node;
}

function renderRow(item) {
  const li = el('li', { className: 'news-item', attrs: { 'data-id': item.id } });

  li.appendChild(el('span', { className: 'grip', text: '⋮⋮', attrs: { 'aria-hidden': 'true' } }));

  const img = el('img', {
    className: 'thumb',
    attrs: { src: item.imagen, alt: '', loading: 'lazy' },
  });
  li.appendChild(img);

  const meta = el('div', { className: 'meta' });
  meta.appendChild(el('p', { className: 'titulo', text: item.titulo }));

  const sub = el('p', { className: 'sub' });
  sub.appendChild(el('span', { className: 'badge', text: item.marca }));
  sub.appendChild(document.createTextNode(`${item.fecha} · ${item.descripcion}`));
  meta.appendChild(sub);
  li.appendChild(meta);

  const actions = el('div', { className: 'row-actions' });
  actions.appendChild(el('a', {
    className: 'btn btn-ghost btn-icon',
    text: '✎',
    attrs: { href: `editor.html?id=${encodeURIComponent(item.id)}`, title: 'Editar' },
  }));
  actions.appendChild(el('button', {
    className: 'btn btn-ghost btn-icon',
    text: '🗑',
    attrs: { type: 'button', title: 'Borrar' },
    on: { click: () => onDelete(item) },
  }));
  li.appendChild(actions);

  return li;
}

function renderDivider(label, isVisibleHeader) {
  return el('li', {
    className: 'news-divider' + (isVisibleHeader ? ' visible' : ''),
    text: label,
    attrs: { 'aria-hidden': 'true' },
  });
}

function render() {
  listEl.removeAttribute('aria-busy');
  listEl.textContent = '';
  if (_items.length === 0) { emptyEl.hidden = false; return; }
  emptyEl.hidden = true;

  listEl.appendChild(renderDivider('Visibles en el sitio', true));
  _items.slice(0, PUBLIC_LIMIT).forEach((it) => listEl.appendChild(renderRow(it)));
  if (_items.length > PUBLIC_LIMIT) {
    listEl.appendChild(renderDivider('En reserva', false));
    _items.slice(PUBLIC_LIMIT).forEach((it) => listEl.appendChild(renderRow(it)));
  }
}

let _orderTimer = null;
function scheduleOrderSave() {
  clearTimeout(_orderTimer);
  _orderTimer = setTimeout(saveOrder, 1000);
}

async function saveOrder() {
  const ids = Array.from(listEl.querySelectorAll('.news-item')).map((node) => node.dataset.id);
  try {
    const res = await fetch('/api/news/order', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
      credentials: 'same-origin',
    });
    if (res.status === 401) { window.location.href = '/admin/'; return; }
    if (!res.ok) throw new Error();
    showToast('Orden guardado', 'success');
    _items = ids.map((id) => _items.find((n) => n.id === id));
    render();
  } catch {
    showToast('No se pudo guardar el orden', 'danger');
  }
}

async function onDelete(item) {
  if (!confirm(`¿Borrar "${item.titulo}"? No se puede deshacer.`)) return;
  try {
    const res = await fetch(`/api/news/${encodeURIComponent(item.id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    if (res.status === 401) { window.location.href = '/admin/'; return; }
    if (!res.ok) throw new Error();
    _items = _items.filter((n) => n.id !== item.id);
    render();
    showToast('Noticia borrada', 'success');
  } catch {
    showToast('No se pudo borrar', 'danger');
  }
}

async function load() {
  listEl.setAttribute('aria-busy', 'true');
  try {
    const res = await fetch('/api/news?all=1', { credentials: 'same-origin' });
    if (res.status === 401) { window.location.href = '/admin/'; return; }
    if (!res.ok) throw new Error();
    _items = await res.json();
    render();
    if (window.Sortable) {
      new Sortable(listEl, {
        handle: '.grip',
        animation: 160,
        ghostClass: 'dragging',
        filter: '.news-divider',
        onEnd: scheduleOrderSave,
      });
    }
  } catch {
    listEl.removeAttribute('aria-busy');
    showToast('No se pudieron cargar las noticias', 'danger');
  }
}

refreshBtn.addEventListener('click', load);
logoutBtn.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
  window.location.href = '/admin/';
});

load();
