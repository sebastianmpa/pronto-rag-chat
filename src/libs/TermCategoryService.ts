import axiosInstance from '../interceptor/axiosInstance';
import { 
  TermCategory, 
  TermCategoriesResponse, 
  TermCategoryCreateRequest, 
  TermCategoryUpdateRequest 
} from '../types/TermCategory';

const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';
const API_VERSION_V1 = import.meta.env.VITE_API_VERSION_V1 || 'v1';

/**
 * Create a new term category
 * POST /terms-categories/v0
 */
export const createTermCategory = async (data: TermCategoryCreateRequest): Promise<TermCategory> => {
  const response = await axiosInstance.post(`/terms-categories/${API_VERSION_V0}`, data);
  return response.data;
};

/**
 * Get all term categories without pagination
 * GET /terms-categories/v0
 */
export const getAllTermCategories = async (): Promise<TermCategory[]> => {
  const response = await axiosInstance.get(`/terms-categories/${API_VERSION_V0}`);
  return response.data;
};

/**
 * Get paginated term categories
 * GET /terms-categories/v1/?page=1&limit=10
 */
export const getTermCategoriesPaginated = async (
  page: number = 1,
  limit: number = 10
): Promise<TermCategoriesResponse> => {
  const params = { page, limit };

  const response = await axiosInstance.get(`/terms-categories/${API_VERSION_V1}`, {
    params
  });
  return response.data;
};

/**
 * Get term category by ID
 * GET /terms-categories/v0/:id
 */
export const getTermCategoryById = async (categoryId: string): Promise<TermCategory> => {
  const response = await axiosInstance.get(`/terms-categories/${API_VERSION_V0}/${categoryId}`);
  return response.data;
};

/**
 * Update a term category
 * PUT /terms-categories/v0/:id
 */
export const updateTermCategory = async (
  categoryId: string, 
  data: TermCategoryUpdateRequest
): Promise<TermCategory> => {
  const response = await axiosInstance.put(`/terms-categories/${API_VERSION_V0}/${categoryId}`, data);
  return response.data;
};

/**
 * Delete a term category
 * DELETE /terms-categories/v0/:id
 */
export const deleteTermCategory = async (categoryId: string): Promise<void> => {
  await axiosInstance.delete(`/terms-categories/${API_VERSION_V0}/${categoryId}`);
};
