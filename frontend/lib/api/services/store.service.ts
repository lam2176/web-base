import apiClient from "../client";
import { ApiResponse, StoreInfo } from "@/lib/types/api";

export const storeService = {
  /**
   * Get store information
   */
  getInfo: async (): Promise<StoreInfo> => {
    try {
      const response = await apiClient.get<ApiResponse<StoreInfo>>("/store");
      return response.data.data!;
    } catch (error: any) {
      console.error("[StoreService] Error fetching store info:", error.message);
      throw error;
    }
  },
};
