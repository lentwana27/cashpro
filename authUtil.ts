import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt) as (pw: string | Buffer, salt: Buffer, keylen: number, opts: crypto.ScryptOptions) => Promise<Buffer>;

// ---------------------------------------------------------------------------
// Password hashing (scrypt, Node built-in - no native dependency).
// Stored format: scrypt$<salt hex>$<hash hex>
// ---------------------------------------------------------------------------
const PREFIX = 'scrypt$';
const SCRYPT_OPTS: crypto.ScryptOptions = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEYLEN = 64;

export function isHashed(stored: string | null | undefined): boolean {
  return typeof stored === 'string' && stored.startsWith(PREFIX);
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const dk = await scrypt(plain, salt, KEYLEN, SCRYPT_OPTS);
  return `${PREFIX}${salt.toString('hex')}$${dk.toString('hex')}`;
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Verifies a typed password against what is stored. Rows that have not been migrated yet
 * (legacy plain text) are still compared, in constant time, so nobody is locked out;
 * the caller upgrades them to a hash after a successful check.
 */
export async function verifyPassword(plain: string, stored: string | null | undefined): Promise<boolean> {
  if (typeof plain !== 'string' || typeof stored !== 'string' || stored.length === 0) return false;
  if (!isHashed(stored)) {
    return safeEqual(Buffer.from(plain), Buffer.from(stored));
  }
  const [, saltHex, hashHex] = stored.split('$');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(plain, Buffer.from(saltHex, 'hex'), expected.length, SCRYPT_OPTS);
  return safeEqual(actual, expected);
}

// ---------------------------------------------------------------------------
// Signed session tokens (HMAC-SHA256, JWT-like). Payload: { uid, exp }
// ---------------------------------------------------------------------------
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET (>= 32 chars) must be set in production');
  }
  // Dev only: random per-process secret (sessions reset on restart).
  if (!(globalThis as any).__devSessionSecret) (globalThis as any).__devSessionSecret = crypto.randomBytes(32).toString('hex');
  return (globalThis as any).__devSessionSecret;
}

export function assertAuthConfig() {
  getSecret();
}

const b64 = (buf: Buffer) => buf.toString('base64url');

export function signToken(uid: string): string {
  const payload = b64(Buffer.from(JSON.stringify({ uid, exp: Date.now() + TOKEN_TTL_MS })));
  const sig = b64(crypto.createHmac('sha256', getSecret()).update(payload).digest());
  return `${payload}.${sig}`;
}

export function verifyToken(token: string | undefined | null): { uid: string } | null {
  if (!token || typeof token !== 'string') return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest();
  let given: Buffer;
  try { given = Buffer.from(sig, 'base64url'); } catch { return null; }
  if (!safeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data || typeof data.uid !== 'string' || typeof data.exp !== 'number' || data.exp < Date.now()) return null;
    return { uid: data.uid };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Login throttling (in memory): lock an email for a while after repeated failures.
// ---------------------------------------------------------------------------
const MAX_FAILS = 8;
const LOCK_MS = 15 * 60 * 1000;
const fails = new Map<string, { count: number; first: number; lockedUntil: number }>();

export function loginLockedFor(key: string): number {
  const e = fails.get(key);
  if (!e) return 0;
  if (e.lockedUntil > Date.now()) return e.lockedUntil - Date.now();
  if (Date.now() - e.first > LOCK_MS) fails.delete(key);
  return 0;
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const e = fails.get(key);
  if (!e || now - e.first > LOCK_MS) {
    fails.set(key, { count: 1, first: now, lockedUntil: 0 });
    return;
  }
  e.count += 1;
  if (e.count >= MAX_FAILS) e.lockedUntil = now + LOCK_MS;
}

export function clearLoginFailures(key: string) {
  fails.delete(key);
}
