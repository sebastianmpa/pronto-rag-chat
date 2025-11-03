
import axiosInstance from '../interceptor/axiosInstance';
import { CreateConversationDto, ConversationResponse } from '../types/Conversation';
import { ConversationPaginatedResponse } from '../types/Conversation';
import { ConversationDetailResponse } from '../types/Conversation';

const BASE_URL = import.meta.env.VITE_PRONTO_RAG_CHAT_URL || '';
const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';

export const sendMessageToConversationService = async (data: {
  customer_id: string;
  question: string;
  lang: string;
  store_domain: string;
  conversation_id?: string;
}) => {
  // Sube el timeout (ej. 180s). Si igual expira, lo manejamos en la UI con polling.
  const response = await axiosInstance.post(
    `${BASE_URL}/conversations/${API_VERSION_V0}`,
    data,
    { timeout: 180000 } // 3 minutos
  );
  return response.data;
};


export const createConversation = async (data: CreateConversationDto): Promise<ConversationResponse> => {
  const response = await axiosInstance.post<ConversationResponse>(`${BASE_URL}/conversations/${API_VERSION_V0}`, data);
  return response.data;
};

export const getConversationsPaginated = async (page = 1, limit = 10): Promise<ConversationPaginatedResponse> => {
  const response = await axiosInstance.get<ConversationPaginatedResponse>(
    `${BASE_URL}/conversations/${API_VERSION_V0}?page=${page}&limit=${limit}`
  );
  return response.data;
};

export const getConversationById = async (id: string): Promise<ConversationDetailResponse> => {
  const response = await axiosInstance.get<ConversationDetailResponse>(
    `${BASE_URL}/conversations/${API_VERSION_V0}/${id}`
  );
  return response.data;
};

export const getMyConversationsPaginated = async (page = 1, limit = 10): Promise<ConversationPaginatedResponse> => {
  const response = await axiosInstance.get<ConversationPaginatedResponse>(
    `${BASE_URL}/conversations/${API_VERSION_V0}/me/?page=${page}&limit=${limit}`
  );
  return response.data;
};

export const getMyConversationById = async (id: string): Promise<ConversationDetailResponse> => {
  const response = await axiosInstance.get<ConversationDetailResponse>(
    `${BASE_URL}/conversations/${API_VERSION_V0}/me/${id}`
  );
  return response.data;
};

export const deleteConversationById = async (id: string): Promise<any> => {
  const response = await axiosInstance.delete(
    `${BASE_URL}/conversations/${API_VERSION_V0}/${id}`
  );
  return response.data;
};

export const deleteMyConversationById = async (id: string): Promise<any> => {
  const response = await axiosInstance.delete(
    `${BASE_URL}/conversations/${API_VERSION_V0}/me/${id}`
  );
  return response.data;
};
