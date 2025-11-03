/**
 * Interfaz para un Rol
 */
export interface Role {
  id: string;
  name: string;
  internalName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Interfaz para crear un nuevo Rol
 */
export interface CreateRoleDto {
  name: string;
  description: string;
  internalName: string;
}

/**
 * Interfaz para actualizar un Rol
 */
export interface UpdateRoleDto {
  name?: string;
  internalName?: string;
  description?: string;
}

/**
 * Interfaz para asignar permisos a un Rol
 */
export interface AssignPermissionsDto {
  permissionIds: string[];
}

/**
 * Interfaz para la respuesta paginada de Roles
 */
export interface PaginatedRolesResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: Role[];
}

/**
 * Interfaz para los permisos de un Rol
 */
export interface RolePermission {
  id: string;
  name: string;
  internalName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  role_permissions: {
    createdAt: string;
    updatedAt: string;
    PermissionId: string;
    RoleId: string;
  };
}

/**
 * Parámetros de paginación para listar Roles
 */
export interface RolePaginationParams {
  page?: number;
  limit?: number;
}