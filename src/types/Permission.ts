// Interface principal de Permission
export interface Permission {
  id: string;
  name: string;
  internalName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// DTO para crear un permiso
export interface CreatePermissionDto {
  name: string;
  internalName: string;
  description: string;
}

// DTO para actualizar un permiso
export interface UpdatePermissionDto {
  name?: string;
  internalName?: string;
  description?: string;
}

// Response paginada de permisos
export interface PaginatedPermissionsResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: Permission[];
}
