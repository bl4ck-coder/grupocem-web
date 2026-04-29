// api/news.js — GET público (5 primeras), GET ?all=1 admin (todas), POST admin (crear).
import { v4 as uuidv4 } from 'uuid';
import { readNoticias, writeNoticias } from '../lib/kv.js';
import { verifyRequest } from '../lib/auth.js';

const PUBLIC_LIMIT = 5;

function validateNoticiaInput(body) {
  const errs = [];
  if (typeof body.titulo !== 'string' || !body.titulo.trim() || body.titulo.length > 100) errs.push('titulo');
  if (typeof body.fecha !== 'string' || !body.fecha.trim() || body.fecha.length > 30) errs.push('fecha');
  if (typeof body.marca !== 'string' || !body.marca.trim() || body.marca.length > 50) errs.push('marca');
  if (typeof body.descripcion !== 'string' || !body.descripcion.trim() || body.descripcion.length > 280) errs.push('descripcion');
  if (typeof body.imagen !== 'string' || !/^https?:\/\//.test(body.imagen)) errs.push('imagen');
  if (typeof body.imagenPathname !== 'string' || !body.imagenPathname) errs.push('imagenPathname');
  if (body.link != null) {
    if (typeof body.link !== 'string' || !/^https?:\/\//.test(body.link)) errs.push('link');
  }
  return errs;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const all = req.query && req.query.all === '1';
    if (all) {
      const session = verifyRequest(req);
      if (!session) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }
      const noticias = await readNoticias();
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json(noticias);
      return;
    }
    const noticias = await readNoticias();
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.status(200).json(noticias.slice(0, PUBLIC_LIMIT));
    return;
  }

  if (req.method === 'POST') {
    const session = verifyRequest(req);
    if (!session) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const body = req.body;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: 'invalid_json' });
      return;
    }

    const errs = validateNoticiaInput(body);
    if (errs.length) {
      res.status(400).json({ error: 'validation', fields: errs });
      return;
    }

    const now = new Date().toISOString();
    const noticia = {
      id: uuidv4(),
      titulo: body.titulo.trim(),
      fecha: body.fecha.trim(),
      marca: body.marca,
      descripcion: body.descripcion.trim(),
      imagen: body.imagen,
      imagenPathname: body.imagenPathname,
      link: body.link ? body.link.trim() : null,
      createdAt: now,
      updatedAt: now,
    };

    const arr = await readNoticias();
    arr.unshift(noticia);
    await writeNoticias(arr);

    res.status(201).json(noticia);
    return;
  }

  res.status(405).send('Method Not Allowed');
}
