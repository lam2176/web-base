// API Response Types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth Types
export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: number;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  role: 'admin' | 'staff';
  createdAt: string;
  updatedAt: string;
}

// Category Image Type
export interface CategoryImage {
  id: number;
  categoryId: number;
  mediaId: number;
  order: number;
  media?: Media;
}

// Category Types
export interface Category {
  id: number;
  name: string;
  nameVi: string;
  nameEn: string;
  slug: string;
  descriptionVi?: string;
  descriptionEn?: string;
  image?: string;
  images?: CategoryImage[];
  parentId?: number;
  order: number;
  isActive?: boolean;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  nameVi: string;
  nameEn: string;
  slug: string;
  descriptionVi?: string;
  descriptionEn?: string;
  image?: string;
  parentId?: number;
  order?: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

// Product Types
export interface Product {
  id: number;
  nameVi: string;
  nameEn: string;
  name?: string; // Fallback name from backend
  slug: string;
  descriptionVi?: string;
  descriptionEn?: string;
  description?: string; // Fallback description from backend
  originalPrice: string;
  salePrice?: string;
  price?: number; // Computed price from backend
  compareAtPrice?: number; // Computed compare price from backend
  stockQuantity: number;
  inventoryQuantity?: number; // Alternative field name
  trackInventory?: boolean;
  allowOutOfStockPurchase?: boolean;
  categoryId?: string | number;
  featured: boolean;
  isFeatured?: boolean; // Alternative field name
  status: 'active' | 'inactive' | 'out_of_stock';
  isActive?: boolean;
  images?: ProductImage[];
  sku?: string;
  barcode?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category & { name?: string }; // Allow fallback name
  variants?: ProductVariant[];
}

export interface ProductImage {
  id: number;
  url: string;
  alt?: string;
  altText?: string;
  order: number;
  media?: Media;
}

export interface ProductVariant {
  id?: number;
  productId?: number;
  nameVi?: string;
  nameEn?: string;
  name?: string;
  value?: string;
  priceAdjustment?: number;
  stockQuantity?: number;
  sku?: string;
  barcode?: string;
  isActive?: boolean;
}

export interface CreateProductDto {
  nameVi: string;
  nameEn: string;
  slug: string;
  descriptionVi?: string;
  descriptionEn?: string;
  originalPrice: number;
  salePrice?: number;
  stockQuantity: number;
  categoryId?: number;
  featured?: boolean;
  status?: 'active' | 'inactive' | 'out_of_stock';
  images?: { mediaId: number; order: number; isPrimary: boolean; }[];
  variants?: ProductVariant[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface ProductQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string | number;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  sortBy?: 'price' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  sort?: 'price-asc' | 'price-desc' | 'newest' | 'oldest';
}

// Banner Types
export interface Banner {
  id: number;
  titleVi?: string;
  titleEn?: string;
  subtitleVi?: string;
  subtitleEn?: string;
  image: string;
  imageId?: number;
  link?: string;
  order: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerDto {
  titleVi?: string;
  titleEn?: string;
  subtitleVi?: string;
  subtitleEn?: string;
  image?: string;
  imageId?: number;
  link?: string;
  order?: number;
  status?: 'active' | 'inactive';
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateBannerDto extends Partial<CreateBannerDto> {}

// Page Types
export interface Page {
  id: number;
  titleVi: string;
  titleEn: string;
  slug: string;
  contentVi?: string;
  contentEn?: string;
  status: 'active' | 'inactive';
  showInMenu?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  featuredImageId?: number;
  featuredImageAlt?: string;
  featuredImage?: Media;
  featuredVideoId?: number;
  featuredVideo?: Media;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePageDto {
  titleVi: string;
  titleEn: string;
  slug: string;
  contentVi?: string;
  contentEn?: string;
  status?: 'active' | 'inactive';
  showInMenu?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  featuredImageId?: number;
  featuredImageAlt?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdatePageDto extends Partial<CreatePageDto> {}

// Menu Types
export type MenuLocation = 'header' | 'footer' | 'both' | 'mobile' | 'admin';
export type MenuItemType = 'page' | 'product' | 'category' | 'custom' | 'cart' | 'account' | 'login' | 'register' | 'profile';

export interface Menu {
  id: number;
  nameVi: string;
  nameEn: string;
  location: MenuLocation;
  isActive: boolean;
  items?: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: number;
  menuId: number;
  parentId?: number;
  labelVi: string;
  labelEn: string;
  type: MenuItemType;
  url?: string;
  pageSlug?: string;
  categoryId?: number;
  order: number;
  openInNewTab: boolean;
  isActive: boolean;
  
  // Icon/Image fields
  iconUrl?: string;
  iconType?: string; // 'lucide', 'svg', 'image'
  
  // Visibility rules
  visibleOnDesktop: boolean;
  visibleOnMobile: boolean;
  requiresAuth: boolean;
  adminOnly: boolean;
  
  // SEO fields
  metaTitleVi?: string;
  metaTitleEn?: string;
  metaDescriptionVi?: string;
  metaDescriptionEn?: string;
  ogImageUrl?: string;
  
  children?: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuDto {
  nameVi: string;
  nameEn: string;
  location: MenuLocation;
  isActive?: boolean;
}

export type UpdateMenuDto = Partial<CreateMenuDto>;

export interface CreateMenuItemDto {
  menuId: number;
  parentId?: number;
  labelVi: string;
  labelEn: string;
  type: MenuItemType;
  url?: string;
  pageSlug?: string;
  categoryId?: number;
  order?: number;
  openInNewTab?: boolean;
  isActive?: boolean;
  
  // Icon/Image fields
  iconUrl?: string;
  iconType?: string;
  
  // Visibility rules
  visibleOnDesktop?: boolean;
  visibleOnMobile?: boolean;
  requiresAuth?: boolean;
  adminOnly?: boolean;
  
  // SEO fields
  metaTitleVi?: string;
  metaTitleEn?: string;
  metaDescriptionVi?: string;
  metaDescriptionEn?: string;
  ogImageUrl?: string;
}

export type UpdateMenuItemDto = Partial<CreateMenuItemDto>;

// Store Types
export interface StoreInfo {
  id: number;
  nameVi: string;
  nameEn: string;
  logoId?: number;
  logo?: Media;
  bankQrId?: number;
  bankQr?: Media;
  address: string;
  hotline: string;
  email: string;
  shippingFee: string;
  currency: string; // VND, USD, EUR, etc.
  descriptionVi?: string;
  descriptionEn?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };
  mapUrl?: string;
  mapUrlEn?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateStoreInfoDto {
  nameVi?: string;
  nameEn?: string;
  logoId?: number;
  bankQrId?: number;
  address?: string;
  hotline?: string;
  email?: string;
  currency?: string;
  shippingFee?: number;
  descriptionVi?: string;
  descriptionEn?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };
  mapUrl?: string;
  mapUrlEn?: string;
}

// Coupon Types
export type CouponApplyTo = 'all' | 'category' | 'product';

export interface Coupon {
  id: number;
  code: string;
  nameVi: string;
  nameEn: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  applyTo?: CouponApplyTo;
  categoryIds?: number[];
  allowMultiple?: boolean;
  startDate: string;
  endDate: string;
  status?: 'active' | 'inactive';
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponDto {
  code: string;
  nameVi: string;
  nameEn: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  applyTo?: CouponApplyTo;
  categoryIds?: number[];
  allowMultiple?: boolean;
  startDate: string;
  endDate: string;
  status?: 'active' | 'inactive';
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateCouponDto extends Partial<CreateCouponDto> {}

// Discount Code Types
export interface DiscountCode {
  id: number;
  code: string;
  name?: string;
  nameVi: string;
  nameEn: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  maxUses?: number;
  maxUsage?: number; // Alternative field name
  usedCount: number;
  currentUsage?: number; // Alternative field name
  allowMultiple?: boolean;
  startDate: string;
  endDate: string;
  expiryDate?: string; // Alternative field name
  status?: 'active' | 'inactive';
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountCodeDto {
  code: string;
  name?: string;
  nameVi?: string;
  nameEn?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses?: number;
  maxUsage?: number;
  allowMultiple?: boolean;
  startDate?: string;
  endDate?: string;
  expiryDate?: string;
  status?: 'active' | 'inactive';
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateDiscountCodeDto extends Partial<CreateDiscountCodeDto> {}

// Order Types
export interface Order {
  id: number;
  orderNumber?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  customerInfo?: {
    name: string;
    fullName?: string;
    email: string;
    phone: string;
    phoneNumber?: string;
  };
  shippingAddress: string | {
    address: string;
    ward: string;
    district: string;
    province: string;
  };
  subtotal: string;
  subtotalAmount?: string;
  shippingFee: string;
  discountAmount: string;
  total: string;
  totalAmount?: string;
  discountCode?: string;
  note?: string;
  itemsCount?: number;
  status: 'pending' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  items: OrderItem[];
  data?: Order[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  variantId?: number;
  quantity: number;
  price: string;
  unitPrice?: string;
  totalPrice?: string;
  product?: Product;
}

export interface CreateOrderDto {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  discountCodeId?: number;
  notes?: string;
  items: {
    productId: number;
    variantId?: number;
    quantity: number;
    price: number;
    productName?: string;
    variantName?: string;
  }[];
}

export interface UpdateOrderStatusDto {
  status: 'pending' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';
  note?: string;
}

export interface UpdateOrderDto {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  discountCodeId?: number;
  notes?: string;
  status?: 'pending' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  subtotal?: number;
  shippingFee?: number;
  discountAmount?: number;
  total?: number;
  items?: {
    id?: number;
    productId?: number;
    variantId?: number;
    quantity: number;
    price: number;
    productName?: string;
    variantName?: string;
  }[];
}

export interface OrderQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

// Cart Types
export interface CartItem {
  productId: number;
  variantId?: number;
  quantity: number;
}

export interface CalculateCartDto {
  items: CartItem[];
  discountCode?: string;
}

export interface CartCalculation {
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  items: {
    productId: number;
    variantId?: number;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
}

// Customer Types
export interface AdminCustomerSummary {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Media Types
export interface Media {
  id: number;
  name?: string; // Custom display name for easier search
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  filepath?: string;
  alt?: string;
  altText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateMediaDto {
  name?: string;
}
