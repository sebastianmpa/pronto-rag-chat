import { useCallback, useState } from 'react';
import { searchSalesReps } from '../libs/SalesRepService';
import { SalesRep, SalesRepSearchQueryParams } from '../types/salesRep';

export interface UseSalesRepSearchResult {
  salesReps: SalesRep[];
  loading: boolean;
  error: string | null;
  searchSalesReps: (params: SalesRepSearchQueryParams) => Promise<void>;
  clearSearch: () => void;
}

export const useSalesRepSearch = (): UseSalesRepSearchResult => {
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(
    async (params: SalesRepSearchQueryParams) => {
      setLoading(true);
      setError(null);
      try {
        const response = await searchSalesReps(params);
        // Normaliza la respuesta: acepta array directo o wrapper con .items
        const items = Array.isArray(response) ? response : response.items ?? [];
        setSalesReps(items);
      } catch (err: any) {
        setError(err.message || 'Error buscando vendedores');
        setSalesReps([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearSearch = useCallback(() => {
    setSalesReps([]);
    setError(null);
  }, []);

  return {
    salesReps,
    loading,
    error,
    searchSalesReps: handleSearch,
    clearSearch,
  };
};
