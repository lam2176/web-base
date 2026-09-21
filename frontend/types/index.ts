// User & Auth Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku?: string;
  barcode?: string;
  trackInventory: boolean;
  inventoryQuantity: number;
  allowOutOfStockPurchase: boolean;
  weight?: number;
  isActive: boolean;
  isFeatured: boolean;
  images: ProductImage[];
  category?: Category;
  categoryId?: string;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  position: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  inventoryQuantity: number;
  isActive: boolean;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  sortBy?: 'price' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
  parent?: Category;
  children?: Category[];
  productCount?: number;
}

// Cart Types
export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface CartCalculateRequest {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  shippingMethodId?: string;
  voucherCode?: string;
}

export interface CartCalculateResponse {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: Product;
    variant?: ProductVariant;
  }>;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  appliedVoucher?: {
    code: string;
    discountAmount: number;
  };
}

// Order Types
export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
  }>;
  customerInfo: {
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  shippingAddress: {
    address: string;
    ward: string;
    district: string;
    province: string;
  };
  shippingMethodId: string;
  paymentMethodId: string;
  voucherCode?: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  customerInfo: {
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  shippingAddress: {
    address: string;
    ward: string;
    district: string;
    province: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: Product;
  variant?: ProductVariant;
}

// Store Types
export interface StoreInfo {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  businessHours?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  policies?: {
    shipping?: string;
    return?: string;
    privacy?: string;
    terms?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Banner Types
export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  description?: string;
  position: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Shipping & Payment Types
export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  fee: number;
  estimatedDays?: number;
  isActive: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
  type: 'cod' | 'bank_transfer' | 'momo' | 'zalopay' | 'vnpay';
  isActive: boolean;
}

// API Error Types
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
