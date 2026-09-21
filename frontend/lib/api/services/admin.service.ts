import apiClient from '../client';
import {
  AdminCustomerSummary,
  ApiResponse,
  Banner,
  Category,
  Coupon,
  CreateBannerDto,
  CreateCategoryDto,
  CreateCouponDto,
  CreateDiscountCodeDto,
  CreatePageDto,
  CreateProductDto,
  DiscountCode,
  Media,
  Order,
  OrderQueryDto,
  PaginatedResponse,
  Page,
  Product,
  ProductQueryDto,
  StoreInfo,
  UpdateBannerDto,
  UpdateCategoryDto,
  UpdateCouponDto,
  UpdateDiscountCodeDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
  UpdatePageDto,
  UpdateProductDto,
  UpdateStoreInfoDto,
  UpdateMediaDto,
  User,
} from '@/lib/types/api';

// Categories Admin Service
export const adminCategoryService = {
  getAll: async (search?: string): Promise<Category[]> => {
    const response = await apiClient.get<ApiResponse<Category[]>>('/admin/categories', {
      params: { search },
    });
    return response.data.data!;
  },

  getById: async (id: number): Promise<Category> => {
    const response = await apiClient.get<ApiResponse<Category>>(`/admin/categories/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateCategoryDto): Promise<Category> => {
    const response = await apiClient.post<ApiResponse<Category>>('/admin/categories', data);
    return response.data.data!;
  },

  update: async (id: number, data: UpdateCategoryDto): Promise<Category> => {
    const response = await apiClient.put<ApiResponse<Category>>(`/admin/categories/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/categories/${id}`);
  },
};

// Products Admin Service
export const adminProductService = {
  getAll: async (query?: ProductQueryDto): Promise<PaginatedResponse<Product[]>> => {
    const response = await apiClient.get<PaginatedResponse<Product[]>>('/admin/products', {
      params: query,
    });
    return response.data;
  },

  getById: async (id: number): Promise<Product> => {
    const response = await apiClient.get<ApiResponse<Product>>(`/admin/products/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateProductDto): Promise<Product> => {
    const response = await apiClient.post<ApiResponse<Product>>('/admin/products', data);
    return response.data.data!;
  },

  update: async (id: number, data: UpdateProductDto): Promise<Product> => {
    const response = await apiClient.put<ApiResponse<Product>>(`/admin/products/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/products/${id}`);
  },

  import: async (products: any[]): Promise<{ success: number; failed: number; errors: any[] }> => {
    const response = await apiClient.post<ApiResponse<{ success: number; failed: number; errors: any[] }>>(
      '/admin/products/import',
      { products },
    );
    return response.data.data!;
  },
};

// Banners Admin Service
export const adminBannerService = {
  getAll: async (): Promise<Banner[]> => {
    const response = await apiClient.get<ApiResponse<Banner[]>>('/admin/banners');
    return response.data.data!;
  },

  getById: async (id: number): Promise<Banner> => {
    const response = await apiClient.get<ApiResponse<Banner>>(`/admin/banners/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateBannerDto): Promise<Banner> => {
    const response = await apiClient.post<ApiResponse<Banner>>('/admin/banners', data);
    return response.data.data!;
  },

  update: async (id: number, data: UpdateBannerDto): Promise<Banner> => {
    const response = await apiClient.put<ApiResponse<Banner>>(`/admin/banners/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/banners/${id}`);
  },
};

// Pages Admin Service
export const adminPageService = {
  getAll: async (search?: string): Promise<Page[]> => {
    const response = await apiClient.get<ApiResponse<Page[]>>('/admin/pages', {
      params: { search },
    });
    return response.data.data!;
  },

  getById: async (id: number): Promise<Page> => {
    const response = await apiClient.get<ApiResponse<Page>>(`/admin/pages/${id}`);
    return response.data.data!;
  },

  create: async (data: CreatePageDto): Promise<Page> => {
    const response = await apiClient.post<ApiResponse<Page>>('/admin/pages', data);
    return response.data.data!;
  },

  update: async (id: number, data: UpdatePageDto): Promise<Page> => {
    const response = await apiClient.put<ApiResponse<Page>>(`/admin/pages/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/pages/${id}`);
  },

  reorder: async (pages: Array<{ id: number; order: number }>): Promise<void> => {
    await apiClient.post('/admin/pages/reorder', { pages });
  },
};

// Store Admin Service
export const adminStoreService = {
  getInfo: async (): Promise<StoreInfo> => {
    const response = await apiClient.get<ApiResponse<StoreInfo>>('/admin/store');
    return response.data.data!;
  },

  update: async (data: UpdateStoreInfoDto): Promise<StoreInfo> => {
    const response = await apiClient.put<ApiResponse<StoreInfo>>('/admin/store', data);
    return response.data.data!;
  },
};

// Coupons Admin Service
export const adminCouponService = {
  getAll: async (): Promise<Coupon[]> => {
    const response = await apiClient.get<ApiResponse<Coupon[]>>('/admin/coupons');
    return response.data.data!;
  },

  getById: async (id: number): Promise<Coupon> => {
    const response = await apiClient.get<ApiResponse<Coupon>>(`/admin/coupons/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateCouponDto): Promise<Coupon> => {
    const response = await apiClient.post<ApiResponse<Coupon>>('/admin/coupons', data);
    return response.data.data!;
  },

  update: async (id: number, data: UpdateCouponDto): Promise<Coupon> => {
    const response = await apiClient.put<ApiResponse<Coupon>>(`/admin/coupons/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/coupons/${id}`);
  },
};

// Discount Codes Admin Service
export const adminDiscountCodeService = {
  getAll: async (): Promise<DiscountCode[]> => {
    const response = await apiClient.get<ApiResponse<DiscountCode[]>>('/admin/discount-codes');
    return response.data.data!;
  },

  getById: async (id: number): Promise<DiscountCode> => {
    const response = await apiClient.get<ApiResponse<DiscountCode>>(`/admin/discount-codes/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateDiscountCodeDto): Promise<DiscountCode> => {
    const response = await apiClient.post<ApiResponse<DiscountCode>>('/admin/discount-codes', data);
    return response.data.data!;
  },

  update: async (id: number, data: UpdateDiscountCodeDto): Promise<DiscountCode> => {
    const response = await apiClient.put<ApiResponse<DiscountCode>>(`/admin/discount-codes/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/discount-codes/${id}`);
  },
};

// Orders Admin Service
export const adminOrderService = {
  getAll: async (query?: OrderQueryDto): Promise<PaginatedResponse<Order[]>> => {
    const response = await apiClient.get<PaginatedResponse<Order[]>>('/admin/orders', {
      params: query,
    });
    return response.data;
  },

  getById: async (id: number): Promise<Order> => {
    const response = await apiClient.get<ApiResponse<Order>>(`/admin/orders/${id}`);
    return response.data.data!;
  },

  update: async (id: number, data: UpdateOrderDto): Promise<Order> => {
    const response = await apiClient.put<ApiResponse<Order>>(`/admin/orders/${id}`, data);
    return response.data.data!;
  },

  updateStatus: async (id: number, data: UpdateOrderStatusDto): Promise<Order> => {
    const response = await apiClient.put<ApiResponse<Order>>(`/admin/orders/${id}/status`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/orders/${id}`);
  },
};

// Users Admin Service
export const adminUserService = {
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get<ApiResponse<User[]>>('/admin/users');
    return response.data.data!;
  },

  getById: async (id: number): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(`/admin/users/${id}`);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`);
  },
};

// Media Admin Service
export const adminMediaService = {
  getAll: async (): Promise<Media[]> => {
    const response = await apiClient.get<ApiResponse<Media[]>>('/admin/media');
    return response.data.data!;
  },

  getById: async (id: number): Promise<Media> => {
    const response = await apiClient.get<ApiResponse<Media>>(`/admin/media/${id}`);
    return response.data.data!;
  },

  upload: async (file: File): Promise<Media> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<Media>>('/admin/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  },

  update: async (id: number, data: UpdateMediaDto): Promise<Media> => {
    const response = await apiClient.put<ApiResponse<Media>>(`/admin/media/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/media/${id}`);
  },
};

// Customers Admin Service
export const adminCustomerService = {
  getAll: async (): Promise<AdminCustomerSummary[]> => {
    const response = await apiClient.get<ApiResponse<AdminCustomerSummary[]>>('/admin/customers');
    return response.data.data ?? [];
  },
  getById: async (id: number): Promise<AdminCustomerSummary> => {
    const response = await apiClient.get<ApiResponse<AdminCustomerSummary>>(`/admin/customers/${id}`);
    return response.data.data!;
  },
  update: async (
    id: number,
    data: { fullName?: string; phoneNumber?: string; email?: string; isActive?: boolean },
  ): Promise<AdminCustomerSummary> => {
    const response = await apiClient.put<ApiResponse<AdminCustomerSummary>>(`/admin/customers/${id}`, data);
    return response.data.data!;
  },
};
