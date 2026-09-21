import { create } from 'zustand';
import { Product, ProductQueryDto, PaginatedResponse } from '@/lib/types/api';
import { productService } from '@/lib/api/services/product.service';

interface ProductState {
  products: Product[];
  featuredProducts: Product[];
  currentProduct: Product | null;
  relatedProducts: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProducts: (query?: ProductQueryDto) => Promise<void>;
  fetchFeaturedProducts: (limit?: number) => Promise<void>;
  fetchProductById: (id: number) => Promise<void>;
  fetchProductBySlug: (slug: string) => Promise<void>;
  fetchRelatedProducts: (id: number, limit?: number) => Promise<void>;
  clearCurrentProduct: () => void;
  clearError: () => void;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  featuredProducts: [],
  currentProduct: null,
  relatedProducts: [],
  pagination: null,
  isLoading: false,
  error: null,

  fetchProducts: async (query?: ProductQueryDto) => {
    set({ isLoading: true, error: null });
    try {
      const response = await productService.getAll(query);
      set({
        products: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch products',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchFeaturedProducts: async (limit?: number) => {
    set({ isLoading: true, error: null });
    try {
      const products = await productService.getFeatured(limit);
      set({
        featuredProducts: products,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch featured products',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchProductById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const product = await productService.getById(id);
      set({
        currentProduct: product,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch product',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchProductBySlug: async (slug: string) => {
    set({ isLoading: true, error: null });
    try {
      const product = await productService.getBySlug(slug);
      set({
        currentProduct: product,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch product',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchRelatedProducts: async (id: number, limit?: number) => {
    set({ isLoading: true, error: null });
    try {
      const products = await productService.getRelated(id, limit);
      set({
        relatedProducts: products,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch related products',
        isLoading: false,
      });
      throw error;
    }
  },

  clearCurrentProduct: () => {
    set({ currentProduct: null, relatedProducts: [] });
  },

  clearError: () => {
    set({ error: null });
  },
}));
