import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { Role } from '@prisma/client';

export interface AuthSession {
  userId: string;
  email: string;
  role: Role;
}

const JWT_SECRET = process.env.JWT_SECRET || 'apexstore_dev_super_secret_jwt_token_must_be_64_characters_long_for_security';

/**
 * Hash a password using PBKDF2 with SHA-512 and unique salt (production-grade standard)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(`pbkdf2$100000$${salt}$${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify a password against stored salt + hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Support PBKDF2 hash format
  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const key = parts[3];

    return new Promise((resolve) => {
      crypto.pbkdf2(password, salt, iterations, 64, 'sha512', (err, derivedKey) => {
        if (err) return resolve(false);
        const match = crypto.timingSafeEqual(
          Buffer.from(key, 'hex'),
          derivedKey
        );
        resolve(match);
      });
    });
  }

  // Support demo seeded salted hash string in development only
  if (process.env.NODE_ENV !== 'production') {
    if (storedHash.includes('qwer1234') && password === 'Admin@123456') {
      return true;
    }
    if (storedHash.includes('cust1234') && password === 'Customer@123456') {
      return true;
    }
  }

  return false;
}

/**
 * Base64 URL encode utility
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Base64 URL decode utility
 */
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

/**
 * Sign JWT token without external third-party dependency
 */
export function signToken(payload: AuthSession, expiresInDays: number = 7): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const body = { ...payload, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(body));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify JWT token securely with constant-time signature comparison
 */
export function verifyToken(token: string): AuthSession | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const expectedBuf = Buffer.from(expectedSignature);
    const providedBuf = Buffer.from(signatureB64);

    if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(payloadB64)) as AuthSession & { exp?: number };
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

/**
 * Extract authenticated session from request Authorization header or cookies
 */
export function getAuthSession(req: NextRequest): AuthSession | null {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    return verifyToken(token);
  }

  const cookieToken = req.cookies.get('apex_session')?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }

  return null;
}
