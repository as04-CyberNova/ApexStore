import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search') || undefined;
    const categorySlug = searchParams.get('category') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const inStock = searchParams.get('inStock') === 'true';
    const featured = searchParams.get('featured') === 'true';
    const sort = searchParams.get('sort') || 'featured';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Build filter where condition
    const where: any = {
      isActive: true,
    };

    if (featured) {
      where.isFeatured = true;
    }

    if (categorySlug) {
      where.category = {
        slug: categorySlug,
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    if (inStock) {
      where.variants = {
        some: {
          stockCount: { gt: 0 },
          isActive: true,
        },
      };
    }

    // Build sorting
    let orderBy: any = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'price_asc') {
      orderBy = [{ basePrice: 'asc' }];
    } else if (sort === 'price_desc') {
      orderBy = [{ basePrice: 'desc' }];
    } else if (sort === 'newest') {
      orderBy = [{ createdAt: 'desc' }];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true, altText: true },
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
            select: { rating: true },
          },
        },
      }),
    ]);

    const formattedProducts = products.map((prod) => {
      const reviewCount = prod.reviews.length;
      const averageRating =
        reviewCount > 0
          ? Number(
              (
                prod.reviews.reduce((acc, curr) => acc + curr.rating, 0) /
                reviewCount
              ).toFixed(1)
            )
          : 0;

      return {
        id: prod.id,
        title: prod.title,
        slug: prod.slug,
        description: prod.description,
        basePrice: Number(prod.basePrice),
        salePrice: prod.salePrice ? Number(prod.salePrice) : null,
        isFeatured: prod.isFeatured,
        category: prod.category,
        primaryImage: prod.images[0] || null,
        variants: prod.variants.map((v) => ({
          ...v,
          priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
        })),
        ratingSummary: {
          averageRating,
          reviewCount,
        },
      };
    });

    return successResponse(formattedProducts, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
