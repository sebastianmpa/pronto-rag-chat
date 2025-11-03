import { useCrud } from './useCrud';
import { usePagination } from './usePagination';
import {
  getAllUsers,
  getUsersPaginated,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getMyProfile,
} from '../libs/UserService';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
} from '../types/User';
import { useState, useCallback } from 'react';

/**
 * Hook para manejar operaciones CRUD de Usuarios
 */
export const useUsers = () => {
  return useCrud<User>({
    fetchAll: getAllUsers,
    fetchById: getUserById,
    create: createUser,
    update: updateUser,
    remove: deleteUser,
  });
};

/**
 * Hook para manejar paginación de Usuarios
 */
export const useUsersPaginated = (initialPage = 1, initialLimit = 10) => {
  return usePagination<User>({
    fetchPaginated: (page, limit) => getUsersPaginated(page, limit),
    initialPage,
    initialLimit,
  });
};

/**
 * Hook para manejar el perfil del usuario autenticado
 */
export const useUserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    // Solo intenta obtener el perfil si el token existe en localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      setProfile(null);
      setError('No autenticado');
      setLoading(false);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getMyProfile();
      setProfile(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Error al obtener el perfil');
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Extract role internalName for easy access
  const roleInternalName = profile?.userProfile?.Role?.internalName ?? '';

  return { profile, loading, error, fetchProfile, roleInternalName };
};
