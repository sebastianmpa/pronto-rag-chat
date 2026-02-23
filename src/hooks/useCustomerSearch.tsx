import { useState, useCallback } from 'react';
import { CustomerSearchQueryParams, CustomerSearchResponse, Customer } from '../types/customers';
import { searchCustomers } from '../libs/CustomerService';

export interface UseCustomerSearchResult {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  searchCustomers: (params: CustomerSearchQueryParams) => Promise<void>;
  clearSearch: () => void;
}

export const useCustomerSearch = (): UseCustomerSearchResult => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);

  const handleSearchCustomers = useCallback(async (params: CustomerSearchQueryParams) => {
    try {
      setLoading(true);
      setError(null);
      const response = await searchCustomers(params);
      setCustomers(response.items);
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error searching customers');
      setCustomers([]);
      setCurrentPage(1);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setCustomers([]);
    setError(null);
    setCurrentPage(1);
    setTotalPages(0);
    setTotalItems(0);
  }, []);

  return {
    customers,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    searchCustomers: handleSearchCustomers,
    clearSearch,
  };
};