import axiosInstance from '../interceptor/axiosInstance';
import { SalesRepSearchQueryParams, SalesRepSearchResponse } from '../types/salesRep';

const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';

export const searchSalesReps = async (
  params: SalesRepSearchQueryParams,
): Promise<SalesRepSearchResponse> => {
  const queryParams = new URLSearchParams({ q: params.q });
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const response = await axiosInstance.get(
    `/ideal-query/${API_VERSION_V0}/sales-reps/search?${queryParams.toString()}`,
  );
  return response.data;
};
