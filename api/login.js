// api/login.js — POST { password } → set session cookie.
import bcrypt from 'bcryptjs';
import { signSessionCookie } from '../lib/auth.js';
import { checkLoginRateLimit, getClientIP } from '../lib/ratelimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const ip = getClientIP(req);
  const limit = await checkLoginRateLimit(ip);
  if (!limit.ok) {
    res.setHeader('Retry-After', String(limit.retryAfter));
    res.status(429).json({ error: 'rate_limited', retryAfter: limit.retryAfter });
    return;
  }

  const body = req.body;
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'invalid_json' });
    return;
  }

  const { password } = body;
  if (typeof password !== 'string' || password.length === 0) {
    res.status(400).json({ error: 'password_required' });
    return;
  }

  const expected = process.env.ADMIN_PASSWORD_HASH;
  if (!expected) {
    res.status(500).json({ error: 'server_misconfigured' });
    return;
  }

  const ok = await bcrypt.compare(password, expected);
  if (!ok) {
    res.status(401).json({ error: 'invalid_credentials' });
    return;
  }

  res.setHeader('Set-Cookie', signSessionCookie());
  res.status(200).json({ ok: true });
}
