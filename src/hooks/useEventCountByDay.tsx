import { useState, useEffect } from 'react';
import { getEventCountByDay } from '../libs/EventStatsService';
import { EventCountByDay } from '../types/Stats';

interface UseEventCountByDayOptions {
  fechaIni: string;
  fechaFin: string;
  eventName: string;
}

export function useEventCountByDay({ fechaIni, fechaFin, eventName }: UseEventCountByDayOptions) {
  const [data, setData] = useState<EventCountByDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getEventCountByDay(fechaIni, fechaFin, eventName)
      .then((res) => setData(res.stats))
      .catch((err) => setError(err.message || 'Error al cargar datos'))
      .finally(() => setLoading(false));
  }, [fechaIni, fechaFin, eventName]);

  return { data, loading, error };
}
