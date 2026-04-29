// admin/js/editor.js
const params = new URLSearchParams(location.search);
const editingId = params.get('id');

const form = document.getElementById('editor-form');
const titleEl = document.getElementById('editor-title');
const pageTitle = document.getElementById('page-title');
const tituloEl = document.getElementById('titulo');
const tituloCount = document.getElementById('titulo-count');
const descEl = document.getElementById('descripcion');
const descCount = document.getElementById('desc-count');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const previewWrap = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');
const removeImageBtn = document.getElementById('remove-image');
const imagenHidden = document.getElementById('imagen');
const pathnameHidden = document.getElementById('imagen-pathname');
const imageErr = document.getElementById('image-error');
const saveBtn = document.getElementById('save-btn');
const toastEl = document.getElementById('toast');
const otraRadio = document.getElementById('marca-otra-radio');
const otraInput = document.getElementById('marca-otra-input');

const KNOWN_MARCAS = ['Carnave', 'Avigan', 'Avicola', 'OvoFood', 'GrupoCEM'];

function getMarcaValue() {
  const selected = form.elements.marca.value;
  if (selected === '__otra__') return otraInput.value.trim();
  return selected;
}

const DRAFT_KEY = `admin_draft_${editingId || 'new'}`;

if (editingId) {
  titleEl.textContent = 'Editar noticia';
  pageTitle.textContent = 'Editar noticia — Admin GrupoCEM';
}

function showToast(msg, kind = '') {
  toastEl.textContent = msg;
  toastEl.className = 'toast show ' + kind;
  setTimeout(() => toastEl.classList.remove('show'), 2200);
}

function syncCounters() {
  tituloCount.textContent = tituloEl.value.length;
  descCount.textContent = descEl.value.length;
}

function updateSaveEnabled() {
  const titulo = tituloEl.value.trim();
  const fecha = form.elements.fecha.value.trim();
  const marca = getMarcaValue();
  const desc = descEl.value.trim();
  const imagen = imagenHidden.value;
  const linkVal = form.elements.link.value.trim();
  const linkOk = !linkVal || /^https?:\/\//.test(linkVal);
  saveBtn.disabled = !(titulo && fecha && marca && desc && imagen && linkOk);
}

function setImage(url, pathname) {
  imagenHidden.value = url || '';
  pathnameHidden.value = pathname || '';
  if (url) {
    previewImg.src = url;
    previewWrap.hidden = false;
    dropzone.hidden = true;
  } else {
    previewWrap.hidden = true;
    dropzone.hidden = false;
  }
  updateSaveEnabled();
}

function saveDraft() {
  const data = {
    titulo: tituloEl.value,
    fecha: form.elements.fecha.value,
    marca: getMarcaValue(),
    descripcion: descEl.value,
    imagen: imagenHidden.value,
    imagenPathname: pathnameHidden.value,
    link: form.elements.link.value,
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
}

function loadDraftIntoForm(data) {
  tituloEl.value = data.titulo || '';
  form.elements.fecha.value = data.fecha || '';
  if (data.marca) {
    if (KNOWN_MARCAS.includes(data.marca)) {
      const r = form.querySelector(`input[name="marca"][value="${data.marca}"]`);
      if (r) r.checked = true;
      otraInput.value = '';
    } else {
      otraRadio.checked = true;
      otraInput.value = data.marca;
    }
  }
  descEl.value = data.descripcion || '';
  form.elements.link.value = data.link || '';
  setImage(data.imagen, data.imagenPathname);
  syncCounters();
  updateSaveEnabled();
}

async function loadExisting() {
  if (!editingId) {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) loadDraftIntoForm(JSON.parse(draft));
    return;
  }
  try {
    const res = await fetch('/api/news?all=1', { credentials: 'same-origin' });
    if (res.status === 401) { window.location.href = '/admin/'; return; }
    const all = await res.json();
    const n = all.find((x) => x.id === editingId);
    if (!n) { showToast('No se encontró la noticia', 'danger'); return; }
    loadDraftIntoForm({
      titulo: n.titulo, fecha: n.fecha, marca: n.marca,
      descripcion: n.descripcion, link: n.link || '',
      imagen: n.imagen, imagenPathname: n.imagenPathname,
    });
  } catch {
    showToast('Error al cargar', 'danger');
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function uploadFile(file) {
  imageErr.textContent = '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    imageErr.textContent = 'Tipo no soportado. Subí JPG, PNG o WEBP.';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    imageErr.textContent = 'Archivo demasiado grande (máx 5 MB).';
    return;
  }
  dropzone.classList.add('uploading');
  try {
    const b64 = await fileToBase64(file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: b64, mime: file.type }),
      credentials: 'same-origin',
    });
    if (res.status === 401) { window.location.href = '/admin/'; return; }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      imageErr.textContent = data.error || 'No se pudo subir la imagen.';
      return;
    }
    const data = await res.json();
    setImage(data.url, data.pathname);
    saveDraft();
  } catch {
    imageErr.textContent = 'Error de red. Reintentá.';
  } finally {
    dropzone.classList.remove('uploading');
  }
}

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) uploadFile(e.target.files[0]);
});
removeImageBtn.addEventListener('click', () => setImage('', ''));

[tituloEl, descEl].forEach((node) => node.addEventListener('input', () => { syncCounters(); updateSaveEnabled(); saveDraft(); }));
form.elements.fecha.addEventListener('input', () => { updateSaveEnabled(); saveDraft(); });
form.elements.link.addEventListener('input', () => { updateSaveEnabled(); saveDraft(); });
form.querySelectorAll('input[name="marca"]').forEach((node) => node.addEventListener('change', () => { updateSaveEnabled(); saveDraft(); }));
otraInput.addEventListener('input', () => {
  if (otraInput.value.trim()) otraRadio.checked = true;
  updateSaveEnabled();
  saveDraft();
});
otraInput.addEventListener('focus', () => { otraRadio.checked = true; updateSaveEnabled(); });

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  saveBtn.disabled = true;
  const linkVal = form.elements.link.value.trim();
  const payload = {
    titulo: tituloEl.value.trim(),
    fecha: form.elements.fecha.value.trim(),
    marca: getMarcaValue(),
    descripcion: descEl.value.trim(),
    imagen: imagenHidden.value,
    imagenPathname: pathnameHidden.value,
    link: linkVal || null,
  };
  const url = editingId ? `/api/news/${encodeURIComponent(editingId)}` : '/api/news';
  const method = editingId ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'same-origin',
    });
    if (res.status === 401) { window.location.href = '/admin/'; return; }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast('Error: ' + (data.error || res.status), 'danger');
      saveBtn.disabled = false;
      return;
    }
    localStorage.removeItem(DRAFT_KEY);
    window.location.href = '/admin/dashboard.html';
  } catch {
    showToast('Error de red', 'danger');
    saveBtn.disabled = false;
  }
});

loadExisting().then(() => { syncCounters(); updateSaveEnabled(); });
