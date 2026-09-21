import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StoreInfo } from '@/lib/types/api';
import { storeService } from '@/lib/api/services/store.service';

interface StoreInfoState {
  storeInfo: StoreInfo | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchStoreInfo: () => Promise<void>;
  clearError: () => void;
}

export const useStoreInfoStore = create<StoreInfoState>()(
  persist(
    (set) => ({
      storeInfo: null,
      isLoading: false,
      error: null,

      fetchStoreInfo: async () => {
        set({ isLoading: true, error: null });
        try {
          const storeInfo = await storeService.getInfo();
          set({
            storeInfo,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Failed to fetch store info',
            isLoading: false,
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'store-info-storage',
      partialize: (state) => ({
        storeInfo: state.storeInfo,
      }),
    }
  )
);
