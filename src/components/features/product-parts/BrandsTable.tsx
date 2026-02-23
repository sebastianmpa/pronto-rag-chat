import React, { useState } from 'react';
import { useBrands } from '../';
import { Brand } from '../../types/productParts';

interface BrandsTableProps {
  onBrandSelect?: (brand: Brand) => void;
  selectedBrandId?: string;
}

const BrandsTable: React.FC<BrandsTableProps> = ({ onBrandSelect, selectedBrandId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { brands, loading, error, totalPages, currentPage, searchBrands, clearSearch, refetch } = useBrands({
    page: 1,
    limit: 100,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      searchBrands(searchTerm.trim());
    } else {
      clearSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    clearSearch();
  };

  const handleBrandClick = (brand: Brand) => {
    if (onBrandSelect) {
      onBrandSelect(brand);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-red-600 mb-4">Error loading brands: {error}</div>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Product Brands
        </h4>
      </div>

      {/* Search Bar */}
      <div className="px-4 md:px-6 xl:px-7.5 pb-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search brands..."
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              disabled={loading}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading brands...</span>
        </div>
      )}

      {/* Brands Grid */}
      {!loading && brands.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 md:p-6 xl:p-7.5">
          {brands.map((brand) => (
            <div
              key={brand.brandId}
              onClick={() => handleBrandClick(brand)}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg
                ${selectedBrandId === brand.brandId 
                  ? 'border-primary bg-primary bg-opacity-10 shadow-md' 
                  : 'border-stroke dark:border-strokedark hover:border-primary'
                }
                bg-white dark:bg-boxdark
              `}
            >
              <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                {brand.brandName}
              </h3>
              {brand.modelsCount && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {brand.modelsCount} models available
                </p>
              )}
              {brand.description && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 line-clamp-2">
                  {brand.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && brands.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
          </svg>
          <p className="text-lg font-medium mb-2">No brands found</p>
          <p className="text-sm">
            {searchTerm ? 'Try adjusting your search criteria' : 'No brands are currently available'}
          </p>
        </div>
      )}

      {/* Pagination Info */}
      {!loading && brands.length > 0 && totalPages > 1 && (
        <div className="px-4 md:px-6 xl:px-7.5 py-4 border-t border-stroke dark:border-strokedark">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {brands.length} of {totalPages * 100} brands
          </p>
        </div>
      )}
    </div>
  );
};

export default BrandsTable;