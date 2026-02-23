import { useState, useEffect } from 'react';
import { BrandsResponse, Brand, ProductPartsQueryParams } from '../types/productParts';
import { getBrands, searchBrands } from '../libs/ProductPartsService';

export interface UseBrandsResult {
  brands: Brand[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  totalItems: number;
  currentPage: number;
  refetch: () => void;
  searchBrands: (searchTerm: string) => void;
  clearSearch: () => void;
}

export const useBrands = (initialParams: ProductPartsQueryParams = {}): UseBrandsResult => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialParams.page || 1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [params, setParams] = useState<ProductPartsQueryParams>(initialParams);

  const fetchBrands = async (fetchParams: ProductPartsQueryParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      const finalParams = { ...params, ...fetchParams };
      let response: BrandsResponse;

      if (searchTerm) {
        response = await searchBrands(searchTerm, finalParams);
      } else {
        response = await getBrands(finalParams);
      }

      setBrands(response.items);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalItems);
      setCurrentPage(response.currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching brands');
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchBrands(params);
  };

  const searchBrands = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    fetchBrands({ ...params, page: 1 });
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    fetchBrands({ ...params, page: 1 });
  };

  // Update params and refetch when they change
  const updateParams = (newParams: ProductPartsQueryParams) => {
    setParams(newParams);
    fetchBrands(newParams);
  };

  useEffect(() => {
    fetchBrands(initialParams);
  }, []);

  return {
    brands,
    loading,
    error,
    totalPages,
    totalItems,
    currentPage,
    refetch,
    searchBrands,
    clearSearch,
  };
};