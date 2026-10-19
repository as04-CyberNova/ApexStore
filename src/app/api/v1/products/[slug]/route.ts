import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: { name: true, slug: true },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            url: true,
            altText: true,
            isPrimary: true,
            sortOrder: true,
          },
        },
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            sku: true,
            size: true,
            color: true,
            colorHex: true,
            stockCount: true,
            priceOverride: true,
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            reviewerName: true,
            rating: true,
            comment: true,
            isVerified: true,
            createdAt: true,
          },
        },
      },
    });

    if (!product || !product.isActive) {
      return errorResponse(
        'RESOURCE_NOT_FOUND',
        `Product with slug '${slug}' was not found.`,
        404
      );
    }

    const reviewCount = product.reviews.length;
    const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };

    product.reviews.forEach((r) => {
      const star = r.rating.toString();
      if (distribution[star] !== undefined) {
        distribution[star]++;
      }
    });

    const averageRating =
      reviewCount > 0
        ? Number(
            (
              product.reviews.reduce((acc, curr) => acc + curr.rating, 0) /
              reviewCount
            ).toFixed(1)
          )
        : 0;

    return successResponse({
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      basePrice: Number(product.basePrice),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      isFeatured: product.isFeatured,
      category: product.category,
      images: product.images,
      variants: product.variants.map((v) => ({
        ...v,
        priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
      })),
      reviews: product.reviews,
      ratingSummary: {
        averageRating,
        reviewCount,
        distribution,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
