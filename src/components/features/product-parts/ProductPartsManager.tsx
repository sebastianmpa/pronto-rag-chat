import React, { useState } from 'react';
import BrandsTable from './BrandsTable';
import ModelsByBrandTable from './ModelsByBrandTable';
import { Brand, Model } from '../../../types/productParts';

interface ProductPartsManagerProps {
  className?: string;
}

const ProductPartsManager: React.FC<ProductPartsManagerProps> = ({ className = '' }) => {
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand);
    setSelectedModel(null); // Reset selected model when brand changes
  };

  const handleModelSelect = (model: Model) => {
    setSelectedModel(model);
  };

  const handleBackToBrands = () => {
    setSelectedBrand(null);
    setSelectedModel(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Breadcrumb Navigation */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <button
              onClick={handleBackToBrands}
              className={`
                inline-flex items-center text-sm font-medium hover:text-primary
                ${!selectedBrand ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}
              `}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
              </svg>
              Product Brands
            </button>
          </li>
          
          {selectedBrand && (
            <>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-primary md:ml-2">
                    {selectedBrand.brandName}
                  </span>
                </div>
              </li>
            </>
          )}
          
          {selectedModel && (
            <>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">
                    {selectedModel.modelName}
                  </span>
                </div>
              </li>
            </>
          )}
        </ol>
      </nav>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Brands Section */}
        <div className={`${selectedBrand ? 'lg:col-span-4' : 'lg:col-span-12'} transition-all duration-300`}>
          <BrandsTable
            onBrandSelect={handleBrandSelect}
            selectedBrandId={selectedBrand?.brandId}
          />
        </div>

        {/* Models Section */}
        {selectedBrand && (
          <div className="lg:col-span-8">
            <ModelsByBrandTable
              brandName={selectedBrand.brandName}
              onModelSelect={handleModelSelect}
              selectedModelId={selectedModel?.modelId}
            />
          </div>
        )}
      </div>

      {/* Selected Model Details */}
      {selectedModel && (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="py-6 px-4 md:px-6 xl:px-7.5">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Model Details: {selectedModel.modelName}
            </h4>
          </div>
          
          <div className="p-4 md:p-6 xl:p-7.5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h5 className="font-medium text-black dark:text-white mb-4">Basic Information</h5>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Model Name</label>
                  <p className="text-black dark:text-white">{selectedModel.modelName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Type</label>
                  <p className="text-black dark:text-white">{selectedModel.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Brand</label>
                  <p className="text-black dark:text-white">{selectedBrand?.brandName}</p>
                </div>
              </div>

              {/* Manuals */}
              <div className="md:col-span-2">
                <h5 className="font-medium text-black dark:text-white mb-4">
                  Available Manuals ({selectedModel.manualsCount})
                </h5>
                <div className="space-y-3">
                  {selectedModel.manuals.map((manual, index) => (
                    <div
                      key={manual.manualId}
                      className="flex items-center justify-between p-4 border border-stroke rounded-lg dark:border-strokedark"
                    >
                      <div>
                        <h6 className="font-medium text-black dark:text-white">
                          Manual {index + 1}
                        </h6>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          PDF Document
                        </p>
                      </div>
                      <button
                        onClick={() => window.open(manual.downloadLink, '_blank')}
                        className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
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
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPartsManager;