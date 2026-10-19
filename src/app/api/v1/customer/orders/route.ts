import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session || !session.userId) {
      return errorResponse('UNAUTHENTICATED', 'Customer authentication required.', 401);
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          select: { quantity: true },
        },
      },
    });

    const formattedOrders = orders.map((o) => ({
      orderNumber: o.orderNumber,
      orderStatus: o.orderStatus,
      paymentStatus: o.paymentStatus,
      totalAmount: Number(o.totalAmount),
      itemCount: o.items.reduce((acc, curr) => acc + curr.quantity, 0),
      createdAt: o.createdAt.toISOString(),
    }));

    return successResponse(formattedOrders);
  } catch (error) {
    return handleApiError(error);
  }
}
