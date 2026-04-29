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

Pasos resumidos (ver spec sección 8 para el detalle):

1. Capturar todos los registros DNS actuales del dominio (especial atención a MX y TXT).
2. 24-48 h antes: bajar TTL de A y CNAME a 300s.
3. En Vercel → Domains → agregar `grupocem.com.ar` y `www.grupocem.com.ar`.
4. En el panel del registrador (NIC.ar / DonWeb / etc.):
   - Reemplazar `A` de la raíz por `76.76.21.21`.
   - Reemplazar `CNAME` de `www` por `cname.vercel-dns.com`.
   - **NO tocar registros MX ni TXT del correo.**
5. Verificar SSL en Vercel y mandar mail de prueba para confirmar que el correo siga andando.
6. Subir TTL a 3600s. Apagar la web vieja o moverla a `legacy.grupocem.com.ar`.

Si NIC.ar no permite editar A de la raíz, delegar nameservers a Cloudflare (gratis) y desde ahí apuntar a Vercel.
