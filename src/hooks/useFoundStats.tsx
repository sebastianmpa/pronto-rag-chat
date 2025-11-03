import { useState, useCallback } from 'react';
import { getFoundStats } from '../libs/FoundStatsService';
import { FoundStatsResponse } from '../types/FoundStats';

export const useFoundStats = () => {
  const [foundStats, setFoundStats] = useState<FoundStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFoundStats = useCallback(async (fechaIni: string, fechaFin: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFoundStats(fechaIni, fechaFin);
      setFoundStats(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Error al obtener estadísticas de encontrados');
      setFoundStats(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { foundStats, loading, error, fetchFoundStats };
};
