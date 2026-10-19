import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    productId: string;
  };
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = getAuthSession(req);
    if (!session || !session.userId) {
      return errorResponse('UNAUTHENTICATED', 'Customer authentication required.', 401);
    }

    const { productId } = params;

    await prisma.wishlist.deleteMany({
      where: {
        userId: session.userId,
        productId,
      },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
