import { useQuery } from '@tanstack/react-query';
import { menuService } from '@/lib/api/services/menu.service';
import { pageService } from '@/lib/api/services/page.service';

export function useHeaderMenus() {
  return useQuery({
    queryKey: ['menus', 'header'],
    queryFn: async () => {
      const menus = await menuService.getHeaderMenus();
      // Strictly filter: only active menus with valid ID and active items
      const filtered = menus
        .filter(menu => {
          // Only keep menus that are explicitly active and have valid ID
          if (!menu || menu.isActive !== true || !menu.id || typeof menu.id !== 'number') {
            return false;
          }
          return true;
        })
        .map(menu => ({
          ...menu,
          items: (menu.items || [])
            .filter(item => {
              // Only top-level active items with valid ID
              if (!item || !item.id || typeof item.id !== 'number' || item.parentId || item.isActive !== true) {
                return false;
              }
              return true;
            })
            .map(item => ({
              ...item,
              children: (item.children || []).filter(child => {
                // Only active children with valid ID
                return child && child.isActive === true && child.id && typeof child.id === 'number';
              }),
            })),
        }))
        .filter(menu => menu.items && menu.items.length > 0); // Remove menus with no items
      
      return filtered;
    },
    staleTime: 0, // No cache - always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    gcTime: 0, // No garbage collection time - always fresh
  });
}

export function useFooterMenus() {
  return useQuery({
    queryKey: ['menus', 'footer'],
    queryFn: async () => {
      const menus = await menuService.getFooterMenus();
      // Strictly filter: only active menus with valid ID and active items
      const filtered = menus
        .filter(menu => {
          // Only keep menus that are explicitly active and have valid ID
          if (!menu || menu.isActive !== true || !menu.id || typeof menu.id !== 'number') {
            return false;
          }
          return true;
        })
        .map(menu => ({
          ...menu,
          items: (menu.items || [])
            .filter(item => {
              // Only top-level active items with valid ID
              if (!item || !item.id || typeof item.id !== 'number' || item.parentId || item.isActive !== true) {
                return false;
              }
              return true;
            })
            .map(item => ({
              ...item,
              children: (item.children || []).filter(child => {
                // Only active children with valid ID
                return child && child.isActive === true && child.id && typeof child.id === 'number';
              }),
            })),
        }))
        .filter(menu => menu.items && menu.items.length > 0); // Remove menus with no items

      return filtered;
    },
    staleTime: 0, // No cache - always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    gcTime: 0, // No garbage collection time - always fresh
  });
}

export function useMenuPages() {
  return useQuery({
    queryKey: ['pages', 'menu'],
    queryFn: () => pageService.getMenuPages(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

