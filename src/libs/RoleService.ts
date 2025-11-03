import axiosInstance from '../interceptor/axiosInstance';
import {
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
  PaginatedRolesResponse,
  RolePermission,
  RolePaginationParams,
} from '../types/Role';

const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';
const API_VERSION_V1 = import.meta.env.VITE_API_VERSION_V1 || 'v1';

/**
 * Obtener todos los roles (sin paginación)
 * GET /api/roles/v0/
 */
export const getAllRoles = async (): Promise<Role[]> => {
  const response = await axiosInstance.get<Role[]>(`/roles/${API_VERSION_V0}/`);
  return response.data;
};

/**
 * Obtener roles con paginación
 * GET /api/roles/v1/?page=1&limit=10
 */
export const getRolesPaginated = async (
  params: RolePaginationParams = {}
): Promise<PaginatedRolesResponse> => {
  const { page = 1, limit = 10 } = params;
  const response = await axiosInstance.get<PaginatedRolesResponse>(
    `/roles/${API_VERSION_V1}/`,
    {
      params: { page, limit },
    }
  );
  return response.data;
};

/**
 * Obtener un rol por ID
 * GET /api/roles/v0/:id
 */
export const getRoleById = async (roleId: string): Promise<Role> => {
  const response = await axiosInstance.get<Role>(
    `/roles/${API_VERSION_V0}/${roleId}`
  );
  return response.data;
};

/**
 * Crear un nuevo rol
 * POST /api/roles/v0/
 */
export const createRole = async (data: CreateRoleDto): Promise<Role> => {
  const response = await axiosInstance.post<Role>(
    `/roles/${API_VERSION_V0}/`,
    data
  );
  return response.data;
};

/**
 * Actualizar un rol
 * PUT /api/roles/v0/:id
 */
export const updateRole = async (
  roleId: string,
  data: UpdateRoleDto
): Promise<Role> => {
  const response = await axiosInstance.put<Role>(
    `/roles/${API_VERSION_V0}/${roleId}`,
    data
  );
  return response.data;
};

/**
 * Eliminar un rol
 * DELETE /api/roles/v0/:id
 */
export const deleteRole = async (roleId: string): Promise<void> => {
  await axiosInstance.delete(`/roles/${API_VERSION_V0}/${roleId}`);
};

/**
 * Asignar permisos a un rol
 * POST /api/roles/v0/:id/permissions
 */
export const assignPermissionsToRole = async (
  roleId: string,
  data: AssignPermissionsDto
): Promise<void> => {
  await axiosInstance.post(
    `/roles/${API_VERSION_V0}/${roleId}/permissions`,
    data
  );
};

/**
 * Obtener los permisos de un rol
 * GET /api/roles/v0/:id/permissions
 */
export const getRolePermissions = async (
  roleId: string
): Promise<RolePermission[]> => {
  const response = await axiosInstance.get<RolePermission[]>(
    `/roles/${API_VERSION_V0}/${roleId}/permissions`
  );
  return response.data;
};