import axiosInstance from '../interceptor/axiosInstance';
import { EventStatsResponse } from '../types/EventStats';
import { EventCountByDayResponse } from '../types/Stats';

const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';

export const getTotalByEventType = async (fechaIni?: string, fechaFin?: string): Promise<EventStatsResponse> => {
  // Solo agrega params si ambos existen y no son vacíos
  let params: any = undefined;
  if (fechaIni && fechaFin) {
    params = { fechaIni, fechaFin };
  }
  const response = await axiosInstance.get<EventStatsResponse>(`/stats/${API_VERSION_V0}/get-total-by-event-type`, params ? { params } : undefined);
  return response.data;
};

export const getEventCountByDay = async (
  fechaIni?: string,
  fechaFin?: string,
  eventName?: string
): Promise<EventCountByDayResponse> => {
  // Solo agrega params si todos existen y no son vacíos
  let params: any = undefined;
  if (fechaIni && fechaFin && eventName) {
    params = { fechaIni, fechaFin, eventName };
  }
  const response = await axiosInstance.get<EventCountByDayResponse>(
    `/stats/${API_VERSION_V0}/get-event-count-by-day`,
    params ? { params } : undefined
  );
  return response.data;
};
