// lib/auth.js — Firma y verifica cookies de sesión.
import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not set');
  return s;
}

export function signSessionCookie() {
  const token = jwt.sign({ admin: true }, getSecret(), { expiresIn: '7d' });
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export function verifyRequest(req) {
  const cookieHeader = req.headers.get ? req.headers.get('cookie') : req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  try {
    const payload = jwt.verify(match[1], getSecret());
    return payload && payload.admin ? payload : null;
  } catch {
    return null;
  }
}

export const COOKIE = { COOKIE_NAME, COOKIE_MAX_AGE };
