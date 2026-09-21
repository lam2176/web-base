import apiClient from '../client';
import { ApiResponse, Banner } from '@/lib/types/api';

export const bannerService = {
  /**
   * Get active banners
   */
  getActive: async (): Promise<Banner[]> => {
    const response = await apiClient.get<ApiResponse<Banner[]>>('/banners/active');
    return response.data.data!;
  },

  /**
   * Get banner by ID
   */
  getById: async (id: number): Promise<Banner> => {
    const response = await apiClient.get<ApiResponse<Banner>>(`/banners/${id}`);
    return response.data.data!;
  },
};
