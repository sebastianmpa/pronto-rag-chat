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

// Located terms (for supervisor/location endpoints)
export interface LocatedTerm {
  id: string;
  term: string;
  definition: string;
  term_type?: string; // e.g. PARTNUMBER, SKU, etc.
  owner_id?: string | null;
  location?: string | number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocatedTermsResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: LocatedTerm[];
}

export interface TermLocatedCreateRequest {
  term: string;
  definition: string;
  term_type?: string;
}

