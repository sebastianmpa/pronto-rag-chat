export interface Term {
  id: string;
  term: string;
  definition: string;
  term_type?: string;
  location: string;
  term_category_id?: string;
  // optional creator info (may be provided by the API)
  term_user?: {
    firstName?: string;
    first_name?: string;
    lastName?: string;
    last_name?: string;
    name?: string;
    email?: string;
    username?: string;
  };
  user_id?: string;
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
  term_type?: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TermCreateRequest {
  term: string;
  definition: string;
  term_type: string;
  location?: string;
  term_category_id?: string;
}

export interface TermUpdateRequest {
  term?: string;
  definition?: string;
  location?: string;
  term_type?: string;
  term_category_id?: string;
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
  term_category_id?: string;
  owner_id?: string | null;
  term_user?: {
    firstName?: string;
    first_name?: string;
    lastName?: string;
    last_name?: string;
    name?: string;
    email?: string;
    username?: string;
  };
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
  term_type: string;
}

export interface ServerValidationError {
  campo: string;
  mensaje: string;
}

export interface ValidationErrorResponse {
  errors: ServerValidationError[];
}

// Terms by category
export interface TermByCategory {
  id: string;
  term_category_id: string;
  term: string;
  term_type: 'PARTNUMBER' | 'GENERIC' | 'TECHNICAL' | 'COMMERCIAL';
  normalized_term: string;
  definition: string;
  user_id: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type TermsByCategoryResponse = TermByCategory[];

// Term autocomplete
export interface TermAutocomplete {
  id: string;
  term: string;
  term_category_id: string;
  normalized_term: string;
  definition?: string;
}

export type TermAutocompleteResponse = TermAutocomplete[];

