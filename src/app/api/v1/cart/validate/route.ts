import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

const validateCartSchema = z.object({
  items: z.array(
    z.object({
      variantId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ),
  couponCode: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, couponCode } = validateCartSchema.parse(body);

    if (items.length === 0) {
      return successResponse({
        isValid: true,
        items: [],
        subtotal: 0,
        discountAmount: 0,
        freeShippingThreshold: 150.0,
        freeShippingUnlocked: false,
        estimatedShipping: 0,
        estimatedTax: 0,
        estimatedTotal: 0,
      });
    }

    const variantIds = items.map((i) => i.variantId);

    const variants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        isActive: true,
        product: { isActive: true },
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            basePrice: true,
            salePrice: true,
          },
        },
      },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    let subtotal = 0;
    let allAvailable = true;

    const validatedItems = items.map((cartItem) => {
      const dbVariant = variantMap.get(cartItem.variantId);

      if (!dbVariant) {
        allAvailable = false;
        return {
          variantId: cartItem.variantId,
          isAvailable: false,
          issue: 'Variant is no longer available',
        };
      }

      const isStockSufficient = dbVariant.stockCount >= cartItem.quantity;
      if (!isStockSufficient) {
        allAvailable = false;
      }

      // Authoritative server price: variant priceOverride > product salePrice > product basePrice
      const unitPrice = dbVariant.priceOverride
        ? Number(dbVariant.priceOverride)
        : dbVariant.product.salePrice
        ? Number(dbVariant.product.salePrice)
        : Number(dbVariant.product.basePrice);

      const itemTotal = Number((unitPrice * cartItem.quantity).toFixed(2));
      subtotal += itemTotal;

      return {
        variantId: dbVariant.id,
        productId: dbVariant.product.id,
        title: dbVariant.product.title,
        sku: dbVariant.sku,
        size: dbVariant.size,
        color: dbVariant.color,
        unitPrice,
        quantity: cartItem.quantity,
        itemTotal,
        availableStock: dbVariant.stockCount,
        isAvailable: isStockSufficient,
      };
    });

    subtotal = Number(subtotal.toFixed(2));

    // Calculate sample promo discount (e.g. SUMMER20 or APEX10)
    let discountAmount = 0;
    if (couponCode) {
      const code = couponCode.toUpperCase().trim();
      if (code === 'SUMMER20') {
        discountAmount = Number((subtotal * 0.2).toFixed(2));
      } else if (code === 'APEX10') {
        discountAmount = Number((subtotal * 0.1).toFixed(2));
      }
    }

    const freeShippingThreshold = 150.0;
    const freeShippingUnlocked = subtotal >= freeShippingThreshold;
    const estimatedShipping = subtotal > 0 && !freeShippingUnlocked ? 15.0 : 0.0;
    const estimatedTax = Number(((subtotal - discountAmount) * 0.08).toFixed(2));
    const estimatedTotal = Number(
      Math.max(0, subtotal - discountAmount + estimatedShipping + estimatedTax).toFixed(2)
    );

    return successResponse({
      isValid: allAvailable,
      items: validatedItems,
      subtotal,
      discountAmount,
      freeShippingThreshold,
      freeShippingUnlocked,
      estimatedShipping,
      estimatedTax,
      estimatedTotal,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
