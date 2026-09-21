import axiosInstance from '../axios';
import { Product, ProductListParams, PaginatedResponse } from '@/types';

// Get products with filters and pagination
export const getProducts = async (
  params?: ProductListParams
): Promise<PaginatedResponse<Product>> => {
  const response = await axiosInstance.get<PaginatedResponse<Product>>('/products', {
    params,
  });
  return response.data;
};

// Get product by slug
export const getProductBySlug = async (slug: string): Promise<Product> => {
  const response = await axiosInstance.get<Product>(`/products/${slug}`);
  return response.data;
};

// Get product by ID
export const getProductById = async (id: string): Promise<Product> => {
  const response = await axiosInstance.get<Product>(`/products/id/${id}`);
  return response.data;
};

// Get featured products
export const getFeaturedProducts = async (limit: number = 8): Promise<Product[]> => {
  const response = await axiosInstance.get<PaginatedResponse<Product>>('/products', {
    params: {
      isFeatured: true,
      limit,
      page: 1,
    },
  });
  return response.data.data;
};

// Get related products (same category)
export const getRelatedProducts = async (
  productId: string,
  limit: number = 4
): Promise<Product[]> => {
  const response = await axiosInstance.get<Product[]>(
    `/products/${productId}/related`,
    {
      params: { limit },
    }
  );
  return response.data;
};

// Search products
export const searchProducts = async (
  query: string,
  limit: number = 10
): Promise<Product[]> => {
  const response = await axiosInstance.get<PaginatedResponse<Product>>('/products', {
    params: {
      search: query,
      limit,
      page: 1,
    },
  });
  return response.data.data;
};

// Get new arrivals
export const getNewArrivals = async (limit: number = 8): Promise<Product[]> => {
  const response = await axiosInstance.get<PaginatedResponse<Product>>('/products', {
    params: {
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit,
      page: 1,
    },
  });
  return response.data.data;
};

// Get products on sale
export const getOnSaleProducts = async (limit: number = 8): Promise<Product[]> => {
  const response = await axiosInstance.get<Product[]>('/products/on-sale', {
    params: { limit },
  });
  return response.data;
};
