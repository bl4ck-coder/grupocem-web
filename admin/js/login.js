// admin/js/login.js
const form = document.getElementById('login-form');
const errEl = document.getElementById('login-error');
const btn = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.textContent = '';
  btn.disabled = true;
  const password = form.elements.password.value;
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
      credentials: 'same-origin',
    });
    if (res.ok) {
      window.location.href = '/admin/dashboard.html';
      return;
    }
    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      errEl.textContent = `Demasiados intentos. Probá de nuevo en ${Math.ceil((data.retryAfter || 900) / 60)} min.`;
    } else {
      errEl.textContent = 'Contraseña incorrecta.';
    }
  } catch {
    errEl.textContent = 'Error de red. Reintentá.';
  } finally {
    btn.disabled = false;
  }
});
