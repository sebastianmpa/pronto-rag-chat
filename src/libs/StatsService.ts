import axiosInstance from '../interceptor/axiosInstance';
import { StatsResponse } from '../types/Stats';

const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';

export const getStatsTops = async (fechaIni: string, fechaFin: string): Promise<StatsResponse> => {
  const response = await axiosInstance.get<StatsResponse>(`/stats/${API_VERSION_V0}/get-tops`, {
    params: { fechaIni, fechaFin },
  });
  return response.data;
};
