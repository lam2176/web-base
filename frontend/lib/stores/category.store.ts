import { create } from 'zustand';
import { Category } from '@/lib/types/api';
import { categoryService } from '@/lib/api/services/category.service';

interface CategoryState {
  categories: Category[];
  rootCategories: Category[];
  currentCategory: Category | null;
  childCategories: Category[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCategories: (search?: string) => Promise<void>;
  fetchRootCategories: () => Promise<void>;
  fetchCategoryById: (id: number) => Promise<void>;
  fetchCategoryBySlug: (slug: string) => Promise<void>;
  fetchChildCategories: (id: number) => Promise<void>;
  clearCurrentCategory: () => void;
  clearError: () => void;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  rootCategories: [],
  currentCategory: null,
  childCategories: [],
  isLoading: false,
  error: null,

  fetchCategories: async (search?: string) => {
    set({ isLoading: true, error: null });
    try {
      const categories = await categoryService.getAll(search);
      set({
        categories,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch categories',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchRootCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const categories = await categoryService.getRootCategories();
      set({
        rootCategories: categories,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch root categories',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchCategoryById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const category = await categoryService.getById(id);
      set({
        currentCategory: category,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch category',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchCategoryBySlug: async (slug: string) => {
    set({ isLoading: true, error: null });
    try {
      const category = await categoryService.getBySlug(slug);
      set({
        currentCategory: category,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch category',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchChildCategories: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const categories = await categoryService.getChildren(id);
      set({
        childCategories: categories,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch child categories',
        isLoading: false,
      });
      throw error;
    }
  },

  clearCurrentCategory: () => {
    set({ currentCategory: null, childCategories: [] });
  },

  clearError: () => {
    set({ error: null });
  },
}));
