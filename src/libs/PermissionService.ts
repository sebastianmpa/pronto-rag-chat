import axiosInstance from '../interceptor/axiosInstance';
import {
  Permission,
  CreatePermissionDto,
  UpdatePermissionDto,
  PaginatedPermissionsResponse,
} from '../types/Permission';

const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';
const API_VERSION_V1 = import.meta.env.VITE_API_VERSION_V1 || 'v1';

/**
 * Obtiene todos los permisos (sin paginación)
 * GET /api/permissions/v0/
 */
export const getAllPermissions = async (): Promise<Permission[]> => {
  const response = await axiosInstance.get<Permission[]>(`/permissions/${API_VERSION_V0}/`);
  return response.data;
};

/**
 * Obtiene permisos con paginación
 * GET /api/permissions/v1/?page=1&limit=10
 */
export const getPermissionsPaginated = async (
  page: number,
  limit: number
): Promise<PaginatedPermissionsResponse> => {
  const response = await axiosInstance.get<PaginatedPermissionsResponse>(
    `/permissions/${API_VERSION_V1}/`,
    {
      params: { page, limit },
    }
  );
  return response.data;
};

/**
 * Obtiene un permiso por ID
 * GET /api/permissions/v0/:id
 */
export const getPermissionById = async (id: string): Promise<Permission> => {
  const response = await axiosInstance.get<Permission>(`/permissions/${API_VERSION_V0}/${id}`);
  return response.data;
};

/**
 * Crea un nuevo permiso
 * POST /api/permissions/v0/
 */
export const createPermission = async (
  data: CreatePermissionDto
): Promise<Permission> => {
  const response = await axiosInstance.post<Permission>(`/permissions/${API_VERSION_V0}/`, data);
  return response.data;
};

/**
 * Actualiza un permiso existente
 * PUT /api/permissions/v0/:id
 */
export const updatePermission = async (
  id: string,
  data: UpdatePermissionDto
): Promise<Permission> => {
  const response = await axiosInstance.put<Permission>(
    `/permissions/${API_VERSION_V0}/${id}`,
    data
  );
  return response.data;
};

/**
 * Elimina un permiso
 * DELETE /api/permissions/v0/:id
 */
export const deletePermission = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/permissions/${API_VERSION_V0}/${id}`);
};
