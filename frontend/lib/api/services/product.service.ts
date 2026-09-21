import apiClient from '../client';
import { ApiResponse, PaginatedResponse, Product, ProductQueryDto } from '@/lib/types/api';

export const productService = {
  /**
   * Get all products with filters
   */
  getAll: async (query?: ProductQueryDto): Promise<PaginatedResponse<Product[]>> => {
    const response = await apiClient.get<PaginatedResponse<Product[]>>('/products', {
      params: query,
    });
    return response.data;
  },

  /**
   * Get featured products
   */
  getFeatured: async (limit?: number): Promise<Product[]> => {
    const response = await apiClient.get<ApiResponse<Product[]>>('/products/featured', {
      params: { limit },
    });
    return response.data.data!;
  },

  /**
   * Get product by ID
   */
  getById: async (id: number): Promise<Product> => {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data!;
  },

  /**
   * Get product by slug
   */
  getBySlug: async (slug: string): Promise<Product> => {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/slug/${slug}`);
    return response.data.data!;
  },

  /**
   * Get related products
   */
  getRelated: async (id: number, limit?: number): Promise<Product[]> => {
    const response = await apiClient.get<ApiResponse<Product[]>>(`/products/${id}/related`, {
      params: { limit },
    });
    return response.data.data!;
  },
};
