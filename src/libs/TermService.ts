import axiosInstance from '../interceptor/axiosInstance';
import { Term, TermsResponse, TermDetailResponse, TermCreateRequest, TermUpdateRequest, TermDefinitionResponse } from '../types/Term';

const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';
const API_VERSION_V1 = import.meta.env.VITE_API_VERSION_V1 || 'v1';

/**
 * Create a new term
 * POST /terms/v0
 */
export const createTerm = async (data: TermCreateRequest): Promise<Term> => {
  const response = await axiosInstance.post(`/terms/${API_VERSION_V0}`, data);
  return response.data;
};

/**
 * Get all terms without pagination
 * GET /terms/v0/
 */
export const getAllTerms = async (): Promise<Term[]> => {
  const response = await axiosInstance.get(`/terms/${API_VERSION_V0}/`);
  return response.data;
};

/**
 * Get paginated terms
 * GET /terms/v1/?page=1&limit=10
 */
export const getTermsPaginated = async (
  page: number = 1,
  limit: number = 10,
  term?: string,
  location?: string | number,
  user_id?: string
): Promise<TermsResponse> => {
  const params: any = { page, limit };
  if (term) params.term = term;
  if (location !== undefined && location !== null) params.location = location;
  if (user_id) params.user_id = user_id;

  const response = await axiosInstance.get(`/terms/${API_VERSION_V1}/`, {
    params
  });
  return response.data;
};

/**
 * Get term by ID
 * GET /terms/v0/:id
 */
export const getTermById = async (termId: string): Promise<TermDetailResponse> => {
  const response = await axiosInstance.get(`/terms/${API_VERSION_V0}/${termId}`);
  return response.data;
};

/**
 * Get definition by term name
 * GET /terms/v0/definitions/?term=term_name
 */
export const getDefinitionByTerm = async (term: string): Promise<TermDefinitionResponse> => {
  const response = await axiosInstance.get(`/terms/${API_VERSION_V0}/definitions/`, {
    params: { term }
  });
  return response.data;
};

/**
 * Update a term
 * PUT /terms/v0/:id
 */
export const updateTerm = async (termId: string, data: TermUpdateRequest): Promise<Term> => {
  const response = await axiosInstance.put(`/terms/${API_VERSION_V0}/${termId}`, data);
  return response.data;
};

/**
 * Delete a term
 * DELETE /terms/v0/:id
 */
export const deleteTerm = async (termId: string): Promise<void> => {
  await axiosInstance.delete(`/terms/${API_VERSION_V0}/${termId}`);
};
