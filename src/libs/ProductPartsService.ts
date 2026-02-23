import axiosInstance from '../interceptor/axiosInstance';
import {
  BrandsResponse,
  ModelsByBrandResponse,
  ProductPartsQueryParams,
  ModelsByBrandQueryParams,
} from '../types/productParts';

const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';

// Hardcoded brands data - DEPRECATED: Now using real API
// const HARDCODED_BRANDS: BrandsResponse = { ... };

/**
 * Get all brands with pagination
 * GET /api/product-parts/v0/brand?page=1&limit=10
 */
export const getBrands = async (params: ProductPartsQueryParams = {}): Promise<BrandsResponse> => {
  const requestParams = {
    page: params.page || 1,
    limit: params.limit || 100, // Default to 100 to get all brands
    ...(params.search && { search: params.search }),
  };

  const response = await axiosInstance.get<BrandsResponse>(
    `/product-parts/${API_VERSION_V0}/brand`,
    { params: requestParams }
  );

  return response.data;
};

/**
 * Get models by brand with pagination
 * GET /api/product-parts/v0/model/by-brand/{brand}?page=1&limit=10
 */
export const getModelsByBrand = async (params: ModelsByBrandQueryParams): Promise<ModelsByBrandResponse> => {
  const { brand, ...queryParams } = params;
  
  const requestParams = {
    page: queryParams.page || 1,
    limit: queryParams.limit || 10,
    ...(queryParams.search && { search: queryParams.search }),
  };

  const response = await axiosInstance.get<ModelsByBrandResponse>(
    `/product-parts/${API_VERSION_V0}/model/by-brand/${encodeURIComponent(brand)}`,
    { params: requestParams }
  );

  return response.data;
};

/**
 * Search brands by name
 * GET /api/product-parts/v0/brand?page=1&limit=10&search=searchTerm
 */
export const searchBrands = async (searchTerm: string, params: ProductPartsQueryParams = {}): Promise<BrandsResponse> => {
  const requestParams = {
    page: params.page || 1,
    limit: params.limit || 100,
    search: searchTerm,
  };

  const response = await axiosInstance.get<BrandsResponse>(
    `/product-parts/${API_VERSION_V0}/brand`,
    { params: requestParams }
  );

  return response.data;
};

/**
 * Search models within a brand
 */
export const searchModelsByBrand = async (
  brand: string,
  searchTerm: string,
  params: ProductPartsQueryParams = {}
): Promise<ModelsByBrandResponse> => {
  return getModelsByBrand({
    brand,
    ...params,
    search: searchTerm,
  });
};