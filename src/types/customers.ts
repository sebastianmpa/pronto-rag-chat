export interface Customer {
  CUSTOMERID: string;
  NAME: string;
  FIRSTNAME: string | null;
  LASTNAME: string | null;
  PHONE: string | null;
  EMAIL: string;
  ADDRESS1: string;
  CITY: string;
  STATE: string | null;
  ZIP: string;
  ISACTIVE: string;
  CREDITLIMIT: number;
  WARNINGNOTES: string | null;
}

export interface CustomerSearchResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: Customer[];
}

export interface CustomerSearchQueryParams {
  q: string;
  page?: number;
  limit?: number;
}