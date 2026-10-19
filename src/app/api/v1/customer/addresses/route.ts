import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { getAuthSession } from '@/lib/auth';

const addressSchema = z.object({
  fullName: z.string().min(2),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(3),
  countryCode: z.string().length(2),
  phone: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getAuthSession(req);
    if (!session || !session.userId) {
      return errorResponse('UNAUTHENTICATED', 'Customer authentication required.', 401);
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return successResponse(addresses);
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
    const data = addressSchema.parse(body);

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: session.userId,
        fullName: data.fullName,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        countryCode: data.countryCode,
        phone: data.phone,
        isDefault: data.isDefault,
      },
    });

    return successResponse(address, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
