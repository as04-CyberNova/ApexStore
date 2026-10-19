import { prisma } from './prisma';

export interface DecrementStockParams {
  variantId: string;
  quantity: number;
}

export interface DecrementStockResult {
  success: boolean;
  remainingStock?: number;
  error?: string;
}

/**
 * Decrement stock atomically adhering to DATABASE.md Section 6.1.
 * Prevents overselling during concurrent checkout requests.
 * Uses conditional atomic SQL: UPDATE product_variants SET stock_count = stock_count - qty WHERE id = id AND stock_count >= qty
 */
export async function decrementStockAtomic({
  variantId,
  quantity,
}: DecrementStockParams): Promise<DecrementStockResult> {
  if (quantity <= 0) {
    return { success: false, error: 'Quantity must be greater than zero.' };
  }

  try {
    const updatedRows = await prisma.$queryRaw<Array<{ id: string; stock_count: number }>>`
      UPDATE product_variants
      SET stock_count = stock_count - ${quantity}
      WHERE id = ${variantId}::uuid
        AND stock_count >= ${quantity}
      RETURNING id, stock_count;
    `;

    if (!updatedRows || updatedRows.length === 0) {
      return {
        success: false,
        error: 'INSUFFICIENT_STOCK',
      };
    }

    return {
      success: true,
      remainingStock: updatedRows[0].stock_count,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}
