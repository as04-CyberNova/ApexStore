import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { getAuthSession } from '@/lib/auth';

const wishlistSchema = z.object({
  productId: z.string().uuid(),
});

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session || !session.userId) {
      return errorResponse('UNAUTHENTICATED', 'Customer authentication required.', 401);
    }

    const items = await prisma.wishlist.findMany({
      where: { userId: session.userId },
      include: {
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
    });

    const formatted = items.map((w) => ({
      id: w.id,
      productId: w.productId,
      product: {
        id: w.product.id,
        title: w.product.title,
        slug: w.product.slug,
        basePrice: Number(w.product.basePrice),
        salePrice: w.product.salePrice ? Number(w.product.salePrice) : null,
        image: w.product.images[0] || null,
      },
    }));

    return successResponse(formatted);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session || !session.userId) {
      return errorResponse('UNAUTHENTICATED', 'Customer authentication required.', 401);
    }

    const body = await req.json();
    const { productId } = wishlistSchema.parse(body);

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: session.userId,
          productId,
        },
      },
    });

    if (existing) {
      return successResponse(existing);
    }

    const item = await prisma.wishlist.create({
      data: {
        userId: session.userId,
        productId,
      },
    });

    return successResponse(item, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
