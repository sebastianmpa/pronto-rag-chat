import { useState, useEffect } from 'react';
import { ModelsByBrandResponse, Model, ModelsByBrandQueryParams } from '../types/productParts';
import { getModelsByBrand, searchModelsByBrand } from '../libs/ProductPartsService';

export interface UseModelsByBrandResult {
  models: Model[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  totalItems: number;
  currentPage: number;
  brand: string;
  refetch: () => void;
  searchModels: (searchTerm: string) => void;
  clearSearch: () => void;
  changePage: (page: number) => void;
}

export const useModelsByBrand = (
  brand: string,
  initialParams: Omit<ModelsByBrandQueryParams, 'brand'> = {}
): UseModelsByBrandResult => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialParams.page || 1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [params, setParams] = useState<Omit<ModelsByBrandQueryParams, 'brand'>>(initialParams);

  const fetchModels = async (fetchParams: Omit<ModelsByBrandQueryParams, 'brand'> = {}) => {
    if (!brand) {
      setModels([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const finalParams = { brand, ...params, ...fetchParams };
      let response: ModelsByBrandResponse;

      if (searchTerm) {
        response = await searchModelsByBrand(brand, searchTerm, finalParams);
      } else {
        response = await getModelsByBrand(finalParams);
      }

      setModels(response.models);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalItems);
      setCurrentPage(response.currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching models');
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchModels(params);
  };

  const searchModels = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    fetchModels({ ...params, page: 1 });
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    fetchModels({ ...params, page: 1 });
  };

  const changePage = (page: number) => {
    setCurrentPage(page);
    fetchModels({ ...params, page });
  };

  // Update params and refetch when they change
  const updateParams = (newParams: Omit<ModelsByBrandQueryParams, 'brand'>) => {
    setParams(newParams);
    fetchModels(newParams);
  };

  useEffect(() => {
    if (brand) {
      fetchModels(initialParams);
    } else {
      setModels([]);
      setLoading(false);
    }
  }, [brand]);

  return {
    models,
    loading,
    error,
    totalPages,
    totalItems,
    currentPage,
    brand,
    refetch,
    searchModels,
    clearSearch,
    changePage,
  };
};