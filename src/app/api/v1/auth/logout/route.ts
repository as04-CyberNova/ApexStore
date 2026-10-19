import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const response = successResponse({ loggedOut: true });

  // Expire cookie immediately
  response.cookies.set('apex_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
