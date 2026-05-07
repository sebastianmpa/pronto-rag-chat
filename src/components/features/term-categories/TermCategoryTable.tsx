import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getTermCategoriesPaginated } from '../../../libs/TermCategoryService';
import { TermCategory, TermCategoriesResponse } from '../../../types/TermCategory';
import CreateTermCategoryModal from './CreateTermCategoryModal';
import EditTermCategoryModal from './EditTermCategoryModal';
import DeleteTermCategoryModal from './DeleteTermCategoryModal';

const TermCategoryTable = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [categoriesResponse, setCategoriesResponse] = useState<TermCategoriesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TermCategory | null>(null);

  const { t } = useTranslation();

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTermCategoriesPaginated(page, limit);
      setCategoriesResponse(result);
    } catch (err: any) {
      setError(err?.message || 'Error fetching term categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const handleEdit = (category: TermCategory) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleDelete = (category: TermCategory) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  return (
    <section className="data-table-common rounded-sm border border-stroke bg-white py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* Header with page title and create button */}
      <div className="px-4 py-6 md:px-6 xl:px-7.5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-black dark:text-white">
            {t('term_categories.title') || 'Categorías de Términos'}
          </h2>
        </div>

        <div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex rounded-md bg-primary px-4 py-2 text-center font-medium text-black hover:bg-opacity-90"
          >
            {t('term_categories.create') || 'Crear Categoría'}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-8">
          <span className="text-gray-500 dark:text-gray-400">{t('common.loading')}</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="px-4 py-4 md:px-6 xl:px-7.5">
          <div className="rounded-sm border border-red-500 bg-red-50 p-4 text-red-700 dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="min-w-[250px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                    {t('term_categories.table.category_name') || 'Nombre de Categoría'}
                  </th>
                  <th className="min-w-[250px] px-4 py-4 font-medium text-black dark:text-white">
                    {t('term_categories.table.internal_name') || 'Nombre Interno'}
                  </th>
                  <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                    {t('term_categories.table.created_at') || 'Creado'}
                  </th>
                  <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                    {t('term_categories.table.updated_at') || 'Actualizado'}
                  </th>
                  <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">
                    {t('term_categories.table.actions') || 'Acciones'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {categoriesResponse?.items && categoriesResponse.items.length > 0 ? (
                  categoriesResponse.items.map((category) => (
                    <tr key={category.id} className="border-b border-stroke dark:border-strokedark">
                      <td className="px-4 py-5 pl-9">
                        <p className="text-black dark:text-white font-medium">{category.category_name}</p>
                      </td>
                      <td className="px-4 py-5">
                        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-black dark:bg-primary/20 dark:text-white">
                          {category.internal_category_name}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <p className="text-black dark:text-white">
                          {new Date(category.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </td>
                      <td className="px-4 py-5">
                        <p className="text-black dark:text-white">
                          {new Date(category.updatedAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center space-x-3.5">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleEdit(category)}
                            title={t('term_categories.table.edit') || 'Editar'}
                            aria-label={t('term_categories.table.edit') || 'Editar'}
                            className="p-2 rounded-md bg-white dark:bg-boxdark-2 text-primary hover:bg-primary hover:text-black shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                              <path d="M20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.29a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                            </svg>
                          </button>

                          {/* Delete Button */}
                          <button
                            className="hover:text-danger"
                            title={t('term_categories.table.delete') || 'Eliminar'}
                            onClick={() => handleDelete(category)}
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
                                d="M13.7535 2.47502H11.5879V1.9969C11.5879 1.15315 10.9129 0.478149 10.0691 0.478149H7.90352C7.05977 0.478149 6.38477 1.15315 6.38477 1.9969V2.47502H4.21914C3.40352 2.47502 2.72852 3.15002 2.72852 3.96565V4.8094C2.72852 5.42815 3.09414 5.9344 3.62852 6.1594L4.07852 15.4688C4.13477 16.6219 5.09102 17.5219 6.24414 17.5219H11.7004C12.8535 17.5219 13.8098 16.6219 13.866 15.4688L14.3441 6.13127C14.8785 5.90627 15.2441 5.3719 15.2441 4.78127V3.93752C15.2441 3.15002 14.5691 2.47502 13.7535 2.47502ZM7.67852 1.9969C7.67852 1.85627 7.79102 1.74377 7.93164 1.74377H10.0973C10.2379 1.74377 10.3504 1.85627 10.3504 1.9969V2.47502H7.70664V1.9969H7.67852ZM4.02227 3.96565C4.02227 3.85315 4.10664 3.74065 4.24727 3.74065H13.7535C13.866 3.74065 13.9785 3.82502 13.9785 3.96565V4.8094C13.9785 4.9219 13.8941 5.0344 13.7535 5.0344H4.24727C4.13477 5.0344 4.02227 4.95002 4.02227 4.8094V3.96565ZM11.7285 16.2563H6.27227C5.79414 16.2563 5.40039 15.8906 5.37227 15.3844L4.95039 6.2719H13.0785L12.6566 15.3844C12.6004 15.8625 12.2066 16.2563 11.7285 16.2563Z"
                                fill=""
                              />
                              <path
                                d="M9.00039 9.11255C8.66289 9.11255 8.35352 9.3938 8.35352 9.75942V13.3313C8.35352 13.6688 8.63477 13.9782 9.00039 13.9782C9.33789 13.9782 9.64727 13.6969 9.64727 13.3313V9.75942C9.64727 9.3938 9.33789 9.11255 9.00039 9.11255Z"
                                fill=""
                              />
                              <path
                                d="M11.2502 9.67504C10.8846 9.64692 10.6033 9.90004 10.5752 10.2657L10.4064 12.7407C10.3783 13.0782 10.6314 13.3875 10.9971 13.4157C11.0252 13.4157 11.0252 13.4157 11.0533 13.4157C11.3908 13.4157 11.6721 13.1625 11.6721 12.825L11.8408 10.35C11.8408 9.98442 11.5877 9.70317 11.2502 9.67504Z"
                                fill=""
                              />
                              <path
                                d="M6.72245 9.67504C6.38495 9.70317 6.1037 10.0125 6.13182 10.35L6.3287 12.825C6.35683 13.1625 6.63808 13.4157 6.94745 13.4157C6.97558 13.4157 6.97558 13.4157 7.0037 13.4157C7.3412 13.3875 7.62245 13.0782 7.59433 12.7407L7.39745 10.2657C7.39745 9.90004 7.08808 9.64692 6.72245 9.67504Z"
                                fill=""
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {t('common.no_results') || 'No hay resultados'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {categoriesResponse && (
            <div className="px-4 py-5 md:px-6 xl:px-7.5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('common.page') || 'Página'} {page} {t('common.of') || 'de'} {categoriesResponse.totalPages}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 rounded border border-stroke bg-gray-2 text-black hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
                >
                  {t('common.previous') || 'Anterior'}
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {page}
                </span>
                <button
                  onClick={() => setPage(Math.min(categoriesResponse.totalPages, page + 1))}
                  disabled={page >= categoriesResponse.totalPages}
                  className="px-3 py-2 rounded border border-stroke bg-gray-2 text-black hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
                >
                  {t('common.next') || 'Siguiente'}
                </button>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded border border-stroke bg-gray-2 px-2 py-2 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
                >
                  {[10, 20, 50, 100].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreateTermCategoryModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onSuccess={() => {
          setShowCreateModal(false);
          setPage(1);
          fetchCategories();
        }}
      />

      <EditTermCategoryModal 
        isOpen={showEditModal} 
        onClose={() => {
          setShowEditModal(false);
          setSelectedCategory(null);
        }} 
        category={selectedCategory}
        onSuccess={() => {
          setShowEditModal(false);
          setSelectedCategory(null);
          fetchCategories();
        }}
      />

      <DeleteTermCategoryModal 
        isOpen={showDeleteModal} 
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCategory(null);
        }} 
        category={selectedCategory}
        onSuccess={() => {
          setShowDeleteModal(false);
          setSelectedCategory(null);
          fetchCategories();
        }}
      />
    </section>
  );
};

export default TermCategoryTable;
