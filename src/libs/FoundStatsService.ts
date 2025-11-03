import axiosInstance from '../interceptor/axiosInstance';
import { FoundStatsResponse } from '../types/FoundStats';

const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';

export const getFoundStats = async (fechaIni: string, fechaFin: string): Promise<FoundStatsResponse> => {
  const response = await axiosInstance.get<FoundStatsResponse>(`/stats/${API_VERSION_V0}/get-found-stats`, {
    params: { fechaIni, fechaFin },
  });
  return response.data;
};
