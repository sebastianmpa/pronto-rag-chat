export interface TermCategory {
  id: string;
  category_name: string;
  internal_category_name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TermCategoriesResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: TermCategory[];
}

export interface TermCategoryCreateRequest {
  category_name: string;
}

export interface TermCategoryUpdateRequest {
  category_name?: string;
}
