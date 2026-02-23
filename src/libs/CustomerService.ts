import axiosInstance from '../interceptor/axiosInstance';
import { Customer } from '../types/Customer';
import { CustomerSearchQueryParams, CustomerSearchResponse } from '../types/customers';

const BASE_URL = import.meta.env.VITE_PRONTO_RAG_CHAT_URL || '';
const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';

export const getCustomerById = async (id: string): Promise<Customer> => {
  const response = await axiosInstance.get<Customer>(
    `${BASE_URL}/customers/${API_VERSION_V0}/${id}`
  );
  return response.data;
};

export const searchCustomers = async (params: CustomerSearchQueryParams): Promise<CustomerSearchResponse> => {
  try {
    const queryParams = new URLSearchParams({
      q: params.q,
    });

    if (params.page) {
      queryParams.append('page', params.page.toString());
    }

    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const response = await axiosInstance.get(
      `/ideal-query/${API_VERSION_V0}/clients/search?${queryParams.toString()}`
    );

    return response.data;
  } catch (error: any) {
    console.error('Error searching customers:', error);
    throw new Error(error.response?.data?.message || 'Failed to search customers');
  }
};
