import { useCrud } from './useCrud';
import { usePagination } from './usePagination';
import { Permission } from '../types/Permission';
import {
  getAllPermissions,
  getPermissionsPaginated,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
} from '../libs/PermissionService';

/**
 * Hook para operaciones CRUD de permisos sin paginación
 */
export const usePermissions = () => {
  return useCrud<Permission>({
    fetchAll: getAllPermissions,
    fetchById: getPermissionById,
    create: createPermission,
    update: updatePermission,
    remove: deletePermission,
  });
};

/**
 * Hook para permisos con paginación
 */
export const usePermissionsPaginated = (
  initialPage: number = 1,
  initialLimit: number = 10
) => {
  return usePagination<Permission>({
    fetchPaginated: getPermissionsPaginated,
    initialPage,
    initialLimit,
  });
};
