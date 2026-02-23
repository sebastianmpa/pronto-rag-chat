import { useState, useCallback } from 'react';
import { PricingQueryParams, PricingResponse } from '../types/pricing';
import { getPricing } from '../libs/PricingService';

export interface UsePricingResult {
  pricing: PricingResponse | null;
  loading: boolean;
  error: string | null;
  fetchPricing: (params: PricingQueryParams) => Promise<void>;
  clearPricing: () => void;
}

export const usePricing = (): UsePricingResult => {
  const [pricing, setPricing] = useState<PricingResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPricing = useCallback(async (params: PricingQueryParams) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPricing(params);
      setPricing(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching pricing');
      setPricing(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPricing = useCallback(() => {
    setPricing(null);
    setError(null);
  }, []);

  return {
    pricing,
    loading,
    error,
    fetchPricing,
    clearPricing,
  };
};