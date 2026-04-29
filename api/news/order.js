// api/news/order.js — PUT { ids: [...] } → reordena el array según ese orden.
import { readNoticias, writeNoticias } from '../../lib/kv.js';
import { verifyRequest } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    res.status(405).send('Method Not Allowed');
    return;
  }

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

  if (!Array.isArray(body.ids) || body.ids.some((x) => typeof x !== 'string')) {
    res.status(400).json({ error: 'ids_must_be_string_array' });
    return;
  }

  const arr = await readNoticias();
  if (body.ids.length !== arr.length) {
    res.status(400).json({ error: 'ids_length_mismatch', expected: arr.length, got: body.ids.length });
    return;
  }

  const byId = new Map(arr.map((n) => [n.id, n]));
  const reordered = [];
  for (const id of body.ids) {
    const n = byId.get(id);
    if (!n) {
      res.status(400).json({ error: 'unknown_id', id });
      return;
    }
    reordered.push(n);
  }
  await writeNoticias(reordered);

  res.status(200).json({ ok: true });
}
