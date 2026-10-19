import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorDetail {
  field?: string;
  value?: unknown;
  issue: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export function successResponse<T>(
  data: T,
  meta?: { page: number; limit: number; total: number; totalPages: number },
  status: number = 200
) {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
  return NextResponse.json(body, { status });
}

export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: ApiErrorDetail[]
) {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {}),
    },
  };
  return NextResponse.json(body, { status });
}

export function handleApiError(error: unknown) {
  console.error('[API Error]:', error);

  if (error instanceof ZodError) {
    const details: ApiErrorDetail[] = error.errors.map((err) => ({
      field: err.path.join('.'),
      issue: err.message,
    }));
    return errorResponse('VALIDATION_ERROR', 'Input validation failed.', 400, details);
  }

  if (error instanceof Error) {
    const isProd = process.env.NODE_ENV === 'production';
    const message = isProd ? 'An internal server error occurred.' : error.message;
    return errorResponse('INTERNAL_ERROR', message, 500);
  }

  return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
}
