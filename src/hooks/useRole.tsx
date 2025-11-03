import { useCrud } from './useCrud';
import { usePagination } from './usePagination';
import {
  getAllRoles,
  getRolesPaginated,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionsToRole,
  getRolePermissions,
} from '../libs/RoleService';
import {
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
  RolePermission,
} from '../types/Role';
import { useState, useCallback } from 'react';

/**
 * Hook para manejar operaciones CRUD de Roles
 */
export const useRoles = () => {
  const crud = useCrud<Role>({
    fetchAll: getAllRoles,
    fetchById: getRoleById,
    create: createRole,
    update: updateRole,
    remove: deleteRole,
  });

  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  /**
   * Asignar permisos a un rol
   */
  const assignPermissions = useCallback(
    async (roleId: string, data: AssignPermissionsDto) => {
      setPermissionsLoading(true);
      setPermissionsError(null);
      try {
        await assignPermissionsToRole(roleId, data);
        return true;
      } catch (err: any) {
        setPermissionsError(err.message || 'Error al asignar permisos');
        return false;
      } finally {
        setPermissionsLoading(false);
      }
    },
    []
  );

  /**
   * Obtener permisos de un rol
   */
  const fetchPermissions = useCallback(async (roleId: string) => {
    setPermissionsLoading(true);
    setPermissionsError(null);
    try {
      const permissions = await getRolePermissions(roleId);
      return permissions;
    } catch (err: any) {
      setPermissionsError(err.message || 'Error al obtener permisos');
      return null;
    } finally {
      setPermissionsLoading(false);
    }
  }, []);

  return {
    ...crud,
    assignPermissions,
    fetchPermissions,
    permissionsLoading,
    permissionsError,
  };
};

/**
 * Hook para manejar paginación de Roles
 */
export const useRolesPaginated = (initialPage = 1, initialLimit = 10) => {
  return usePagination<Role>({
    fetchPaginated: (page, limit) =>
      getRolesPaginated({ page, limit }),
    initialPage,
    initialLimit,
  });
};