export interface Manual {
  manualId: string;
  downloadLink: string;
  serial_number?: string;
}

export interface Model {
  modelId: string;
  modelName: string;
  manualsCount: number;
  type: string;
  serie?: string;
  manuals: Manual[];
}

export interface ModelsByBrandResponse {
  brand: string;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  models: Model[];
}

export interface Brand {
  id: string;
  name: string;
  internal_name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface BrandsResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: Brand[];
}

export interface ProductPartsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ModelsByBrandQueryParams extends ProductPartsQueryParams {
  brand: string;
}