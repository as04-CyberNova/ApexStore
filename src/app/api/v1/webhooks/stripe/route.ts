import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { decrementStockAtomic } from '@/lib/inventory';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2024-11-20.acacia' as any,
});

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const rawBody = await req.text();
    let event: Stripe.Event;

    // Verify webhook signature if in production with configured secret
    if (webhookSecret && signature && !webhookSecret.startsWith('whsec_sample')) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err: any) {
        console.error('Stripe webhook signature verification failed:', err.message);
        return errorResponse('UNAUTHORIZED', 'Invalid webhook signature.', 401);
      }
    } else {
      // Development fallback parse
      event = JSON.parse(rawBody) as Stripe.Event;
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = paymentIntent.id;

        const order = await prisma.order.findFirst({
          where: { paymentIntentId },
          include: { items: true },
        });

        if (!order) {
          console.warn(`Order not found for PaymentIntent: ${paymentIntentId}`);
          break;
        }

        // Idempotency: if already confirmed or paid, return success immediately
        if (order.paymentStatus === PaymentStatus.SUCCEEDED) {
          console.log(`Order ${order.orderNumber} already processed. Skipping duplicate webhook.`);
          return successResponse({ received: true, duplicate: true });
        }

        // Atomic inventory decrement for all items
        for (const item of order.items) {
          if (!item.variantId) continue;
          const decResult = await decrementStockAtomic({
            variantId: item.variantId,
            quantity: item.quantity,
          });

          if (!decResult.success) {
            console.error(
              `Failed atomic stock decrement for variant ${item.variantId} in order ${order.orderNumber}: ${decResult.error}`
            );
          }
        }

        // Update order status to CONFIRMED and payment to SUCCEEDED
        await prisma.order.update({
          where: { id: order.id },
          data: {
            orderStatus: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.SUCCEEDED,
          },
        });

        try {
          const { logger } = await import('@/lib/logger');
          logger.paymentSettled(order.orderNumber, paymentIntentId);
        } catch {
          // Non-blocking
        }

        // Dispatch Resend transactional email asynchronously without blocking webhook commit (API.md Section 5.2)
        try {
          const { generateOrderConfirmationHtml, sendEmail } = await import('@/lib/email');
          const address = order.shippingAddress as any;
          const html = generateOrderConfirmationHtml({
            to: order.customerEmail,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            items: order.items.map((i) => ({
              titleSnapshot: i.titleSnapshot,
              skuSnapshot: i.skuSnapshot,
              variantOptions: i.variantOptions,
              quantity: i.quantity,
              unitPrice: Number(i.unitPrice),
              totalPrice: Number(i.totalPrice),
            })),
            subtotal: Number(order.subtotal),
            discountAmount: Number(order.discountAmount),
            shippingAmount: Number(order.shippingAmount),
            taxAmount: Number(order.taxAmount),
            totalAmount: Number(order.totalAmount),
            shippingAddress: {
              fullName: address?.fullName || order.customerName,
              addressLine1: address?.addressLine1 || '',
              addressLine2: address?.addressLine2 || null,
              city: address?.city || '',
              state: address?.state || '',
              postalCode: address?.postalCode || '',
              countryCode: address?.countryCode || 'US',
            },
          });

          await sendEmail({
            to: order.customerEmail,
            subject: `Your ApexStore Order Confirmation [${order.orderNumber}]`,
            html,
          });
        } catch (emailErr) {
          console.error(`Non-blocking email delivery failure for order ${order.orderNumber}:`, emailErr);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await prisma.order.updateMany({
          where: { paymentIntentId: paymentIntent.id },
          data: {
            paymentStatus: PaymentStatus.FAILED,
          },
        });
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return successResponse({ received: true });
  } catch (error) {
    return handleApiError(error);
  }
}
