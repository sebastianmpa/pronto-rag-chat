import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useTable,
  useSortBy,
  useGlobalFilter,
  useFilters,
  usePagination,
} from 'react-table';
import { useBrands } from '../../../hooks/useBrands';
import { useModelsByBrand } from '../../../hooks/useModelsByBrand';
import { Brand, Model } from '../../../types/productParts';

const ProductPartsTable = () => {
  const { t } = useTranslation();
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Load brands for the dropdown
  const {
    brands,
    loading: brandsLoading,
    error: brandsError,
    refetch: refetchBrands,
  } = useBrands({ page: 1, limit: 100 });

  // Load models/parts for selected brand
  const {
    models,
    loading: modelsLoading,
    error: modelsError,
    totalPages,
    totalItems,
    currentPage,
    searchModels,
    clearSearch,
    changePage,
    refetch: refetchModels,
  } = useModelsByBrand(selectedBrand?.name || '', { page: 1, limit: 20 });

  // Load brands on component mount
  useEffect(() => {
    refetchBrands();
  }, []);

  // Load models when brand is selected
  useEffect(() => {
    if (selectedBrand?.name) {
      refetchModels();
    }
  }, [selectedBrand]);

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandId = e.target.value;
    if (brandId) {
      const brand = brands.find(b => b.id === brandId);
      setSelectedBrand(brand || null);
      setSearchTerm('');
      clearSearch();
    } else {
      setSelectedBrand(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() && selectedBrand?.name) {
      searchModels(searchTerm.trim());
    } else {
      clearSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    clearSearch();
  };

  const handleDownloadManual = (downloadLink: string) => {
    window.open(downloadLink, '_blank');
  };

  const toggleRowExpansion = (modelId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(modelId)) {
      newExpandedRows.delete(modelId);
    } else {
      newExpandedRows.add(modelId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      changePage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      changePage(currentPage + 1);
    }
  };

  // Define columns for the table
  const columns: any[] = useMemo(
    () => [
      {
        Header: t('productParts.table.model_name'),
        accessor: 'modelName',
      },
      {
        Header: t('productParts.table.serie'),
        accessor: 'serie',
        Cell: ({ value }: { value: string }) => (
          <span className="text-black dark:text-white">
            {value || 'N/A'}
          </span>
        ),
      },
      {
        Header: t('productParts.table.type'),
        accessor: 'type',
        Cell: ({ value }: { value: string }) => (
          <span className="inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium bg-success text-success">
            {value || 'N/A'}
          </span>
        ),
      },
      {
        Header: t('productParts.table.manuals_count'),
        accessor: 'manualsCount',
        Cell: ({ value }: { value: number }) => (
          <span className="text-black dark:text-white">
            {value || 0} {value === 1 ? 'manual' : 'manuals'}
          </span>
        ),
      },
      {
        Header: t('productParts.table.view'),
        accessor: 'view',
        width: 80,
        Cell: ({ row }: { row: { original: Model } }) => (
          <button
            onClick={() => toggleRowExpansion(row.original.modelId)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary"
            title={expandedRows.has(row.original.modelId) ? 'Collapse' : 'Expand'}
          >
            <svg
              className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
                expandedRows.has(row.original.modelId) ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ),
      },
    ],
    [t, expandedRows]
  );

  const data = useMemo(() => models || [], [models]);

  const tableInstance = useTable<Model>(
    {
      columns,
      data,
      manualPagination: true,
      pageCount: totalPages,
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    state,
    setGlobalFilter,
  } = tableInstance;

  const { globalFilter } = state;

  // Loading inicial
  if (brandsLoading && brands.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <section className="data-table-common data-table-two rounded-sm border border-stroke bg-white py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* Header con título, selector de brand y búsqueda */}
      <div className="flex flex-col gap-4 border-b border-stroke px-8 pb-4 dark:border-strokedark md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-black dark:text-white">
            {t('productParts.table.title')} {selectedBrand ? `- ${selectedBrand.name}` : ''}
          </h2>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Brand Selector */}
          <select
            value={selectedBrand?.id || ''}
            onChange={handleBrandChange}
            disabled={brandsLoading}
            className="rounded-md border border-stroke bg-transparent px-3 py-2 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4"
          >
            <option value="">
              {brandsLoading ? t('productParts.table.loading_brands') : t('productParts.table.select_brand')}
            </option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>

          {/* Search Bar - Only show when brand is selected */}
          {selectedBrand && (
            <div className="w-full md:w-1/2">
              <input
                type="text"
                value={globalFilter || ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full rounded-md border border-stroke px-5 py-2.5 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary"
                placeholder={t('productParts.table.search_placeholder')}
              />
            </div>
          )}

          <div className="flex items-center font-medium">
            <p className="text-black dark:text-white">
              {selectedBrand && totalItems > 0 ? `${totalItems} ${totalItems === 1 ? 'model' : 'models'}` : t('productParts.table.no_models')}
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {(brandsError || modelsError) && (
        <div className="mx-8 mt-4 flex items-center gap-3 rounded-md border border-danger bg-danger bg-opacity-10 p-4">
          <svg
            className="fill-current text-danger"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11 0C4.92487 0 0 4.92487 0 11C0 17.0751 4.92487 22 11 22C17.0751 22 22 17.0751 22 11C22 4.92487 17.0751 0 11 0ZM11 16.5C10.4477 16.5 10 16.0523 10 15.5C10 14.9477 10.4477 14.5 11 14.5C11.5523 14.5 12 14.9477 12 15.5C12 16.0523 11.5523 16.5 11 16.5ZM12 12.5C12 13.0523 11.5523 13.5 11 13.5C10.4477 13.5 10 13.0523 10 12.5V6.5C10 5.94772 10.4477 5.5 11 5.5C11.5523 5.5 12 5.94772 12 6.5V12.5Z"
              fill=""
            />
          </svg>
          <p className="text-sm font-medium text-danger">
            {brandsError || modelsError}
          </p>
        </div>
      )}

      {/* No Brand Selected State */}
      {!brandsLoading && !selectedBrand && (
        <div className="flex flex-col items-center justify-center p-16 text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-lg font-medium mb-2">{t('productParts.table.select_brand_message')}</p>
          <p className="text-sm text-center">{t('productParts.table.select_brand_description')}</p>
        </div>
      )}

      {/* Tabla - Solo mostrar cuando hay brand seleccionada */}
      {selectedBrand && (
        <div className="relative">
          {modelsLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75 dark:bg-boxdark dark:bg-opacity-75">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
          )}

          <table
            {...getTableProps()}
            className="datatable-table w-full table-auto border-collapse overflow-hidden break-words px-4 md:table-fixed md:overflow-auto md:px-8"
          >
            <thead>
              {headerGroups.map((headerGroup, key) => (
                <tr {...headerGroup.getHeaderGroupProps()} key={key}>
                  {headerGroup.headers.map((column, key) => (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      key={key}
                    >
                      <div className="flex items-center">
                        <span>
                          {column.render('Header')}
                        </span>
                        {column.canSort && (
                          <div className="ml-2 inline-flex flex-col space-y-[2px]">
                            <span className="duration-200 ease-in-out text-gray-500 hover:text-black dark:text-bodydark dark:hover:text-white">
                              <svg
                                className="fill-current"
                                width="10"
                                height="5"
                                viewBox="0 0 10 5"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M5 0L0 5H10L5 0Z" fill="" />
                              </svg>
                            </span>
                            <span className="duration-200 ease-in-out text-gray-500 hover:text-black dark:text-bodydark dark:hover:text-white">
                              <svg
                                className="fill-current"
                                width="10"
                                height="5"
                                viewBox="0 0 10 5"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M5 5L10 0H0L5 5Z" fill="" />
                              </svg>
                            </span>
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {page.length > 0 ? (
                page.map((row, rowIndex) => {
                  prepareRow(row);
                  const isExpanded = expandedRows.has(row.original.modelId);
                  return (
                    <React.Fragment key={row.original.modelId}>
                      {/* Main row */}
                      <tr {...row.getRowProps()} className="hover:bg-gray-50 dark:hover:bg-meta-4">
                        {row.cells.map((cell, cellKey) => {
                          return (
                            <td
                              {...cell.getCellProps()}
                              key={cellKey}
                              className="border-b border-[#eee] py-4 px-4 dark:border-strokedark"
                            >
                              {cell.render('Cell')}
                            </td>
                          );
                        })}
                      </tr>
                      {/* Expanded row with manuals */}
                      {isExpanded && row.original.manuals && row.original.manuals.length > 0 && (
                        <tr>
                          <td colSpan={columns.length} className="border-b border-[#eee] py-0 px-4 dark:border-strokedark">
                            <div className="bg-gray-50 dark:bg-boxdark-2 rounded-lg p-4 m-2">
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                {t('productParts.table.available_manuals')} ({row.original.manuals.length})
                              </h4>
                              <div className="space-y-2">
                                {row.original.manuals.map((manual, manualIndex) => (
                                  <div
                                    key={manual.manualId}
                                    className="flex items-center justify-between p-3 bg-white dark:bg-boxdark rounded-md border border-stroke dark:border-strokedark"
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium text-black dark:text-white">
                                        Manual #{manualIndex + 1}
                                      </span>
                                      <span className="text-xs text-gray-600 dark:text-gray-400">
                                        {t('productParts.table.serial_number')}: {manual.serial_number || 'N/A'}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => handleDownloadManual(manual.downloadLink)}
                                      className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                      title={t('productParts.table.download_manual')}
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      {t('productParts.table.download')}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={columns.length} className="py-8 text-center">
                    <p className="text-sm text-bodydark">
                      {searchTerm ? t('productParts.table.no_models') + ' - ' + t('productParts.table.try_adjusting_search') : t('productParts.table.no_models_for_brand', { brand: selectedBrand.name })}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer con paginación - Solo cuando hay models */}
      {selectedBrand && models && models.length > 0 && (
        <div className="flex flex-col justify-between gap-4 border-t border-stroke px-8 pt-5 dark:border-strokedark sm:flex-row sm:items-center">
          <p className="font-medium">
            {t('productParts.table.showing_models', { count: models.length, total: totalItems, currentPage, totalPages })}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousPage}
              className="flex cursor-pointer items-center justify-center rounded-md p-1 px-2 hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={currentPage <= 1 || modelsLoading}
            >
              <svg
                className="fill-current"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.1777 16.1156C12.009 16.1156 11.8402 16.0593 11.7277 15.9187L5.37148 9.44995C5.11836 9.19683 5.11836 8.80308 5.37148 8.54995L11.7277 2.0812C11.9809 1.82808 12.3746 1.82808 12.6277 2.0812C12.8809 2.33433 12.8809 2.72808 12.6277 2.9812L6.72148 8.99995L12.6559 15.0187C12.909 15.2718 12.909 15.6656 12.6559 15.9187C12.4871 16.0312 12.3465 16.1156 12.1777 16.1156Z"
                  fill=""
                />
              </svg>
            </button>

            <span className="flex items-center px-2 font-medium">
              {t('productParts.table.page')} {currentPage}
            </span>

            <button
              onClick={handleNextPage}
              className="flex cursor-pointer items-center justify-center rounded-md p-1 px-2 hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={currentPage >= totalPages || modelsLoading}
            >
              <svg
                className="fill-current"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.82148 16.1156C5.65273 16.1156 5.51211 16.0593 5.37148 15.9468C5.11836 15.6937 5.11836 15.3 5.37148 15.0468L11.2777 8.99995L5.37148 2.9812C5.11836 2.72808 5.11836 2.33433 5.37148 2.0812C5.62461 1.82808 6.01836 1.82808 6.27148 2.0812L12.6277 8.54995C12.8809 8.80308 12.8809 9.19683 12.6277 9.44995L6.27148 15.9187C6.15898 16.0312 5.99023 16.1156 5.82148 16.1156Z"
                  fill=""
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductPartsTable;