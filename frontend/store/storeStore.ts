import { create } from 'zustand';
import { StoreInfo } from '@/types';
import * as storeApi from '@/lib/api/endpoints/store';

interface StoreState {
  storeInfo: StoreInfo | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

interface StoreActions {
  fetchStoreInfo: (force?: boolean) => Promise<void>;
  setStoreInfo: (storeInfo: StoreInfo) => void;
  clearError: () => void;
}

type StoreStore = StoreState & StoreActions;

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const useStoreStore = create<StoreStore>((set, get) => ({
  // Initial state
  storeInfo: null,
  isLoading: false,
  error: null,
  lastFetched: null,

  // Actions
  fetchStoreInfo: async (force = false) => {
    const { lastFetched, storeInfo } = get();

    // Check if cache is still valid
    if (
      !force &&
      storeInfo &&
      lastFetched &&
      Date.now() - lastFetched < CACHE_DURATION
    ) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await storeApi.getStoreInfo();
      set({
        storeInfo: data,
        isLoading: false,
        lastFetched: Date.now(),
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch store info',
        isLoading: false,
      });
    }
  },

  setStoreInfo: (storeInfo) => {
    set({ storeInfo, lastFetched: Date.now() });
  },

  clearError: () => {
    set({ error: null });
  },
}));
