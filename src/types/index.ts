export type UserRole = 'CUSTOMER' | 'SUPPORT' | 'ADMIN';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'REQUIRES_PAYMENT_METHOD'
  | 'PENDING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'REFUNDED';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  colorHex?: string | null;
  stockCount: number;
  priceOverride?: number | null;
  isActive: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  category?: Category;
  title: string;
  slug: string;
  description: string;
  basePrice: number;
  salePrice?: number | null;
  isFeatured: boolean;
  isActive: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
}

export interface CartItem {
  variantId: string;
  productId: string;
  title: string;
  sku: string;
  price: number;
  salePrice?: number | null;
  image: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field?: string; value?: unknown; issue: string }>;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
