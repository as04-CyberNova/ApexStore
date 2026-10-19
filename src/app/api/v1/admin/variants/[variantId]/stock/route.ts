import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { getAuthSession } from '@/lib/auth';

const updateStockSchema = z.object({
  stockCount: z.number().int().min(0),
});

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    variantId: string;
  };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = getAuthSession(req);
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('UNAUTHORIZED', 'Administrator privileges required.', 403);
    }

    const { variantId } = params;
    const body = await req.json();
    const { stockCount } = updateStockSchema.parse(body);

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: { stockCount },
    });

    return successResponse({
      id: variant.id,
      sku: variant.sku,
      stockCount: variant.stockCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
