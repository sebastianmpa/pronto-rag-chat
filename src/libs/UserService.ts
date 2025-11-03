import axiosInstance from '../interceptor/axiosInstance';
import { User, CreateUserDto, UpdateUserDto, PaginatedUsersResponse } from '../types/User';

const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';
const API_VERSION_V1 = import.meta.env.VITE_API_VERSION_V1 || 'v1';

/**
 * Obtiene todos los usuarios (sin paginación)
 * GET /users/v0/
 */
export const getAllUsers = async (): Promise<User[]> => {
  const response = await axiosInstance.get<User[]>(`/users/${API_VERSION_V0}/`);
  return response.data;
};

/**
 * Obtiene usuarios con paginación
 * GET /users/v1/?page=1&limit=10
 */
export const getUsersPaginated = async (
  page: number,
  limit: number
): Promise<PaginatedUsersResponse> => {
  const response = await axiosInstance.get<PaginatedUsersResponse>(
    `/users/${API_VERSION_V1}/`,
    {
      params: { page, limit },
    }
  );
  return response.data;
};

/**
 * Obtiene un usuario por ID
 * GET /users/v0/:id
 */
export const getUserById = async (id: string): Promise<User> => {
  const response = await axiosInstance.get<User>(`/users/${API_VERSION_V0}/${id}`);
  return response.data;
};

/**
 * Crea un nuevo usuario
 * POST /users/v0/
 */
export const createUser = async (data: CreateUserDto): Promise<User> => {
  const response = await axiosInstance.post<User>(`/users/${API_VERSION_V0}/`, data);
  return response.data;
};

/**
 * Actualiza un usuario existente
 * PUT /users/v0/:id
 */
export const updateUser = async (id: string, data: UpdateUserDto): Promise<User> => {
  const response = await axiosInstance.put<User>(`/users/${API_VERSION_V0}/${id}`, data);
  return response.data;
};

/**
 * Elimina un usuario
 * DELETE /users/v0/:id
 */
export const deleteUser = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/users/${API_VERSION_V0}/${id}`);
};

/**
 * Obtener el perfil del usuario autenticado
 * GET /profile/v0/me
 */
export const getMyProfile = async () => {
  const response = await axiosInstance.get(`/profile/${API_VERSION_V0}/me`);
  return response.data;
};
