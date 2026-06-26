import axiosInstance from '../interceptor/axiosInstance';
import { CreateOrderRequest, CreateOrderResponse } from '../types/orders';

const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0;

export const createOrder = async (
  payload: CreateOrderRequest
): Promise<CreateOrderResponse> => {
  const token = localStorage.getItem('token');

  const response = await axiosInstance.post<CreateOrderResponse>(
    `/ideal-orders/${API_VERSION_V0}/orders`,
    payload,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  return response.data;
};
