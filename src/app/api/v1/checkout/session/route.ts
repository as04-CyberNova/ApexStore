import { NextRequest } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { getAuthSession } from '@/lib/auth';
import { OrderStatus, PaymentStatus } from '@prisma/client';

const checkoutSessionSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().min(2),
  items: z.array(
    z.object({
      variantId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    addressLine1: z.string().min(3),
    addressLine2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(3),
    countryCode: z.string().length(2),
    phone: z.string().optional(),
  }),
  shippingMethod: z.enum(['Standard', 'Express']).default('Standard'),
  couponCode: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = checkoutSessionSchema.parse(body);

    const session = getAuthSession(req);
    const userId = session?.userId || null;

    // Fetch live variants with products
    const variantIds = data.items.map((i) => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        isActive: true,
        product: { isActive: true },
      },
      include: {
        product: true,
      },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // Validate inventory and calculate prices directly from DB
    let subtotal = 0;
    const orderItemsData: Array<{
      variantId: string;
      productId: string;
      titleSnapshot: string;
      skuSnapshot: string;
      variantOptions: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    for (const item of data.items) {
      const v = variantMap.get(item.variantId);
      if (!v) {
        return errorResponse(
          'OUT_OF_STOCK',
          'One or more selected items are no longer available.',
          409,
          [{ field: 'variantId', value: item.variantId, issue: 'Variant not found or inactive' }]
        );
      }

      if (v.stockCount < item.quantity) {
        return errorResponse(
          'OUT_OF_STOCK',
          `Item '${v.product.title} (${v.size || ''} ${v.color || ''})' has only ${v.stockCount} units remaining.`,
          409,
          [{ field: 'variantId', value: v.id, issue: `Only ${v.stockCount} units remaining` }]
        );
      }

      const unitPrice = v.priceOverride
        ? Number(v.priceOverride)
        : v.product.salePrice
        ? Number(v.product.salePrice)
        : Number(v.product.basePrice);

      const itemTotal = Number((unitPrice * item.quantity).toFixed(2));
      subtotal += itemTotal;

      const variantOptions = [v.size ? `Size: ${v.size}` : null, v.color ? `Color: ${v.color}` : null]
        .filter(Boolean)
        .join(', ');

      orderItemsData.push({
        variantId: v.id,
        productId: v.product.id,
        titleSnapshot: v.product.title,
        skuSnapshot: v.sku,
        variantOptions: variantOptions || 'Standard',
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
      });
    }

    subtotal = Number(subtotal.toFixed(2));

    // Discounts
    let discountAmount = 0;
    if (data.couponCode) {
      const code = data.couponCode.toUpperCase().trim();
      if (code === 'SUMMER20') {
        discountAmount = Number((subtotal * 0.2).toFixed(2));
      } else if (code === 'APEX10') {
        discountAmount = Number((subtotal * 0.1).toFixed(2));
      }
    }

    // Shipping calculation
    const isFreeShipping = subtotal >= 150.0 && data.shippingMethod === 'Standard';
    const shippingAmount = isFreeShipping
      ? 0.0
      : data.shippingMethod === 'Express'
      ? 25.0
      : 15.0;

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Number((taxableAmount * 0.08).toFixed(2));
    const totalAmount = Number((taxableAmount + shippingAmount + taxAmount).toFixed(2));

    const orderNumber = `APX-${Math.floor(10000 + Math.random() * 90000)}`;
    const paymentIntentId = `pi_${crypto.randomBytes(12).toString('hex')}`;
    const clientSecret = `${paymentIntentId}_secret_${crypto.randomBytes(8).toString('hex')}`;

    // Create pending order record
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        shippingAddress: data.shippingAddress,
        shippingMethod: data.shippingMethod,
        subtotal,
        discountAmount,
        shippingAmount,
        taxAmount,
        totalAmount,
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.REQUIRES_PAYMENT_METHOD,
        paymentIntentId,
        items: {
          create: orderItemsData,
        },
      },
    });

    try {
      const { logger } = await import('@/lib/logger');
      logger.orderPlaced(order.orderNumber, totalAmount, data.items.length);
    } catch {
      // Non-blocking instrumentation
    }

    return successResponse(
      {
        orderNumber: order.orderNumber,
        paymentIntentId,
        clientSecret,
        breakdown: {
          subtotal,
          discountAmount,
          shippingAmount,
          taxAmount,
          totalAmount,
          currency: 'usd',
        },
      },
      undefined,
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
