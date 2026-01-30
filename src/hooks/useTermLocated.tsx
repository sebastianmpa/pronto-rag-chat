import { useState, useCallback } from 'react';
import { LocatedTerm, LocatedTermsResponse, TermLocatedCreateRequest } from '../types/Term';
import { createLocatedTermV0, getLocatedV0, getLocatedV1Paginated, getLocatedByIdV0 } from '../libs/TermLocatedService';

export const useCreateLocatedTerm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const create = useCallback(async (data: TermLocatedCreateRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await createLocatedTermV0(data);
      setSuccess(true);
      return result;
    } catch (err: any) {
      setError(err?.message || 'Error creating located term');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error, success };
};

export const useLocatedV0 = (term?: string) => {
  const [data, setData] = useState<LocatedTerm[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLocatedV0(term);
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Error fetching located terms (v0)');
    } finally {
      setLoading(false);
    }
  }, [term]);

  return { data, loading, error, fetch };
};

export const useLocatedV1Paginated = (
  page: number = 1,
  limit: number = 10,
  owned?: boolean,
  user_id?: string,
  term?: string
) => {
  const [data, setData] = useState<LocatedTermsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLocatedV1Paginated(page, limit, owned, user_id, term);
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Error fetching located terms (v1)');
    } finally {
      setLoading(false);
    }
  }, [page, limit, owned, user_id, term]);

  return { data, loading, error, fetch };
};

export const useLocatedByIdV0 = (id?: string) => {
  const [data, setData] = useState<LocatedTerm | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getLocatedByIdV0(id);
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Error fetching located term by id');
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { data, loading, error, fetch };
};
