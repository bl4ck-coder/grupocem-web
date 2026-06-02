# Rediseño sección "Marcas" — Grupo CEM

**Fecha:** 2026-06-01
**Proyecto:** grupocem-web (`index.html`)
**Reemplaza:** el acordeón vertical actual (`.brand-accordion`) de la sección `#marcas`.

---

## 1. Objetivo

Convertir la sección Marcas de un acordeón vertical de filas en un **acordeón
horizontal full-bleed de 4 paneles** (Carnave · Avigan · Cía Avícola · Ovo Food),
con imagen atmosférica por marca, rotación automática del panel activo y
expansión al hover. Metas explícitas del pedido:

- Más **presencia a cada logo**.
- Estilo **overlay** (panel con specs sobre la imagen de marca).
- Que los paneles **"se pasen solos"** (auto-rotación).
- **Hover sobre un panel** despliega su overlay.
- **Eliminar** el párrafo de descripción largo de cada marca.

## 2. Estructura visual

Tira full-bleed (borde a borde del viewport) de 4 paneles verticales. Un panel
está **activo** (expandido ~2× el ancho de los demás); los otros 3 quedan como
franjas finas con el logo en vertical.

```
┌──────────────────────────────────────────────────────────────────┐
│  ║C║   ███████████  AVIGAN  ███████████   ║Cía║   ║Ovo║            │
│  ║a║   [imagen campo, blur + scrim]       ║Aví║   ║Foo║            │
│  ║r║         Agronegocios · Nutrición     ║col║   ║d ║            │
│  ║n║       [Nutrición][Laboratorio][...]  ║a  ║   ║  ║            │
│  ║║║            VISITAR SITIO →            ║║  ║   ║║ ║            │
└──────────────────────────────────────────────────────────────────┘
   franja fina      panel activo (expandido)     franjas finas
```

- **Altura:** ~70vh en desktop (cinematográfico, sin tapar el resto del scroll).
- **Estado reposo (franja fina):** solo el logo (imagen PNG en blanco), centrado horizontalmente. *(Los logos son imágenes, no texto → no se rotan a vertical; van centrados.)*
- **Estado activo (expandido):** logo grande + tag de 1 línea + pills de specs + CTA "Visitar sitio".
- Cada panel: capa de imagen (`background` o `<img>`) con **blur sutil (~1.5px) + scrim oscuro** (gradiente a negro hacia abajo) para que el logo blanco y el texto sean siempre legibles.

## 3. Comportamiento (interacción)

| Evento | Resultado |
|---|---|
| Carga | Panel 1 (Carnave) activo. Arranca timer de auto-rotación. |
| Auto-rotación | Cada **~5s** pasa al siguiente panel; loop infinito. |
| `mouseenter` en un panel | Toma el control: pausa la rotación y expande ese panel. |
| `mouseleave` de la tira | Reanuda la auto-rotación desde el panel actual. |
| `click` en panel activo o su CTA | Abre el sitio de la marca (`target="_blank" rel="noopener"`). |
| Teclado | Paneles focuseables (`tabindex`/botón); foco = se expande; Enter/click = abre sitio. |
| `prefers-reduced-motion: reduce` | **Sin** auto-rotación. Solo hover/focus expande. Transiciones de `flex` reducidas. |

Transición de ancho: `flex` con `cubic-bezier(.65,0,.35,1)`, ~0.55s. Un solo panel
activo a la vez (mismo patrón mental que el acordeón actual, eje cambiado a horizontal).

## 4. Contenido por marca

El párrafo largo (`.brand-row-desc`) **se elimina**. Las specs salen de las pills
que ya existen hoy por marca. Datos (ya presentes en el HTML actual):

| Marca | Tag (1 línea) | Pills (specs) | Href | Acento |
|---|---|---|---|---|
| Carnave | Desde 1974 · Integración avícola | Frigorífico propio · Exportación · Tiendas propias · Franquicias · Centros de distribución | carnave.com.ar | `#b71c1c` |
| Avigan | Agronegocios · Nutrición · Laboratorio | Agro Insumos · Acopio · Nutrición · Sub productos · Laboratorio · Asesoramiento | avigan.com.ar | `#2e7d32` |
| Cía Avícola | 120M huevos/año · FSSC 22000 | Distribución a supermercados · Huevo con fecha y marca · Suplementos vitamínicos · Mercado gastronómico | ciaavicola.com.ar | `#C8860A` |
| Ovo Food | Ovoproductos industriales · CHEF · VITAL | Ovoproductos industrializados · Deshidratado y procesamiento · Línea CHEF · Línea VITAL | ovofood.com.ar | `#0277BD` |

> En estado activo se muestran ~4 pills (las más representativas) para no saturar; el resto se omite. CTA fija: "Visitar sitio →".

## 5. Imagen por marca (Higgsfield)

Una imagen cinematográfica vertical por marca, **misma dirección de arte**
(grade consistente, atmósfera agro/industrial, levemente desaturada, zona superior
con margen oscuro para legibilidad del logo). Dirección de arte:

| Marca | Escena |
|---|---|
| Carnave | Local / carnicería de la marca, **desenfocado** (interior cálido, mostrador). |
| Avigan | Campo / trigal agro (puede reutilizar el lenguaje de `campos-aereo.jpg`). |
| Cía Avícola | Huevos (huevos enteros, clasificación / packaging limpio). |
| Ovo Food | **Huevo en polvo deshidratado** (macro de polvo crema-amarillo, presentación industrial-nutricional — línea VITAL/CHEF). |

**Specs de generación (para `generative-director`):**
- Orientación portrait (~3:4 o 4:5), alta resolución, sujeto centrado.
- Apta para `object-fit: cover` con recorte tanto en franja fina como en panel ancho.
- **Generar la imagen LIMPIA: full opacidad, SIN oscurecer ni blur horneados.** El
  scrim oscuro, el blur y cualquier opacidad se aplican en **CSS en runtime**. El scrim
  y el blur se aplican **estáticos** (no animados por estado: animar blur/scale sobre una
  capa filtrada = re-raster por frame, jank conocido del vault). El panel activo se
  distingue por el **ensanche + el contenido revelado**, no por un fondo más brillante.
  Todo se ajusta sin regenerar (lo caro). Dirección de arte: tono medio/moody con
  "lugar" para el overlay (zona superior tranquila para el logo, base que no compita
  con las pills) — pero el negro de legibilidad lo pone el CSS, no la imagen.
- **La generación es un paso aparte, pago, y requiere OK explícito de Nacho antes de generar.** Se registra en `60-generate/higgsfield/runs/`.

**Precondición — imágenes de referencia (antes de generar):**
- Para cada marca, primero se **juntan 1+ imágenes de referencia** (pedírselas a
  Nacho o buscarlas) y se **referencian en el prompt de Higgsfield** (generación
  guiada por referencia, no solo texto). No se compone el prompt ni se genera
  hasta tener las referencias.
- Flujo por marca: (1) reunir referencia(s) → (2) componer prompt que las
  referencia → (3) OK de Nacho → (4) generar → (5) registrar en `runs/`.

**Fallback** mientras no existan las imágenes: gradiente del color de marca
(`--row-accent`). La estructura no depende de las imágenes — el fondo es
intercambiable (`data-brand` → `background-image` o gradiente).

## 6. Mobile (responsive)

El acordeón horizontal no entra en pantallas finas. Fallback en `<= 768px`:

- **4 bandas horizontales apiladas**, una por marca.
- Cada banda **conserva su identidad**: imagen/fondo de la marca + logo prominente centrado (no se aplana a color plano).
- **Tap** sobre una banda la expande para mostrar tag + pills + CTA (acordeón vertical, una abierta a la vez).
- **Sin auto-rotación** en mobile (perf + ahorro de datos).

## 7. Cambios en el código

Todo en `index.html` (single-file con `<style>` y `<script>` embebidos), quirúrgico
y acotado a la sección Marcas:

1. **HTML** — reemplazar el bloque `<section id="marcas">` (≈ líneas 1269–1372):
   nueva tira `.brand-strip` con 4 `.brand-panel[data-brand]`, cada uno con capa de
   imagen, scrim, logo, y body (tag + pills + CTA).
2. **CSS** — reemplazar el bloque del acordeón (`/* ── B2: Marcas acordeón vertical ── */`,
   ≈ líneas 854–1042) por los estilos de la tira horizontal + el fallback mobile.
   Eliminar las reglas del acordeón viejo que quedan muertas (`.brand-row*`,
   `.brand-row-fade`, panel drama del `ghost index`/`active tab mustard` ≈ línea 321
   si quedan sin uso).
3. **JS** — reemplazar la IIFE `initBrandAccordion()` (≈ líneas 1373–1442) por
   `initBrandStrip()`: timer de auto-rotación, hover takeover, reduced-motion guard,
   click-through, y el handler mobile tap-to-expand.
4. **Assets** — agregar `assets/marcas/{carnave,avigan,cia-avicola,ovofood}.jpg`
   (o `.webp`) cuando se generen con Higgsfield. Hasta entonces, fallback gradiente.

> Dead code adyacente no relacionado con Marcas: no se toca (principio de cambios quirúrgicos).

## 8. Unidades (para implementar/testear por separado)

- **`brand-strip` (markup + CSS)** — la tira y sus estados visuales. Testeable a ojo con fallback gradiente, sin JS.
- **`initBrandStrip` (JS comportamiento)** — rotación, hover, reduced-motion, click. Depende del markup; testeable con los data-attributes.
- **Responsive/mobile** — el fallback apilado. Testeable en viewport angosto.
- **Imágenes Higgsfield** — assets externos, desacoplados (fallback si faltan). Tarea de producción separada.

## 9. Criterios de éxito

- [ ] La sección muestra 4 paneles full-bleed con un activo expandido.
- [ ] El activo rota solo cada ~5s y loopea.
- [ ] Hover pausa la rotación y expande el panel apuntado; al salir, reanuda.
- [ ] Clic en panel activo / CTA abre el sitio de la marca en nueva pestaña.
- [ ] No queda rastro del párrafo de descripción largo.
- [ ] `prefers-reduced-motion` desactiva la auto-rotación.
- [ ] En mobile: 4 bandas apiladas con imagen + logo propios, tap expande, sin auto-rotación.
- [ ] Con imágenes ausentes, el fallback gradiente se ve correcto (no roto).

## 10. Fuera de alcance

- Generación efectiva de las imágenes Higgsfield (paso posterior, con OK de Nacho).
- Cambios en otras secciones del sitio.
- Cambios en el panel admin / API (la sección Marcas es estática en `index.html`).
