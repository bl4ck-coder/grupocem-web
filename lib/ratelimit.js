// lib/ratelimit.js — Rate limit por IP usando KV con TTL.
import { kv } from '@vercel/kv';

export async function checkLoginRateLimit(ip) {
  const shortKey = `rl:login:${ip}`;
  const longKey = `rl:login:long:${ip}`;
  const shortCount = await kv.incr(shortKey);
  if (shortCount === 1) await kv.expire(shortKey, 15 * 60); // 15 min
  if (shortCount > 5) {
    return { ok: false, retryAfter: 15 * 60, reason: 'short' };
  }
  const longCount = await kv.incr(longKey);
  if (longCount === 1) await kv.expire(longKey, 60 * 60); // 1 h
  if (longCount > 50) {
    await kv.expire(longKey, 24 * 60 * 60);
    return { ok: false, retryAfter: 24 * 60 * 60, reason: 'long' };
  }
  return { ok: true };
}

export function getClientIP(req) {
  const xff = req.headers.get ? req.headers.get('x-forwarded-for') : req.headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim();
  return 'unknown';
}
