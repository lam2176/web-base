import { useQuery } from '@tanstack/react-query';
import { productService } from '@/lib/api/services/product.service';
import { ProductQueryDto } from '@/lib/types/api';

/**
 * Hook to get all products with filters
 */
export function useProducts(query?: ProductQueryDto) {
  return useQuery({
    queryKey: ['products', query],
    queryFn: () => productService.getAll(query),
  });
}

/**
 * Hook to get featured products
 */
export function useFeaturedProducts(limit?: number) {
  return useQuery({
    queryKey: ['products', 'featured', limit],
    queryFn: () => productService.getFeatured(limit),
  });
}

/**
 * Hook to get a single product by ID
 */
export function useProduct(id: number) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to get a single product by slug
 */
export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ['products', 'slug', slug],
    queryFn: () => productService.getBySlug(slug),
    enabled: !!slug,
  });
}

/**
 * Hook to get related products
 */
export function useRelatedProducts(id: number, limit?: number) {
  return useQuery({
    queryKey: ['products', id, 'related', limit],
    queryFn: () => productService.getRelated(id, limit),
    enabled: !!id,
  });
}
