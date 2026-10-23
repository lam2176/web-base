import { apiClient } from './client';
import { ApiResponse } from '@/lib/types/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatProductCard {
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  inStock: boolean;
}

export interface ChatReply {
  reply: string;
  products: ChatProductCard[];
}

export const chatService = {
  send: async (messages: ChatMessage[]): Promise<ChatReply> => {
    // The assistant may call several tools before answering, so allow more than the default 30s
    const response = await apiClient.post<ApiResponse<ChatReply>>(
      '/chat',
      { messages },
      { timeout: 60000 },
    );
    return response.data.data!;
  },
};
