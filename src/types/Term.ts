export interface Term {
  id: string;
  term: string;
  definition: string;
  location: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface TermsResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: Term[];
}

export interface TermDetailResponse {
  id: string;
  term: string;
  definition: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TermCreateRequest {
  term: string;
  definition: string;
  location: string;
}

export interface TermUpdateRequest {
  term?: string;
  definition?: string;
  location?: string;
}

export interface TermDefinitionResponse {
  definition: string;
}
