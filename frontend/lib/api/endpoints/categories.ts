import axiosInstance from '../axios';
import { Category } from '@/types';

// Get all categories
export const getCategories = async (includeInactive: boolean = false): Promise<Category[]> => {
  const response = await axiosInstance.get<Category[]>('/categories', {
    params: { includeInactive },
  });
  return response.data;
};

// Get category by slug
export const getCategoryBySlug = async (slug: string): Promise<Category> => {
  const response = await axiosInstance.get<Category>(`/categories/${slug}`);
  return response.data;
};

// Get category by ID
export const getCategoryById = async (id: string): Promise<Category> => {
  const response = await axiosInstance.get<Category>(`/categories/id/${id}`);
  return response.data;
};

// Get root categories (no parent)
export const getRootCategories = async (): Promise<Category[]> => {
  const response = await axiosInstance.get<Category[]>('/categories/root');
  return response.data;
};

// Get category tree (hierarchical structure)
export const getCategoryTree = async (): Promise<Category[]> => {
  const response = await axiosInstance.get<Category[]>('/categories/tree');
  return response.data;
};

// Get subcategories of a category
export const getSubcategories = async (categoryId: string): Promise<Category[]> => {
  const response = await axiosInstance.get<Category[]>(`/categories/${categoryId}/children`);
  return response.data;
};
