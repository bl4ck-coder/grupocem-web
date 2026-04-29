// api/cron/cleanup-blobs.js — Lista blobs en news/ y borra los no referenciados en KV.
// Vercel Cron lo invoca con header Authorization: Bearer <CRON_SECRET>.
import { list, del } from '@vercel/blob';
import { readNoticias } from '../../lib/kv.js';

export default async function handler(req, res) {
  const auth = req.headers['authorization'];
  const expected = process.env.CRON_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    res.status(401).send('Unauthorized');
    return;
  }

  const noticias = await readNoticias();
  const referenced = new Set(noticias.map((n) => n.imagenPathname).filter(Boolean));

  let cursor;
  let scanned = 0;
  let deleted = 0;
  do {
    const result = await list({ prefix: 'news/', cursor });
    for (const blob of result.blobs) {
      scanned += 1;
      if (!referenced.has(blob.pathname)) {
        try { await del(blob.pathname); deleted += 1; } catch { /* ignore */ }
      }
    }
    cursor = result.cursor;
  } while (cursor);

  res.status(200).json({ scanned, deleted, kept: scanned - deleted });
}
