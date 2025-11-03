export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  RoleId?: string;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  roleId?: string;
  userName?: string;
}

export interface PaginatedUsersResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: User[];
}
