import { useState, useCallback } from 'react';
import { 
  Term, 
  TermsResponse, 
  TermDetailResponse, 
  TermCreateRequest, 
  TermUpdateRequest, 
  TermDefinitionResponse,
  TermsByCategoryResponse,
  TermAutocompleteResponse
} from '../types/Term';
import {
  createTerm,
  getAllTerms,
  getTermsPaginated,
  getTermById,
  getDefinitionByTerm,
  updateTerm,
  deleteTerm,
  getTermsByCategory,
  getTermsAutocomplete
} from '../libs/TermService';

/**
 * Hook para obtener términos paginados
 */
export const useTermsPaginated = (page: number = 1, limit: number = 10) => {
  const [data, setData] = useState<TermsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTermsPaginated(page, limit);
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Error fetching terms');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  return { data, loading, error, fetch };
};

/**
 * Hook para obtener todos los términos
 */
export const useAllTerms = () => {
  const [data, setData] = useState<Term[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllTerms();
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Error fetching terms');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetch };
};

/**
 * Hook para obtener un término por ID
 */
export const useTermById = (termId: string) => {
  const [data, setData] = useState<TermDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!termId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getTermById(termId);
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Error fetching term');
    } finally {
      setLoading(false);
    }
  }, [termId]);

  return { data, loading, error, fetch };
};

/**
 * Hook para obtener definición por término
 */
export const useDefinitionByTerm = (term: string) => {
  const [data, setData] = useState<TermDefinitionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!term) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getDefinitionByTerm(term);
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Error fetching definition');
    } finally {
      setLoading(false);
    }
  }, [term]);

  return { data, loading, error, fetch };
};

/**
 * Hook para crear un término
 */
export const useCreateTerm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const create = useCallback(async (data: TermCreateRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await createTerm(data);
      setSuccess(true);
      return result;
    } catch (err: any) {
      const errorMsg = err?.message || 'Error creating term';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error, success };
};

/**
 * Hook para actualizar un término
 */
export const useUpdateTerm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const update = useCallback(async (termId: string, data: TermUpdateRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await updateTerm(termId, data);
      setSuccess(true);
      return result;
    } catch (err: any) {
      const errorMsg = err?.message || 'Error updating term';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error, success };
};

/**
 * Hook para eliminar un término
 */
export const useDeleteTerm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const removeTerm = useCallback(async (termId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await deleteTerm(termId);
      setSuccess(true);
    } catch (err: any) {
      const errorMsg = err?.message || 'Error deleting term';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { removeTerm, loading, error, success };
};

/**
 * Hook para obtener términos por categoría
 */
export const useTermsByCategory = () => {
  const [data, setData] = useState<TermsByCategoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (categoryId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTermsByCategory(categoryId);
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Error fetching terms by category');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetch };
};

/**
 * Hook para autocompletado de términos con debounce
 */
export const useTermsAutocomplete = () => {
  const [data, setData] = useState<TermAutocompleteResponse>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchTerm: string, categoryId?: string) => {
    if (!searchTerm || searchTerm.trim().length === 0) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getTermsAutocomplete(searchTerm, categoryId);
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Error searching terms');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setData([]);
    setError(null);
  }, []);

  return { data, loading, error, search, clear };
};
