import apiClient from '../client';
import { ApiResponse, Page } from '@/lib/types/api';

export const pageService = {
  /**
   * Get page by ID
   */
  getById: async (id: number): Promise<Page> => {
    const response = await apiClient.get<ApiResponse<Page>>(`/pages/${id}`);
    return response.data.data!;
  },

  /**
   * Get page by slug
   */
  getBySlug: async (slug: string): Promise<Page> => {
    const response = await apiClient.get<ApiResponse<Page>>(`/pages/slug/${slug}`);
    return response.data.data!;
  },

  /**
   * Get pages for menu (showInMenu=true)
   */
  getMenuPages: async (): Promise<Array<{ id: number; slug: string; titleVi: string; titleEn: string; order: number }>> => {
    const response = await apiClient.get<ApiResponse<Array<{ id: number; slug: string; titleVi: string; titleEn: string; order: number }>>>('/pages/menu');
    return response.data.data || [];
  },
};
