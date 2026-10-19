import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('UNAUTHORIZED', 'Administrator privileges required.', 403);
    }

    const [totalOrders, gmvResult, lowStockVariants, topSelling] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
        _avg: {
          totalAmount: true,
        },
      }),
      prisma.productVariant.count({
        where: {
          stockCount: { lt: 5 },
          isActive: true,
        },
      }),
      prisma.orderItem.groupBy({
        by: ['skuSnapshot', 'titleSnapshot'],
        _sum: {
          quantity: true,
          totalPrice: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    const grossMerchandiseValue = Number(gmvResult._sum.totalAmount || 0);
    const averageOrderValue = Number(gmvResult._avg.totalAmount || 0);

    const topSellingSkus = topSelling.map((item) => ({
      sku: item.skuSnapshot,
      title: item.titleSnapshot,
      unitsSold: item._sum.quantity || 0,
      revenue: Number(item._sum.totalPrice || 0),
    }));

    return successResponse({
      grossMerchandiseValue: Number(grossMerchandiseValue.toFixed(2)),
      totalOrders,
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      lowStockAlertCount: lowStockVariants,
      topSellingSkus,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
