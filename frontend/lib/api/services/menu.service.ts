import apiClient from '../client';
import { ApiResponse, Menu } from '@/lib/types/api';

export const menuService = {
  getHeaderMenus: async (): Promise<Menu[]> => {
    const response = await apiClient.get<ApiResponse<Menu[]>>('/menus/header');
    return response.data.data || [];
  },

  getFooterMenus: async (): Promise<Menu[]> => {
    const response = await apiClient.get<ApiResponse<Menu[]>>('/menus/footer');
    return response.data.data || [];
  },
};

