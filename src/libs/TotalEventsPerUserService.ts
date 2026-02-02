import axiosInstance from '../interceptor/axiosInstance';

const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';

export const getTotalEventsPerUser = async (fechaIni?: string, fechaFin?: string) => {
  const params: any = {};
  if (fechaIni) params.fechaIni = fechaIni;
  if (fechaFin) params.fechaFin = fechaFin;

  const response = await axiosInstance.get(`/stats/${API_VERSION_V0}/get-total-events-per-user`, {
    params: Object.keys(params).length ? params : undefined,
  });

  return response.data;
};
