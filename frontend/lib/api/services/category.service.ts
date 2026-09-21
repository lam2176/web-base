import apiClient from '../client';
import { ApiResponse, Category } from '@/lib/types/api';

export const categoryService = {
  /**
   * Get all categories
   */
  getAll: async (search?: string): Promise<Category[]> => {
    const response = await apiClient.get<ApiResponse<Category[]>>('/categories', {
      params: { search },
    });
    return response.data.data!;
  },

  /**
   * Get root categories (no parent)
   */
  getRootCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<ApiResponse<Category[]>>('/categories/root');
    return response.data.data!;
  },

  /**
   * Get category by ID
   */
  getById: async (id: number): Promise<Category> => {
    const response = await apiClient.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data.data!;
  },

  /**
   * Get category by slug
   */
  getBySlug: async (slug: string): Promise<Category> => {
    const response = await apiClient.get<ApiResponse<Category>>(`/categories/slug/${slug}`);
    return response.data.data!;
  },

  /**
   * Get child categories
   */
  getChildren: async (id: number): Promise<Category[]> => {
    const response = await apiClient.get<ApiResponse<Category[]>>(`/categories/${id}/children`);
    return response.data.data!;
  },
};
