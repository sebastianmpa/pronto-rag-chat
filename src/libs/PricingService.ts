import axiosInstance from '../interceptor/axiosInstance';
import { PricingQueryParams, PricingResponse } from '../types/pricing';

const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0;

export const getPricing = async (params: PricingQueryParams): Promise<PricingResponse> => {
  try {
    const queryParams = new URLSearchParams({
      mfrId: params.mfrId,
      partNumber: params.partNumber,
    });

    if (params.customerId) {
      queryParams.append('customerId', params.customerId);
    }

    const response = await axiosInstance.get(
      `/ideal-query/${API_VERSION_V0}/pricing?${queryParams.toString()}`
    );

    return response.data;
  } catch (error: any) {
    console.error('Error fetching pricing:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch pricing information');
  }
};