import { useQuery } from '@tanstack/react-query';
import { categoryService } from '@/lib/api/services/category.service';

/**
 * Hook to get all categories
 */
export function useCategories(search?: string) {
  return useQuery({
    queryKey: ['categories', search],
    queryFn: () => categoryService.getAll(search),
  });
}

/**
 * Hook to get root categories (no parent)
 */
export function useRootCategories() {
  return useQuery({
    queryKey: ['categories', 'root'],
    queryFn: () => categoryService.getRootCategories(),
  });
}

/**
 * Hook to get a single category by ID
 */
export function useCategory(id: number) {
  return useQuery({
    queryKey: ['categories', id],
    queryFn: () => categoryService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to get a single category by slug
 */
export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: ['categories', 'slug', slug],
    queryFn: () => categoryService.getBySlug(slug),
    enabled: !!slug,
  });
}

/**
 * Hook to get child categories
 */
export function useCategoryChildren(id: number) {
  return useQuery({
    queryKey: ['categories', id, 'children'],
    queryFn: () => categoryService.getChildren(id),
    enabled: !!id,
  });
}
