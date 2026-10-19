import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session) {
      return errorResponse('UNAUTHENTICATED', 'No active session found.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      return errorResponse('UNAUTHENTICATED', 'User account no longer exists.', 401);
    }

    return successResponse({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
