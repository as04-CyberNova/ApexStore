import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { getAuthSession } from '@/lib/auth';

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(2000),
  reviewerName: z.string().min(2).max(100),
});

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = params;
    const body = await req.json();
    const data = reviewSchema.parse(body);

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!product) {
      return errorResponse('RESOURCE_NOT_FOUND', `Product with slug '${slug}' was not found.`, 404);
    }

    const session = getAuthSession(req);
    const userId = session?.userId || null;

    // Check if user has a verified delivered order containing this product
    let isVerified = false;
    if (userId) {
      const deliveredOrder = await prisma.order.findFirst({
        where: {
          userId,
          orderStatus: 'DELIVERED',
          items: {
            some: { productId: product.id },
          },
        },
      });
      if (deliveredOrder) {
        isVerified = true;
      }
    }

    const review = await prisma.review.create({
      data: {
        productId: product.id,
        userId,
        reviewerName: data.reviewerName,
        rating: data.rating,
        comment: data.comment,
        isVerified,
      },
    });

    return successResponse(review, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
