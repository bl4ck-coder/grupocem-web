// scripts/smoke-test.js — recorre login, upload, create, edit, public, delete, logout contra TARGET.
// Uso: TARGET=https://grupocem-web.vercel.app ADMIN_PASSWORD=... node scripts/smoke-test.js
// Nota: /api/upload usa JSON+base64 (no multipart) por la incompatibilidad de vercel dev en Windows.

const { TARGET, ADMIN_PASSWORD } = process.env;
if (!TARGET || !ADMIN_PASSWORD) { console.error('Missing TARGET or ADMIN_PASSWORD'); process.exit(1); }

let cookie = '';

function ok(label, cond) {
  if (!cond) { console.error('FAIL:', label); process.exit(1); }
  console.log('OK:', label);
}

async function step(label, fn) {
  try { await fn(); console.log('  →', label); }
  catch (e) { console.error('FAIL:', label, e.message); process.exit(1); }
}

await step('login wrong → 401', async () => {
  const r = await fetch(`${TARGET}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'wrong-' + Date.now() }),
  });
  ok('login wrong returns 401', r.status === 401);
});

await step('login ok → cookie', async () => {
  const r = await fetch(`${TARGET}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });
  ok('login ok status', r.status === 200);
  cookie = r.headers.get('set-cookie').split(';')[0];
});

let createdId;
let uploadedPathname;

await step('upload + create noticia', async () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  const up = await fetch(`${TARGET}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ file: png.toString('base64'), mime: 'image/png' }),
  });
  ok('upload ok', up.ok);
  const u = await up.json();
  uploadedPathname = u.pathname;

  const r = await fetch(`${TARGET}/api/news`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      titulo: 'Smoke test',
      fecha: 'Smoke 2026',
      marca: 'GrupoCEM',
      descripcion: 'Smoke desc',
      imagen: u.url,
      imagenPathname: u.pathname,
      link: null,
    }),
  });
  ok('create ok', r.status === 201);
  const data = await r.json();
  createdId = data.id;
});

await step('edit noticia', async () => {
  const r = await fetch(`${TARGET}/api/news/${createdId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ titulo: 'Smoke editado' }),
  });
  ok('edit ok', r.status === 200);
});

await step('public news shows it', async () => {
  const r = await fetch(`${TARGET}/api/news`);
  ok('public ok', r.status === 200);
  const arr = await r.json();
  ok('public contains created', arr.some((n) => n.id === createdId && n.titulo === 'Smoke editado'));
});

await step('delete noticia', async () => {
  const r = await fetch(`${TARGET}/api/news/${createdId}`, {
    method: 'DELETE',
    headers: { Cookie: cookie },
  });
  ok('delete ok', r.status === 200);
});

await step('logout', async () => {
  const r = await fetch(`${TARGET}/api/logout`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });
  ok('logout ok', r.status === 200);
});

console.log('\nSmoke test pasó.');
console.log('Note: blob', uploadedPathname, 'queda huérfano hasta que corra el cron mensual.');
