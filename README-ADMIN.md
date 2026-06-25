# Admin de Noticias — GrupoCEM

## Cómo administrar las noticias

1. Abrí `https://grupocem.com.ar/admin/` (o la URL de Vercel preview).
2. Ingresá la contraseña.
3. En el dashboard:
   - **+ Nueva** crea una noticia. Subí una imagen (drag & drop o click), completá título, fecha, marca, descripción y opcionalmente un link externo. Guardar.
   - **✎** edita una noticia existente.
   - **🗑** la borra (con confirmación). La imagen asociada también se elimina.
   - **⋮⋮** (drag handle a la izquierda de cada fila): arrastrá para reordenar. Las **primeras 5** filas son las que se muestran en el sitio público.
4. **Salir** cierra la sesión.

## Si olvidan la contraseña

Avisarle al desarrollador. El proceso es:

1. Dev corre `npm run hash-password` con la nueva contraseña.
2. Dev pega el nuevo hash en Vercel → Settings → Environment Variables → `ADMIN_PASSWORD_HASH`.
3. Dev redeploya (un click en Vercel).

No hay flujo automático de "olvidé mi contraseña" por diseño — ver spec.

## Para devs

### Setup local

```bash
cd agents/god/grupocem-web
npm install
# Crear .env.local (ver más abajo)
npx vercel dev
```

### `.env.local` requerido

```
JWT_SECRET=<openssl rand -hex 32>
ADMIN_PASSWORD_HASH=<output de npm run hash-password>
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_URL=...
BLOB_READ_WRITE_TOKEN=...
CRON_SECRET=<random>
```

Las KV/Blob keys se obtienen del dashboard de Vercel tras crear los Storage. Si querés evitar configurar KV/Blob localmente, usá un deploy preview de Vercel para probar.

### Producción

- En Vercel → Settings → Environment Variables agregar las 6 variables anteriores (las KV/Blob las inyecta Vercel automáticamente al crear los Storage).
- El cron `cleanup-blobs` corre el día 1 de cada mes a las 03:00 UTC, definido en `vercel.json`.

### Notas de implementación

- Todos los handlers usan signature legacy `(req, res)`. La signature Web Standard `(req)=>Response` cuelga `vercel dev` v52 en Windows + Node 24.
- `/api/upload` recibe **JSON con base64** (`{file: "<base64>", mime: "image/png"}`), no multipart. Razón: `vercel dev` consume el body multipart antes de pasar al handler en Windows.
- Producción de Vercel acepta ambas formas; mantenemos la consistencia para que el mismo código corra local y en prod.

### Cutover de dominio `grupocem.com.ar`

> **Estado 2026-06-25:** `grupocem.com.ar` y `www.grupocem.com.ar` ya están **agregados al
> proyecto Vercel `grupocem-web-ahal`** (quedan en "misconfigured" hasta que apunte el DNS).
> Único bloqueante: acceso al panel de Cloudflare.

**DNS actual (snapshot para rollback):**

| Capa | Valor actual |
|---|---|
| Registrar | NIC.ar (`.com.ar`) — **no se toca** |
| DNS / nameservers | **Cloudflare**: `max.ns.cloudflare.com`, `rachel.ns.cloudflare.com` |
| `A` raíz (`grupocem.com.ar`) | `200.2.120.82` |
| `www` | `CNAME → carnave.grupocem.com.ar` |
| `MX` (correo) | `grupocem-com-ar.mail.protection.outlook.com` (Microsoft 365) |
| `TXT` | `v=spf1 include:spf.protection.outlook.com include:vtigermails.com -all` · `MS=ms51987285` |

Como el DNS ya vive en **Cloudflare**, **NO hay que tocar NIC.ar**. Todo el cambio es en Cloudflare.
El TTL del `A`/`CNAME` ya está en 300s → propagación rápida.

**Qué pedirle al cliente:** acceso al panel de **Cloudflare** del dominio (invitación como Member
con permiso de DNS, o usuario + contraseña + 2FA). Preguntar **quién creó/maneja esa cuenta**
(puede ser un dev o empresa anterior).

**Cambios en Cloudflare (cuando haya acceso):**

1. `A` raíz `grupocem.com.ar`: `200.2.120.82` → **`76.76.21.21`** — en **DNS only (nube gris)**.
2. `www`: apuntar a Vercel con **`A 76.76.21.21`** (o `CNAME → cname.vercel-dns.com`) — en **DNS only**.
3. **NO TOCAR**: `MX` (Outlook), `TXT` SPF, `TXT MS=...`. El correo queda intacto.
4. No hace falta TXT `_vercel` de verificación (confirmado al agregar el dominio por CLI: sólo pide el `A`).

**Verificación:**

1. Vercel auto-verifica y emite SSL en minutos (llega un mail a la cuenta de Vercel).
2. Abrir `https://grupocem.com.ar` y `https://www.grupocem.com.ar` con candado OK.
3. **Probar correo**: mandar un mail *a* `info@grupocem.com.ar` y *desde* esa casilla hacia afuera.
4. (Opcional) en Vercel → Domains, setear `www` como **redirect 308 → `grupocem.com.ar`**.
5. Dejar la web vieja prendida 3-7 días; luego apagarla o moverla a `legacy.grupocem.com.ar`.

**Rollback:** en Cloudflare volver `A` raíz a `200.2.120.82` y `www` a `carnave.grupocem.com.ar` (~5 min).
