import { useState, useCallback } from 'react';
import { getStatsTops } from '../libs/StatsService';
import { StatsResponse } from '../types/Stats';

export const useStatsTops = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatsTops = useCallback(async (fechaIni: string, fechaFin: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStatsTops(fechaIni, fechaFin);
      setStats(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Error al obtener estadísticas');
      setStats(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, error, fetchStatsTops };
};
