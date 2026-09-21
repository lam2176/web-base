import axiosInstance from '../axios';
import { StoreInfo } from '@/types';

// Get store information (public endpoint)
export const getStoreInfo = async (): Promise<StoreInfo> => {
  const response = await axiosInstance.get<{ data: StoreInfo }>('/store');
  return response.data.data;
};

// Get store settings (public)
export const getStoreSettings = async (): Promise<{
  currency: string;
  currencySymbol: string;
  timezone: string;
  defaultLanguage: string;
  supportedLanguages: string[];
}> => {
  const response = await axiosInstance.get('/store/settings');
  return response.data;
};

// Subscribe to newsletter
export const subscribeNewsletter = async (email: string): Promise<void> => {
  await axiosInstance.post('/store/newsletter/subscribe', { email });
};

// Contact form submission
export const submitContactForm = async (data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<void> => {
  await axiosInstance.post('/store/contact', data);
};
