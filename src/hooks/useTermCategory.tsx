import { useState, useCallback } from 'react';
import { 
  TermCategory, 
  TermCategoriesResponse, 
  TermCategoryCreateRequest, 
  TermCategoryUpdateRequest 
} from '../types/TermCategory';
import {
  createTermCategory,
  getAllTermCategories,
  getTermCategoriesPaginated,
  getTermCategoryById,
  updateTermCategory,
  deleteTermCategory
} from '../libs/TermCategoryService';

/**
 * Hook para obtener categorías paginadas
 */
export const useTermCategoriesPaginated = (page: number = 1, limit: number = 10) => {
  const [data, setData] = useState<TermCategoriesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTermCategoriesPaginated(page, limit);
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Error fetching term categories');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  return { data, loading, error, fetch };
};

/**
 * Hook para obtener todas las categorías
 */
export const useAllTermCategories = () => {
  const [data, setData] = useState<TermCategory[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllTermCategories();
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Error fetching term categories');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetch };
};

/**
 * Hook para obtener una categoría por ID
 */
export const useTermCategoryById = (categoryId: string) => {
  const [data, setData] = useState<TermCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!categoryId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getTermCategoryById(categoryId);
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Error fetching term category');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  return { data, loading, error, fetch };
};

/**
 * Hook para crear una categoría
 */
export const useCreateTermCategory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: TermCategoryCreateRequest): Promise<TermCategory | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await createTermCategory(data);
      return result;
    } catch (err: any) {
      setError(err?.message || 'Error creating term category');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
};

/**
 * Hook para actualizar una categoría
 */
export const useUpdateTermCategory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (
    categoryId: string, 
    data: TermCategoryUpdateRequest
  ): Promise<TermCategory | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateTermCategory(categoryId, data);
      return result;
    } catch (err: any) {
      setError(err?.message || 'Error updating term category');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
};

/**
 * Hook para eliminar una categoría
 */
export const useDeleteTermCategory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (categoryId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await deleteTermCategory(categoryId);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Error deleting term category');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading, error };
};
