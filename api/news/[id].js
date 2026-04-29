// api/news/[id].js — PUT (editar), DELETE (borrar + blob).
import { del } from '@vercel/blob';
import { readNoticias, writeNoticias } from '../../lib/kv.js';
import { verifyRequest } from '../../lib/auth.js';

function validatePartial(body) {
  const errs = [];
  if (body.titulo != null && (typeof body.titulo !== 'string' || !body.titulo.trim() || body.titulo.length > 100)) errs.push('titulo');
  if (body.fecha != null && (typeof body.fecha !== 'string' || !body.fecha.trim() || body.fecha.length > 30)) errs.push('fecha');
  if (body.marca != null && (typeof body.marca !== 'string' || !body.marca.trim() || body.marca.length > 50)) errs.push('marca');
  if (body.descripcion != null && (typeof body.descripcion !== 'string' || !body.descripcion.trim() || body.descripcion.length > 280)) errs.push('descripcion');
  if (body.imagen != null && (typeof body.imagen !== 'string' || !/^https?:\/\//.test(body.imagen))) errs.push('imagen');
  if (body.imagenPathname != null && (typeof body.imagenPathname !== 'string' || !body.imagenPathname)) errs.push('imagenPathname');
  if (body.link != null) {
    if (typeof body.link !== 'string' || !/^https?:\/\//.test(body.link)) errs.push('link');
  }
  return errs;
}

export default async function handler(req, res) {
  const session = verifyRequest(req);
  if (!session) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const id = req.query && req.query.id;
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'id_required' });
    return;
  }

  const arr = await readNoticias();
  const idx = arr.findIndex((n) => n.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'not_found' });
    return;
  }

  if (req.method === 'PUT') {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: 'invalid_json' });
      return;
    }

    const errs = validatePartial(body);
    if (errs.length) {
      res.status(400).json({ error: 'validation', fields: errs });
      return;
    }

    const prev = arr[idx];
    const oldPathname = prev.imagenPathname;
    const newPathname = body.imagenPathname ?? prev.imagenPathname;
    const imageChanged = body.imagenPathname && body.imagenPathname !== oldPathname;

    const updated = {
      ...prev,
      titulo: body.titulo?.trim() ?? prev.titulo,
      fecha: body.fecha?.trim() ?? prev.fecha,
      marca: body.marca ?? prev.marca,
      descripcion: body.descripcion?.trim() ?? prev.descripcion,
      imagen: body.imagen ?? prev.imagen,
      imagenPathname: newPathname,
      link: body.link === undefined ? prev.link : (body.link ? body.link.trim() : null),
      updatedAt: new Date().toISOString(),
    };
    arr[idx] = updated;
    await writeNoticias(arr);

    if (imageChanged && oldPathname) {
      try { await del(oldPathname); } catch { /* huérfano queda → cron lo limpia */ }
    }

    res.status(200).json(updated);
    return;
  }

  if (req.method === 'DELETE') {
    const removed = arr.splice(idx, 1)[0];
    await writeNoticias(arr);
    if (removed?.imagenPathname) {
      try { await del(removed.imagenPathname); } catch { /* huérfano queda → cron lo limpia */ }
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).send('Method Not Allowed');
}
