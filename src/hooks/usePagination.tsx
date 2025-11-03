import { useState, useCallback } from 'react';

export interface PaginatedResponse<T> {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: T[];
}

export interface UsePaginationOptions<T> {
  fetchPaginated: (page: number, limit: number) => Promise<PaginatedResponse<T>>;
  initialPage?: number;
  initialLimit?: number;
}

export const usePagination = <T,>(options: UsePaginationOptions<T>) => {
  const { fetchPaginated, initialPage = 1, initialLimit = 10 } = options;

  const [data, setData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(initialLimit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cargar datos paginados
   */
  const loadPage = useCallback(
    async (page: number, pageLimit?: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPaginated(page, pageLimit || limit);
        setData(result.items);
        setCurrentPage(result.currentPage);
        setTotalPages(result.totalPages);
        setTotalItems(result.totalItems);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Error al cargar los datos';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchPaginated, limit]
  );

  /**
   * Ir a la siguiente página
   */
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      loadPage(currentPage + 1);
    }
  }, [currentPage, totalPages, loadPage]);

  /**
   * Ir a la página anterior
   */
  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      loadPage(currentPage - 1);
    }
  }, [currentPage, loadPage]);

  /**
   * Ir a una página específica
   */
  const gotoPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        loadPage(page);
      }
    },
    [totalPages, loadPage]
  );

  /**
   * Cambiar el límite de items por página
   */
  const changeLimit = useCallback(
    (newLimit: number) => {
      setLimit(newLimit);
      loadPage(1, newLimit);
    },
    [loadPage]
  );

  /**
   * Refrescar la página actual
   */
  const refresh = useCallback(() => {
    loadPage(currentPage);
  }, [currentPage, loadPage]);

  return {
    data,
    currentPage,
    totalPages,
    totalItems,
    limit,
    loading,
    error,
    loadPage,
    nextPage,
    previousPage,
    gotoPage,
    changeLimit,
    refresh,
    canNextPage: currentPage < totalPages,
    canPreviousPage: currentPage > 1,
  };
};