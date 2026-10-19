import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { getAuthSession } from '@/lib/auth';
import { OrderStatus } from '@prisma/client';

const fulfillmentSchema = z.object({
  orderStatus: z.nativeEnum(OrderStatus),
  trackingNumber: z.string().optional(),
  notifyCustomer: z.boolean().default(true),
});

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    orderNumber: string;
  };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = getAuthSession(req);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPPORT')) {
      return errorResponse('UNAUTHORIZED', 'Administrator access required.', 403);
    }

    const { orderNumber } = params;
    const body = await req.json();
    const data = fulfillmentSchema.parse(body);

    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!existingOrder) {
      return errorResponse('RESOURCE_NOT_FOUND', `Order '${orderNumber}' was not found.`, 404);
    }

    const updated = await prisma.order.update({
      where: { orderNumber },
      data: {
        orderStatus: data.orderStatus,
        ...(data.trackingNumber ? { trackingNumber: data.trackingNumber } : {}),
      },
    });

    if (data.notifyCustomer && data.trackingNumber && existingOrder.customerEmail) {
      try {
        const { generateShippingUpdateHtml, sendEmail } = await import('@/lib/email');
        const html = generateShippingUpdateHtml({
          to: existingOrder.customerEmail,
          orderNumber: updated.orderNumber,
          customerName: existingOrder.customerName,
          trackingNumber: data.trackingNumber,
        });
        await sendEmail({
          to: existingOrder.customerEmail,
          subject: `Your ApexStore Order [${updated.orderNumber}] Has Shipped`,
          html,
        });
      } catch (emailErr) {
        console.error('Non-blocking tracking notification failure:', emailErr);
      }
    }

    return successResponse({
      orderNumber: updated.orderNumber,
      orderStatus: updated.orderStatus,
      trackingNumber: updated.trackingNumber,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
