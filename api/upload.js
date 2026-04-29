// api/upload.js — POST { file, mime } JSON con base64 → sube a Blob → { url, pathname }.
// Evita multipart porque vercel dev v52 consume el body antes del handler legacy.
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import { verifyRequest } from '../lib/auth.js';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const DATA_URL_RE = /^data:([^;,]+)(?:;base64)?,(.*)$/s;

function decodeFile(rawFile, declaredMime) {
  if (typeof rawFile !== 'string' || !rawFile) return { error: 'file_required' };
  let mime = declaredMime;
  let b64 = rawFile;
  const m = rawFile.match(DATA_URL_RE);
  if (m) {
    mime = mime || m[1];
    b64 = m[2];
  }
  if (typeof mime !== 'string' || !ALLOWED_MIME.has(mime)) return { error: 'invalid_mime', got: mime };
  let buf;
  try { buf = Buffer.from(b64, 'base64'); }
  catch { return { error: 'invalid_base64' }; }
  if (buf.length === 0) return { error: 'invalid_base64' };
  if (buf.length > MAX_BYTES) return { error: 'file_too_large', limit: MAX_BYTES };
  return { buf, mime };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

  const decoded = decodeFile(body.file, body.mime);
  if (decoded.error) {
    res.status(400).json(decoded);
    return;
  }

  const ext = EXT_BY_MIME[decoded.mime];
  const pathname = `news/${uuidv4()}.${ext}`;
  const blob = await put(pathname, decoded.buf, { access: 'public', contentType: decoded.mime });

  res.status(200).json({ url: blob.url, pathname: blob.pathname });
}
