import { Role } from '@prisma/client';

export interface AuthSession {
  userId: string;
  email: string;
  role: Role;
}

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'apexstore_dev_super_secret_jwt_token_must_be_64_characters_long_for_security';

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Edge-compatible JWT verification using Web Crypto API (SubtleCrypto)
 */
export async function verifyTokenEdge(token: string): Promise<AuthSession | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(`${headerB64}.${payloadB64}`)
    );

    const expectedSignature = base64UrlEncodeBytes(new Uint8Array(signatureBytes));

    if (signatureB64 !== expectedSignature) {
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
