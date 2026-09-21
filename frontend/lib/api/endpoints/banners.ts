import axiosInstance from '../axios';
import { Banner } from '@/types';

// Get active banners
export const getActiveBanners = async (): Promise<Banner[]> => {
  const response = await axiosInstance.get<Banner[]>('/banners/active');
  return response.data;
};

// Get all banners (including inactive)
export const getAllBanners = async (): Promise<Banner[]> => {
  const response = await axiosInstance.get<Banner[]>('/banners');
  return response.data;
};

// Get banner by ID
export const getBannerById = async (id: string): Promise<Banner> => {
  const response = await axiosInstance.get<Banner>(`/banners/${id}`);
  return response.data;
};
