/**
 * Admin authentication: a signed session cookie issued after a password check.
 *
 * Deliberately dependency-free so a self-hosted deployment needs no mail provider
 * or external identity service. Set ADMIN_PASSWORD and SESSION_SECRET in the env.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'ems_admin';
const MAX_AGE_SECONDS = 60 * 60 * 12;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16)
    throw new Error('SESSION_SECRET must be set to at least 16 characters');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error('ADMIN_PASSWORD is not set');
  // Hash both sides first so the comparison is constant-time regardless of length.
  const h = (v: string) => createHmac('sha256', secret()).update(v).digest('hex');
  return safeEqual(h(input), h(expected));
}

function makeToken(): string {
  const body = `${Date.now() + MAX_AGE_SECONDS * 1000}.${randomBytes(9).toString('base64url')}`;
  return `${body}.${sign(body)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const idx = token.lastIndexOf('.');
  if (idx < 0) return false;
  const body = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (!safeEqual(sig, sign(body))) return false;
  const expires = Number(body.split('.')[0]);
  return Number.isFinite(expires) && expires > Date.now();
}

export async function startSession() {
  const jar = await cookies();
  jar.set(COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE)?.value);
}
