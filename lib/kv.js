// lib/kv.js — Acceso a la única key "noticias" en Vercel KV.
import { kv } from '@vercel/kv';

const KEY = 'noticias';

export async function readNoticias() {
  const raw = await kv.get(KEY);
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [];
}

export async function writeNoticias(arr) {
  if (!Array.isArray(arr)) throw new Error('writeNoticias: arr must be array');
  await kv.set(KEY, arr);
}
