import axiosInstance from '../interceptor/axiosInstance';
import { LocatedTerm, LocatedTermsResponse, TermLocatedCreateRequest } from '../types/Term';

const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';
const API_VERSION_V1 = import.meta.env.VITE_API_VERSION_V1 || 'v1';

/**
 * POST /terms/v0/located
 */
export const createLocatedTermV0 = async (data: TermLocatedCreateRequest): Promise<LocatedTerm> => {
  const response = await axiosInstance.post(`/terms/${API_VERSION_V0}/located`, data);
  return response.data;
};

/**
 * GET /terms/v0/located/?term=...
 */
export const getLocatedV0 = async (term?: string): Promise<LocatedTerm[]> => {
  const response = await axiosInstance.get(`/terms/${API_VERSION_V0}/located/`, {
    params: { term }
  });
  return response.data;
};

/**
 * GET /terms/v1/located?page=1&limit=10&owned=true&user_id=...&term=...
 */
export const getLocatedV1Paginated = async (
  page: number = 1,
  limit: number = 10,
  owned?: boolean,
  user_id?: string,
  term?: string
): Promise<LocatedTermsResponse> => {
  const params: any = { page, limit };
  if (typeof owned !== 'undefined') params.owned = owned;
  if (user_id) params.user_id = user_id;
  if (term) params.term = term;

  const response = await axiosInstance.get(`/terms/${API_VERSION_V1}/located`, { params });
  return response.data;
};

/**
 * GET single located term by id via v0 (falls back to existing term endpoints)
 */
export const getLocatedByIdV0 = async (id: string): Promise<LocatedTerm> => {
  const response = await axiosInstance.get(`/terms/${API_VERSION_V0}/${id}`);
  return response.data;
};
