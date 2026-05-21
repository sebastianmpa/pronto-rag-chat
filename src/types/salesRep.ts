export interface SalesRep {
  SALESREPID: string;
  NAME: string;
  [key: string]: any;
}

export interface SalesRepSearchResponse {
  items: SalesRep[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface SalesRepSearchQueryParams {
  q: string;
  page?: number;
  limit?: number;
}
