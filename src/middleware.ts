import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge } from './lib/auth-edge';
import { checkRateLimit } from './lib/rate-limit';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = req.ip || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  // 1. Rate Limiting enforcement (API.md Section 6)
  if (pathname.startsWith('/api/v1/auth/login')) {
    const limit = checkRateLimit(`login:${ip}`, 10, 60000); // 10 attempts per minute
    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many login attempts. Please try again in ${limit.resetSeconds} seconds.`,
          },
        },
        { status: 429, headers: { 'Retry-After': limit.resetSeconds.toString() } }
      );
    }
  }

  if (pathname.startsWith('/api/v1/checkout/session')) {
    const limit = checkRateLimit(`checkout:${ip}`, 15, 60000); // 15 attempts per minute
    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Checkout creation limit exceeded. Please wait a moment before trying again.',
          },
        },
        { status: 429 }
      );
    }
  }

  // 2. Protect admin API endpoints
  if (pathname.startsWith('/api/v1/admin')) {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const cookieToken = req.cookies.get('apex_session')?.value;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : cookieToken;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication session required to access administrative API.',
          },
        },
        { status: 401 }
      );
    }

    const session = await verifyTokenEdge(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPPORT')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You lack administrative permissions to access this resource.',
          },
        },
        { status: 403 }
      );
    }
  }

  // 3. Protect customer account API endpoints
  if (pathname.startsWith('/api/v1/customer')) {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const cookieToken = req.cookies.get('apex_session')?.value;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : cookieToken;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required to access customer profile and orders.',
          },
        },
        { status: 401 }
      );
    }

    const session = await verifyTokenEdge(token);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Session is invalid or expired. Please log in again.',
          },
        },
        { status: 401 }
      );
    }
  }

  // 4. Inject Strict HTTP Security Headers into all responses
  const res = NextResponse.next();
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return res;
}

export const config = {
  matcher: ['/api/v1/:path*'],
};
