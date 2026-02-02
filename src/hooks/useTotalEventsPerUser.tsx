import { useState, useCallback } from 'react';
import { TotalEventsPerUserResponse } from '../types/EventStats';
import { getTotalEventsPerUser } from '../libs/TotalEventsPerUserService';

export const useTotalEventsPerUser = (fechaIni?: string, fechaFin?: string) => {
  const [data, setData] = useState<TotalEventsPerUserResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTotalEventsPerUser(fechaIni, fechaFin);
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Error fetching total events per user');
    } finally {
      setLoading(false);
    }
  }, [fechaIni, fechaFin]);

  return { data, loading, error, fetch };
};
