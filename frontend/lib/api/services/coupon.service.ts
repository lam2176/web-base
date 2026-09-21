import apiClient from '../client';
import { ApiResponse, Coupon } from '@/lib/types/api';

export const couponService = {
  /**
   * Get coupons that are active at the current time
   */
  getActive: async (): Promise<Coupon[]> => {
    const response = await apiClient.get<ApiResponse<Coupon[]>>('/coupons/active');
    return response.data.data || [];
  },
};

