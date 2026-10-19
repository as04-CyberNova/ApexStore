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

export interface User {
  id: string;
  email: string;
  fullName?: string | null;
  role: UserRole;
  phone?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  addresses?: Address[];
  orders?: Order[];
  reviews?: Review[];
  wishlists?: Wishlist[];
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  phone?: string | null;
  isDefault: boolean;
  createdAt: string | Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string | Date;
  products?: Product[];
}

export interface ProductImage {
  id: string;
  productId: string;
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
  reviews?: Review[];
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId?: string | null;
  productId?: string | null;
  titleSnapshot: string;
  skuSnapshot: string;
  variantOptions?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variant?: ProductVariant | null;
  product?: Product | null;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  phone?: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerEmail: string;
  customerName: string;
  shippingAddress: ShippingAddress;
  shippingMethod: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string | null;
  trackingNumber?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  items?: OrderItem[];
  user?: User | null;
}

export interface Review {
  id: string;
  productId: string;
  userId?: string | null;
  reviewerName: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: string | Date;
  product?: Product;
  user?: User | null;
}

export interface Wishlist {
  id: string;
  userId: string;
  productId: string;
  createdAt: string | Date;
  product?: Product;
  user?: User;
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
