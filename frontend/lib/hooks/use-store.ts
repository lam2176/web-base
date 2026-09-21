import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeService } from '@/lib/api/services/store.service';
import { cartService } from '@/lib/api/services/cart.service';
import { bannerService } from '@/lib/api/services/banner.service';
import { CalculateCartDto } from '@/lib/types/api';

/**
 * Hook to get store information
 */
export function useStoreInfo() {
  return useQuery({
    queryKey: ['store', 'info'],
    queryFn: () => storeService.getInfo(),
  });
}

/**
 * Hook to get active banners
 */
export function useActiveBanners() {
  return useQuery({
    queryKey: ['banners', 'active'],
    queryFn: () => bannerService.getActive(),
  });
}

/**
 * Hook to get a single banner by ID
 */
export function useBanner(id: number) {
  return useQuery({
    queryKey: ['banners', id],
    queryFn: () => bannerService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to calculate cart totals
 */
export function useCartCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CalculateCartDto) => cartService.calculate(data),
    onSuccess: () => {
      // Invalidate cart-related queries
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
