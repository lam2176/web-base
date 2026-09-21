import apiClient from '../client';
import { ApiResponse, DiscountCode } from '@/lib/types/api';

interface ValidateDiscountCodeParams {
  code: string;
  customerEmail?: string;
  customerPhone?: string;
}

export const discountCodeService = {
  validate: async (params: ValidateDiscountCodeParams | string): Promise<DiscountCode> => {
    // Support both old (string) and new (object) format for backwards compatibility
    const payload = typeof params === 'string'
      ? { code: params }
      : params;

    const response = await apiClient.post<ApiResponse<DiscountCode>>('/discount-codes/validate', payload);
    return response.data.data!;
  },
};

