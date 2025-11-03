import axiosInstance from '../interceptor/axiosInstance';
import { Customer } from '../types/Customer';

const BASE_URL = import.meta.env.VITE_PRONTO_RAG_CHAT_URL || '';
const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';

export const getCustomerById = async (id: string): Promise<Customer> => {
  const response = await axiosInstance.get<Customer>(
    `${BASE_URL}/customers/${API_VERSION_V0}/${id}`
  );
  return response.data;
};
