import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    orderNumber: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { orderNumber } = params;
    const { searchParams } = new URL(req.url);
    const guestEmail = searchParams.get('email');

    const session = getAuthSession(req);

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
      },
    });

    if (!order) {
      return errorResponse(
        'RESOURCE_NOT_FOUND',
        `Order '${orderNumber}' was not found.`,
        404
      );
    }

    // Access authorization check
    const isAuthorizedAdmin = session?.role === 'ADMIN' || session?.role === 'SUPPORT';
    const isOwnerCustomer = session?.userId && order.userId === session.userId;
    const isAuthorizedGuest =
      guestEmail && order.customerEmail.toLowerCase() === guestEmail.toLowerCase();

    if (!isAuthorizedAdmin && !isOwnerCustomer && !isAuthorizedGuest) {
      return errorResponse(
        'UNAUTHORIZED',
        'You are not authorized to view this order. Please provide the customer email for verification.',
        403
      );
    }

    return successResponse({
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      trackingNumber: order.trackingNumber,
      shippingMethod: order.shippingMethod,
      customer: {
        name: order.customerName,
        email: order.customerEmail,
      },
      shippingAddress: order.shippingAddress,
      items: order.items.map((item) => ({
        id: item.id,
        titleSnapshot: item.titleSnapshot,
        skuSnapshot: item.skuSnapshot,
        variantOptions: item.variantOptions,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      financials: {
        subtotal: Number(order.subtotal),
        discountAmount: Number(order.discountAmount),
        shippingAmount: Number(order.shippingAmount),
        taxAmount: Number(order.taxAmount),
        totalAmount: Number(order.totalAmount),
      },
      createdAt: order.createdAt.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
