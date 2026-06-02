# Marcas Split-Panels — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el acordeón vertical de la sección `#marcas` por una tira horizontal full-bleed de 4 paneles (Carnave · Avigan · Cía Avícola · Ovo Food) con rotación automática del panel activo, expansión al hover, overlay de specs, y fallback responsive en mobile.

**Architecture:** Componente self-contained dentro de `index.html` (single-file, `<style>`+`<script>` embebidos). Markup estático de 4 paneles con namespace de clases `ms-*` (evita colisión con CSS muerto `.brand-panel`). El fondo de cada panel se controla con la custom property `--ms-grad` (gradiente de color ahora; URL de imagen Higgsfield después, sin tocar estructura). Comportamiento en una IIFE `initBrandStrip` (auto-rotación solo en dispositivos hover, hover/focus takeover, reduced-motion guard, tap-to-activate en touch).

**Tech Stack:** HTML + CSS (vanilla, custom properties, flexbox) + JS vanilla. Sin dependencias nuevas. Verificación vía Playwright MCP contra `vercel dev` (localhost:3000).

**Verificación (adaptación a este repo):** El proyecto **no tiene** test harness de frontend y agregar uno está fuera de alcance. En lugar de TDD unitario, cada task se verifica con asserts de comportamiento reales vía Playwright MCP (`browser_navigate`, `browser_evaluate`, `browser_hover`, `browser_resize`, `browser_take_screenshot`) y los resultados esperados están explícitos. `prefers-reduced-motion` se verifica por lectura del guard (la emulación no es accesible vía MCP).

---

## File Structure

Un solo archivo modificado: `index.html`. Cuatro regiones (líneas pre-edición, sirven de guía; los Edits usan anclas de texto únicas, no números de línea):

| Región | Líneas (pre-edit) | Acción |
|---|---|---|
| CSS muerto "panel drama" | 321–370 | **Eliminar** (clases `.brand-panel`, `.panel-index*`, `.panel-brand-tag`, `.brand-tab*` — cero uso en markup) |
| CSS acordeón `.brand-row*` | 854–1040 | **Reemplazar** por CSS `.ms-*` (tira + estados + mobile) |
| HTML `<section id="marcas">` | 1269–1372 | **Reemplazar** por la tira de 4 paneles |
| `<script>` `initBrandAccordion` | 1373–1443 | **Reemplazar** por `initBrandStrip` |

Assets: se reutilizan los logos existentes (`assets/logos/{carnave,avigan,compania-avicola,ovofood}.png`). **No** se crean imágenes en este plan (las Higgsfield son paso posterior — ver "Integración futura").

**Orden de edición recomendado:** de mayor a menor número de línea (script → html → css acordeón → css muerto), así los Edits no desplazan las regiones aún no tocadas. Cada Edit usa `old_string` anclado en texto único.

---

## Task 1: Reemplazar el componente Marcas (markup + CSS + JS, fallback gradiente)

Cambio coherente único: deja la sección funcionando con gradientes de marca. Se edita JS, luego HTML, luego CSS, y se verifica todo junto antes de commitear.

**Files:**
- Modify: `index.html` (script ~1373–1443, html ~1269–1372, css ~854–1040)

- [ ] **Step 1: Reemplazar el `<script>` del acordeón por `initBrandStrip`**

Localizar el bloque que empieza en `<script>\n(function initBrandAccordion() {` y termina en `})();\n</script>` (≈ líneas 1373–1443). Reemplazarlo COMPLETO por:

```html
<script>
(function initBrandStrip() {
  const strip = document.querySelector('.ms-strip');
  if (!strip) return;
  const panels = Array.from(strip.querySelectorAll('.ms-panel'));
  if (!panels.length) return;

  const CAN_HOVER = window.matchMedia('(hover: hover)').matches;
  const REDUCED   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ROTATE_MS = 5000;

  let active = 0;
  let timer  = null;
  let pinned = false; // true cuando el usuario toma el control (hover/focus/tap/click)

  function setActive(i) {
    active = (i + panels.length) % panels.length;
    panels.forEach((p, idx) => {
      const on = idx === active;
      p.classList.toggle('active', on);
      p.setAttribute('aria-expanded', String(on));
    });
  }

  function start() {
    if (REDUCED || pinned || timer || !CAN_HOVER) return;
    timer = setInterval(() => setActive(active + 1), ROTATE_MS);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  setActive(0);

  // Desktop (hover): pasar el mouse toma el control; salir de la tira reanuda.
  if (CAN_HOVER) {
    panels.forEach((p, idx) => {
      p.addEventListener('mouseenter', () => { pinned = true; stop(); setActive(idx); });
      p.addEventListener('focus',      () => { pinned = true; stop(); setActive(idx); });
    });
    strip.addEventListener('mouseleave', () => { pinned = false; start(); });
    start();
  }

  // Click/tap: activa el panel. La navegación al sitio la maneja el <a class="ms-cta">.
  panels.forEach((p, idx) => {
    p.addEventListener('click', (e) => {
      if (e.target.closest('.ms-cta')) return; // dejar que el link navegue
      setActive(idx);
      if (CAN_HOVER) { pinned = true; stop(); }
    });
    p.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(idx); }
    });
  });
})();
</script>
```

- [ ] **Step 2: Reemplazar el HTML de la sección `#marcas`**

Localizar desde `<!-- 5. Brands Section -->` hasta el `</section>` que cierra `#marcas` (≈ líneas 1269–1372, justo antes de `<!-- Section transition rule: marcas → nosotros -->`). Reemplazarlo COMPLETO por:

```html
<!-- 5. Brands Section -->
<section id="marcas" class="py-24 bg-[#fdfcf0]">
<div class="max-w-7xl mx-auto px-8">
<div class="mb-12 text-center">
<span class="text-primary font-bold tracking-[0.3em] text-xs uppercase">02 — Excelencia Productiva</span>
<h2 class="font-serif text-5xl text-[#70685e] mt-4 font-bold">Nuestras Marcas</h2>
</div>
</div>
<div class="ms-strip" role="list" aria-label="Marcas del Grupo CEM">

  <article class="ms-panel active" data-brand="carnave" tabindex="0" role="listitem" aria-expanded="true"
           style="--ms-grad:linear-gradient(180deg,#d24a4a,#b71c1c 55%,#7c1010);">
    <span class="ms-bg" aria-hidden="true"></span>
    <span class="ms-scrim" aria-hidden="true"></span>
    <img class="ms-logo" src="assets/logos/carnave.png" alt="Carnave">
    <div class="ms-body">
      <span class="ms-tag">Desde 1974 · Integración avícola</span>
      <div class="ms-pills">
        <span class="ms-pill">Frigorífico propio</span>
        <span class="ms-pill">Exportación</span>
        <span class="ms-pill">Tiendas propias</span>
        <span class="ms-pill">Franquicias</span>
      </div>
      <a class="ms-cta" href="https://www.carnave.com.ar/" target="_blank" rel="noopener noreferrer">Visitar sitio <span class="material-symbols-outlined" style="font-size:16px;">arrow_forward</span></a>
    </div>
  </article>

  <article class="ms-panel" data-brand="avigan" tabindex="0" role="listitem" aria-expanded="false"
           style="--ms-grad:linear-gradient(180deg,#4f9e54,#2e7d32 55%,#1d5320);">
    <span class="ms-bg" aria-hidden="true"></span>
    <span class="ms-scrim" aria-hidden="true"></span>
    <img class="ms-logo" src="assets/logos/avigan.png" alt="Avigan">
    <div class="ms-body">
      <span class="ms-tag">Agronegocios · Nutrición · Laboratorio</span>
      <div class="ms-pills">
        <span class="ms-pill">Nutrición</span>
        <span class="ms-pill">Laboratorio</span>
        <span class="ms-pill">Acopio</span>
        <span class="ms-pill">Asesoramiento</span>
      </div>
      <a class="ms-cta" href="https://avigan.com.ar/" target="_blank" rel="noopener noreferrer">Visitar sitio <span class="material-symbols-outlined" style="font-size:16px;">arrow_forward</span></a>
    </div>
  </article>

  <article class="ms-panel" data-brand="cia" tabindex="0" role="listitem" aria-expanded="false"
           style="--ms-grad:linear-gradient(180deg,#e0a63a,#C8860A 55%,#8c5c06);">
    <span class="ms-bg" aria-hidden="true"></span>
    <span class="ms-scrim" aria-hidden="true"></span>
    <img class="ms-logo" src="assets/logos/compania-avicola.png" alt="Cía Avícola">
    <div class="ms-body">
      <span class="ms-tag">120M huevos/año · FSSC 22000</span>
      <div class="ms-pills">
        <span class="ms-pill">Supermercados</span>
        <span class="ms-pill">Huevo con fecha y marca</span>
        <span class="ms-pill">Suplementos vitamínicos</span>
        <span class="ms-pill">Gastronomía</span>
      </div>
      <a class="ms-cta" href="https://www.ciaavicola.com.ar/" target="_blank" rel="noopener noreferrer">Visitar sitio <span class="material-symbols-outlined" style="font-size:16px;">arrow_forward</span></a>
    </div>
  </article>

  <article class="ms-panel" data-brand="ovo" tabindex="0" role="listitem" aria-expanded="false"
           style="--ms-grad:linear-gradient(180deg,#3aa0d8,#0277BD 55%,#024e7c);">
    <span class="ms-bg" aria-hidden="true"></span>
    <span class="ms-scrim" aria-hidden="true"></span>
    <img class="ms-logo" src="assets/logos/ovofood.png" alt="Ovo Food">
    <div class="ms-body">
      <span class="ms-tag">Ovoproductos industriales · CHEF · VITAL</span>
      <div class="ms-pills">
        <span class="ms-pill">Ovoproductos industrializados</span>
        <span class="ms-pill">Deshidratado</span>
        <span class="ms-pill">Línea CHEF</span>
        <span class="ms-pill">Línea VITAL</span>
      </div>
      <a class="ms-cta" href="https://ovofood.com.ar/" target="_blank" rel="noopener noreferrer">Visitar sitio <span class="material-symbols-outlined" style="font-size:16px;">arrow_forward</span></a>
    </div>
  </article>

</div>
</section>
```

- [ ] **Step 3: Reemplazar el CSS del acordeón por el CSS de la tira**

Localizar desde `/* ── B2: Marcas acordeón vertical ─` hasta el `}` que cierra el `@media (max-width: 768px)` del acordeón (≈ líneas 854–1040, justo antes de `/* ── Modal "Trabajá con nosotros" ── */`). Reemplazarlo COMPLETO por:

```css
        /* ── B2: Marcas — tira horizontal de paneles (split-panels) ── */
        .ms-strip {
          display: flex;
          width: 100%;
          height: 70vh;
          min-height: 520px;
          overflow: hidden;
        }
        .ms-panel {
          position: relative;
          flex: 1 1 0;
          min-width: 0;
          overflow: hidden;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fff;
          border-right: 1px solid rgba(255,255,255,0.10);
          transition: flex 0.55s cubic-bezier(0.65, 0, 0.35, 1);
        }
        .ms-panel:last-child { border-right: none; }
        .ms-panel.active { flex: 3 1 0; }
        .ms-bg {
          position: absolute; inset: 0; z-index: 0;
          background: var(--ms-grad, #444) center / cover no-repeat;
          filter: blur(1.5px) saturate(1.05);
          transform: scale(1.06);
          transition: transform 0.8s ease, filter 0.8s ease;
        }
        .ms-panel.active .ms-bg { transform: scale(1.0); filter: blur(0.5px) saturate(1.08); }
        .ms-scrim {
          position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(180deg, rgba(0,0,0,0.10) 25%, rgba(0,0,0,0.66) 100%);
        }
        .ms-logo {
          position: relative; z-index: 2;
          height: 40px; width: auto; object-fit: contain;
          filter: brightness(0) invert(1);
          opacity: 0.95;
          transition: transform 0.45s ease;
          -webkit-filter: brightness(0) invert(1);
        }
        .ms-panel[data-brand="avigan"] .ms-logo { height: 64px; }
        .ms-panel[data-brand="ovo"]    .ms-logo { height: 64px; }
        .ms-panel.active .ms-logo { transform: scale(1.06); }
        .ms-body {
          position: relative; z-index: 2;
          width: 100%; max-width: 380px;
          text-align: center;
          padding: 0 18px;
          max-height: 0; opacity: 0; overflow: hidden;
          transition: max-height 0.55s cubic-bezier(0.65, 0, 0.35, 1),
                      opacity 0.4s ease, margin-top 0.4s ease;
        }
        .ms-panel.active .ms-body { max-height: 280px; opacity: 1; margin-top: 18px; }
        .ms-tag {
          display: block;
          font-family: 'Newsreader', serif; font-style: italic;
          font-size: 15px; opacity: 0.92; margin-bottom: 14px;
          text-shadow: 0 1px 8px rgba(0,0,0,0.6);
        }
        .ms-pills { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; }
        .ms-pill {
          font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600;
          background: rgba(255,255,255,0.16);
          border: 1px solid rgba(255,255,255,0.34);
          padding: 5px 11px; border-radius: 20px;
          -webkit-backdrop-filter: blur(2px);
          backdrop-filter: blur(2px);
        }
        .ms-cta {
          display: inline-flex; align-items: center; gap: 7px;
          margin-top: 16px;
          background: #fff; color: #1f1a17;
          padding: 11px 20px; border-radius: 8px;
          font-family: 'Inter', sans-serif; font-weight: 700;
          font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .ms-cta:hover { transform: translateX(3px); box-shadow: 0 8px 22px rgba(0,0,0,0.25); }
        .ms-panel:focus-visible { outline: 3px solid #fff; outline-offset: -3px; }

        /* Mobile: bandas horizontales apiladas; conservan imagen + logo (identidad por marca) */
        @media (max-width: 768px) {
          .ms-strip { flex-direction: column; height: auto; min-height: 0; }
          .ms-panel {
            flex: none; height: 130px;
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.12);
            transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .ms-panel:last-child { border-bottom: none; }
          .ms-bg { transform: none; filter: blur(1px) saturate(1.05); }
          .ms-panel.active .ms-bg { transform: none; }
          .ms-panel.active { height: auto; min-height: 300px; padding: 28px 0; }
          .ms-body { max-width: 90%; }
          .ms-panel.active .ms-body { max-height: 360px; }
        }
```

- [ ] **Step 4: Iniciar el dev server**

```
cd C:\Users\nachi\Downloads\VSC\agents\god\grupocem-web
vercel dev
```
Esperado: server en `http://localhost:3000`. (Es el flujo del proyecto — NO usar `python http.server`.)

- [ ] **Step 5: Verificar estructura + estado inicial (Playwright MCP)**

`browser_navigate` → `http://localhost:3000/#marcas`, luego `browser_evaluate`:

```js
() => {
  const panels = [...document.querySelectorAll('.ms-strip .ms-panel')];
  return {
    count: panels.length,
    active: panels.findIndex(p => p.classList.contains('active')),
    logoFilter: getComputedStyle(panels[0].querySelector('.ms-logo')).filter,
    bgHasGrad: getComputedStyle(panels[1].querySelector('.ms-bg')).backgroundImage.includes('gradient')
  };
}
```
Esperado: `{ count: 4, active: 0, logoFilter: "brightness(0) invert(1)", bgHasGrad: true }`.
Además `browser_take_screenshot` → 4 paneles full-bleed, Carnave expandido con pills + CTA, logos blancos.

- [ ] **Step 6: Verificar auto-rotación (~5s)**

`browser_evaluate` (devuelve una Promise; permitir ~6s de timeout):

```js
() => new Promise((res) => {
  const get = () => [...document.querySelectorAll('.ms-strip .ms-panel')]
    .findIndex(p => p.classList.contains('active'));
  const before = get();
  setTimeout(() => res({ before, after: get() }), 5500);
})
```
Esperado: `after !== before` (ej. `{ before: 0, after: 1 }`). Si el MCP corta la Promise por timeout, fallback: dos `browser_take_screenshot` separados ~6s y comparar el panel expandido.

- [ ] **Step 7: Verificar hover takeover + reanudación**

`browser_hover` sobre el panel `[data-brand="cia"]`, luego `browser_evaluate`:

```js
() => {
  const panels = [...document.querySelectorAll('.ms-strip .ms-panel')];
  return { active: panels.findIndex(p => p.classList.contains('active')) };
}
```
Esperado: `{ active: 2 }` (Cía), y mientras el mouse está encima NO rota.

- [ ] **Step 8: Verificar CTA (link correcto, sin abrir pestaña)**

`browser_evaluate`:

```js
() => {
  const a = document.querySelector('.ms-panel.active .ms-cta');
  return { href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel') };
}
```
Esperado: `target` = `_blank`, `rel` contiene `noopener`, `href` = sitio de la marca activa.

- [ ] **Step 9: Verificar mobile (bandas apiladas + tap)**

`browser_resize` 390×800, luego `browser_evaluate`:

```js
() => {
  const strip = document.querySelector('.ms-strip');
  const panels = [...strip.querySelectorAll('.ms-panel')];
  return {
    dir: getComputedStyle(strip).flexDirection,
    stacked: panels[0].getBoundingClientRect().bottom <= panels[1].getBoundingClientRect().top + 2
  };
}
```
Esperado: `{ dir: "column", stacked: true }`. Luego `browser_click` en `[data-brand="ovo"]` y `browser_take_screenshot`: la banda Ovo Food se expande mostrando specs, conservando su fondo + logo. `browser_resize` de vuelta a 1280×800 al terminar.

- [ ] **Step 10: Commit**

```bash
git add index.html
git commit -m "feat(marcas): tira horizontal de paneles con rotacion + hover overlay

Reemplaza el acordeon vertical por 4 paneles full-bleed (namespace ms-*),
auto-rotacion en desktop, hover/focus takeover, reduced-motion guard,
fallback mobile apilado y fallback de fondo por gradiente de marca."
```

---

## Task 2: Eliminar CSS muerto del diseño anterior de Marcas

El bloque "panel drama" (`.brand-panel`, `.panel-index*`, `.panel-brand-tag`, `.brand-tab*`) quedó sin uso (verificado: cero referencias en markup). Es CSS muerto directamente ligado a la sección que rediseñamos → se elimina.

**Files:**
- Modify: `index.html` (css ~321–370)

- [ ] **Step 1: Confirmar que no hay referencias en markup**

Buscar en `index.html` (Grep) los patrones `class="[^"]*brand-panel`, `class="[^"]*panel-index`, `class="[^"]*panel-brand-tag`, `class="[^"]*brand-tab`.
Esperado: **0 resultados** (solo existían las definiciones CSS, ya verificado).

- [ ] **Step 2: Eliminar el bloque muerto**

Localizar y eliminar desde el comentario `/* ── Marcas panel drama: ghost index + active tab mustard ── */` hasta la regla `.brand-tab { position: relative; }` inclusive (≈ líneas 321–370, justo antes de `/* ── Noticias editorial upgrade ── */`). No tocar el comentario de Noticias ni nada debajo.

- [ ] **Step 3: Verificar que la página sigue intacta**

`browser_navigate` recargar `http://localhost:3000/#marcas` y `browser_take_screenshot`. Esperado: la sección Marcas se ve igual que tras Task 1; ninguna otra sección cambió (la sección Noticias debajo intacta).

- [ ] **Step 4: Verificar que no quedan remanentes del acordeón viejo**

Grep en `index.html` por `brand-row` y `initBrandAccordion`.
Esperado: **0 resultados**.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "chore(marcas): eliminar CSS muerto del diseno anterior (panel-drama, brand-tab)"
```

---

## Integración futura (FUERA DE ALCANCE de este plan)

**Sistema de capas (ya implementado, post-iteración):** cada panel tiene 3 capas —
`.ms-bg` (imagen, var `--ms-img`; gradiente `--ms-grad` como fallback) + `.ms-tint`
(tinte de marca: borde fuerte con `--ms-accent`, centro suave con `--ms-accent-soft`,
que **baja opacidad en `.active` → revela más foto**) + `.ms-scrim` (legibilidad).

**Placeholder actual:** las 4 panels usan `--ms-img:url('assets/nosotros/campos-aereo.jpg')`
(la MISMA foto de campo) sólo para demostrar el efecto hasta tener las de Higgsfield.

**Imágenes Higgsfield por marca.** Cuando existan, el swap es de una línea por marca:

1. Guardar las imágenes en `assets/marcas/{carnave,avigan,cia,ovo}.jpg` (portrait, aptas para `cover` + blur + scrim; generadas LIMPIAS, ver §5 del spec).
2. En cada `<article class="ms-panel" ...>` cambiar el inline `--ms-img` a su foto:
   `--ms-img:url('assets/marcas/avigan.jpg')`. El `--ms-accent` (borde de marca) y el resto del sistema ya quedan.

**Precondición (del spec, sección 5):** antes de generar cada imagen se reúnen 1+ **imágenes de referencia** (pedidas a Nacho o buscadas) y se referencian en el prompt de Higgsfield. Flujo por marca: reunir referencia(s) → componer prompt → **OK de Nacho** → generar → registrar en `60-generate/higgsfield/runs/`. Lo opera `generative-director`. Es un paso pago y separado.

Dirección de arte: Carnave = local/carnicería desenfocado · Avigan = campo/trigal · Cía Avícola = huevos · Ovo Food = huevo en polvo deshidratado (macro).

**Generar limpio, oscurecer en CSS:** Higgsfield entrega la imagen a full opacidad, sin scrim ni blur horneados. El oscurecimiento (`.ms-scrim`), el blur (`.ms-bg` filter) y la opacidad son capas CSS — el panel activo se ve más nítido/brillante que los inactivos con el mismo asset. No pedir imágenes pre-oscurecidas (quedan barrosas y atan el ajuste a regenerar).

---

## Self-Review

**Spec coverage:**
- Acordeón horizontal full-bleed 4 paneles → Task 1 (HTML+CSS). ✓
- Rota solo ~5s + loop → `initBrandStrip` `ROTATE_MS`/`setInterval` + Step 6. ✓
- Hover pausa y expande; salir reanuda → `mouseenter`/`mouseleave` + Step 7. ✓
- Clic/CTA abre sitio → `<a.ms-cta target=_blank>` + Step 8. ✓
- Eliminar descripción larga → el markup nuevo no incluye `.brand-row-desc`. ✓
- Reduced-motion sin auto-rotación → guard `REDUCED` en `start()`. ✓
- Mobile bandas apiladas con identidad + tap → media query + Step 9. ✓
- Fallback gradiente si no hay imagen → `--ms-grad` gradiente + `.ms-bg`. ✓
- Más presencia a los logos → logos centrados, blancos, escalan en activo. ✓
- Imágenes Higgsfield = paso aparte con OK → sección "Integración futura". ✓

**Placeholder scan:** sin TBD/TODO; todo el código (HTML/CSS/JS) está completo e inline. ✓

**Type/naming consistency:** clases `ms-strip / ms-panel / ms-bg / ms-scrim / ms-logo / ms-body / ms-tag / ms-pills / ms-pill / ms-cta` usadas idénticas en HTML, CSS y JS. `data-brand` valores `carnave/avigan/cia/ovo` coinciden con los selectores CSS (`avigan`, `ovo`). Función `initBrandStrip`, `setActive/start/stop` consistentes. ✓

---

## Ajustes post-review (code-quality)

Tras el review final se aplicaron 2 fixes Important sobre el código de Task 1 (mismo `index.html`, sin commit):

1. **`.ms-bg` estático (perf / GPU-jank).** Se quitó la `transition: transform/filter` y el override `.ms-panel.active .ms-bg`. Antes animaba `scale` + `blur` en cada activación (cada ~5s y en hover) = re-raster por frame, el anti-patrón documentado del vault (no medible en headless). Ahora blur (1px) + scale (1.06) son fijos; el foco del activo lo dan el ensanche `flex`, el reveal de `.ms-body` y el `scale` del `.ms-logo`. Sin pérdida visual perceptible.
2. **Reduced-motion completo (spec §3).** El guard JS solo cortaba el timer; las transiciones CSS seguían. Se agregó `@media (prefers-reduced-motion: reduce){ .ms-panel,.ms-body,.ms-logo,.ms-scrim{ transition:none } }`.

Verificación: suite Playwright 15/15 PASS tras los fixes; screenshots desktop/hover/mobile OK.
