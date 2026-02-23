import React, { useState } from 'react';
import { useModelsByBrand } from '../../../hooks/useModelsByBrand';
import { Model } from '../../../types/productParts';

interface ModelsByBrandTableProps {
  brandName: string;
  onModelSelect?: (model: Model) => void;
  selectedModelId?: string;
}

const ModelsByBrandTable: React.FC<ModelsByBrandTableProps> = ({ 
  brandName, 
  onModelSelect, 
  selectedModelId 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { 
    models, 
    loading, 
    error, 
    totalPages, 
    totalItems,
    currentPage, 
    searchModels, 
    clearSearch, 
    changePage, 
    refetch 
  } = useModelsByBrand(brandName, {
    page: 1,
    limit: 10,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      searchModels(searchTerm.trim());
    } else {
      clearSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    clearSearch();
  };

  const handleModelClick = (model: Model) => {
    if (onModelSelect) {
      onModelSelect(model);
    }
  };

  const downloadManual = (downloadLink: string, modelName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(downloadLink, '_blank');
  };

  if (!brandName) {
    return (
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Product Models
          </h4>
        </div>
        <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
          <p className="text-lg">Select a brand to view its models</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {brandName} Models
          </h4>
        </div>
        <div className="flex flex-col items-center justify-center p-8">
          <div className="text-red-600 mb-4">Error loading models: {error}</div>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          {brandName} Models ({totalItems} total)
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
              placeholder="Search models..."
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
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading models...</span>
        </div>
      )}

      {/* Models Table */}
      {!loading && models.length > 0 && (
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                  Model Name
                </th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                  Type
                </th>
                <th className="min-w-[100px] py-4 px-4 font-medium text-black dark:text-white">
                  Manuals
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr 
                  key={model.modelId}
                  onClick={() => handleModelClick(model)}
                  className={`
                    cursor-pointer transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-meta-4
                    ${selectedModelId === model.modelId ? 'bg-primary bg-opacity-10' : ''}
                  `}
                >
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <h5 className="font-medium text-black dark:text-white">
                      {model.modelName}
                    </h5>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <span className="inline-flex rounded-full bg-success bg-opacity-10 py-1 px-3 text-sm font-medium text-success">
                      {model.type}
                    </span>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <span className="text-black dark:text-white">
                      {model.manualsCount} manual{model.manualsCount !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <div className="flex items-center space-x-3.5">
                      {model.manuals.map((manual, index) => (
                        <button
                          key={manual.manualId}
                          onClick={(e) => downloadManual(manual.downloadLink, model.modelName, e)}
                          className="p-2 rounded-md bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
                          aria-label={`Download manual ${index + 1} for ${model.modelName}`}
                          title={`Download Manual ${index + 1}`}
                        >
                          <svg
                            className="w-4 h-4 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && models.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium mb-2">No models found</p>
          <p className="text-sm">
            {searchTerm 
              ? `No models found for "${searchTerm}" in ${brandName}` 
              : `No models available for ${brandName}`
            }
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && models.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 md:px-6 xl:px-7.5 py-4 border-t border-stroke dark:border-strokedark">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span>
              Page {currentPage} of {totalPages} ({totalItems} total items)
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = Math.max(1, currentPage - 2) + i;
              if (pageNumber > totalPages) return null;
              
              return (
                <button
                  key={pageNumber}
                  onClick={() => changePage(pageNumber)}
                  className={`
                    px-3 py-1 rounded-md transition-colors
                    ${pageNumber === currentPage 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            <button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelsByBrandTable;