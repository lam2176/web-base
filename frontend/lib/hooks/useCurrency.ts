import { useEffect } from 'react';
import { useStoreInfoStore } from '@/lib/stores/store-info.store';
import { formatPrice as formatPriceUtil, parsePrice } from '@/lib/utils/currency';

/**
 * Custom hook to handle currency formatting based on store settings
 * @returns Object with currency and formatPrice function
 */
export function useCurrency() {
  const { storeInfo, fetchStoreInfo } = useStoreInfoStore();

  useEffect(() => {
    // Fetch store info if not already loaded
    if (!storeInfo) {
      fetchStoreInfo();
    }
  }, [storeInfo, fetchStoreInfo]);

  const currency = storeInfo?.currency || 'VND';

  const formatPrice = (price: number | string | undefined): string => {
    if (price === undefined || price === null) return '0';
    return formatPriceUtil(price, currency);
  };

  return {
    currency,
    formatPrice,
    parsePrice,
    storeInfo,
  };
}
