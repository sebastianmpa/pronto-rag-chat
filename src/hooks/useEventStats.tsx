import { useState, useCallback } from 'react';
import { getTotalByEventType } from '../libs/EventStatsService';
import { EventStatsResponse } from '../types/EventStats';

export const useEventStats = () => {
  const [eventStats, setEventStats] = useState<EventStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEventStats = useCallback(async (fechaIni: string, fechaFin: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTotalByEventType(fechaIni, fechaFin);
      setEventStats(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Error al obtener estadísticas de eventos');
      setEventStats(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { eventStats, loading, error, fetchEventStats };
};
