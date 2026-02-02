import { useMemo, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useTable,
  useSortBy,
  useGlobalFilter,
  useFilters,
  usePagination,
  Column,
} from 'react-table';
import { usePermissionsPaginated, usePermissions } from '../../../hooks/usePermission';
import { Permission } from '../../../types/Permission';
import CreatePermissionModal from './CreatePermissionModal';
import EditPermissionModal from './EditPermissionModal';
import DeletePermissionModal from './DeletePermissionModal';

const PermissionsTable = () => {
  const {
    data: permissionsData,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    loadPage,
    nextPage,
    previousPage,
    changeLimit,
    canNextPage: canGoNext,
    canPreviousPage: canGoPrev,
    limit,
  } = usePermissionsPaginated(1, 10);

  const { remove } = usePermissions();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPermissionId, setSelectedPermissionId] = useState<string | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadPage(1);
  }, []);

  const { t } = useTranslation();
  // Definir columnas de la tabla
  const columns: Column<Permission>[] = useMemo(
    () => [
      {
        Header: t('permissions.table.name'),
        accessor: 'name',
      },
      {
        Header: t('permissions.table.internal_name'),
        accessor: 'internalName',
      },
      {
        Header: t('permissions.table.description'),
        accessor: 'description',
        Cell: ({ value }: { value: string }) => (
          <div className="max-w-xs truncate" title={value}>
            {value}
          </div>
        ),
      },
      {
        Header: t('permissions.table.created_at'),
        accessor: 'createdAt',
        Cell: ({ value }: { value: string }) => (
          <span>
            {new Date(value).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        ),
      },
      {
        Header: t('permissions.table.actions'),
        accessor: 'id',
        Cell: ({ value }: { value: string }) => (
          <div className="flex items-center space-x-3.5">
            {/* Edit Button (styled) */}
            <button
              ref={(el) => {
                if (el && selectedPermissionId === value) {
                  editButtonRef.current = el;
                }
              }}
              className="p-2 rounded-md bg-white dark:bg-boxdark-2 text-primary hover:bg-primary hover:text-white shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary"
              title={t('permissions.table.edit')}
              onClick={() => handleEdit(value)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21v-3.75L14.81 5.44a1 1 0 0 1 1.414 0l2.34 2.34a1 1 0 0 1 0 1.414L6.75 21H3z" />
                <path d="M14.06 3.94l2 2" />
              </svg>
            </button>

            {/* Delete Button (styled) */}
            <button
              ref={(el) => {
                if (el && selectedPermissionId === value) {
                  deleteButtonRef.current = el;
                }
              }}
              className="p-2 rounded-md bg-white dark:bg-boxdark-2 text-danger hover:bg-danger hover:text-white shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-danger"
              title={t('permissions.table.delete')}
              onClick={() => handleDelete(value)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        ),
      },
    ],
    [t, selectedPermissionId]
  );

  const data = useMemo(() => permissionsData, [permissionsData]);

  const tableInstance = useTable<Permission>(
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

  // Handlers
  const handleView = (id: string) => {
    console.log('Ver permiso:', id);
    // TODO: Implementar vista de detalles
  };

  const handleEdit = (id: string) => {
    console.log('🔵 Botón Editar clickeado, ID:', id);
    setSelectedPermissionId(id);
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    const permission = permissionsData.find((p) => p.id === id);
    if (permission) {
      setSelectedPermissionId(id);
      setSelectedPermission(permission);
      setTimeout(() => {
        setShowDeleteModal(true);
      }, 50);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSelectedPermissionId(null);
    setSelectedPermission(null);
  };

  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleCreateSuccess = async () => {
    // Recargar la primera página después de crear
    await loadPage(1);
  };

  const handleEditSuccess = async () => {
    // Recargar la página actual después de editar
    await loadPage(currentPage);
  };

  // Loading inicial
  if (loading && permissionsData.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <section className="data-table-common data-table-two rounded-sm border border-stroke bg-white py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Header con título, búsqueda y botón crear */}
        <div className="flex flex-col gap-4 border-b border-stroke px-8 pb-4 dark:border-strokedark md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-black dark:text-white">{t('sidebar.permissions')}</h2>
          </div>

          <div className="w-full md:w-1/2">
            <input
              type="text"
              value={globalFilter || ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full rounded-md border border-stroke px-5 py-2.5 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary"
              placeholder={t('permissions.table.search_placeholder')}
            />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center font-medium">
              <select
                value={limit}
                onChange={(e) => changeLimit(Number(e.target.value))}
                className="rounded-md border border-stroke bg-transparent px-3 py-2 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4"
              >
                {[5, 10, 20, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
              <p className="pl-2 text-black dark:text-white">{t('permissions.table.records_per_page')}</p>
            </div>

            <button
              ref={createButtonRef}
              onClick={handleCreate}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
            >
              <svg
                className="fill-current"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 7H9V1C9 0.4 8.6 0 8 0C7.4 0 7 0.4 7 1V7H1C0.4 7 0 7.4 0 8C0 8.6 0.4 9 1 9H7V15C7 15.6 7.4 16 8 16C8.6 16 9 15.6 9 15V9H15C15.6 9 16 8.6 16 8C16 7.4 15.6 7 15 7Z"
                  fill=""
                />
              </svg>
              {t('permissions.table.create_permission')}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
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
            <p className="text-sm font-medium text-danger">{error}</p>
          </div>
        )}

        {/* Tabla */}
        <div className="relative">
          {loading && (
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
                        <span>{column.render('Header')}</span>

                        <div className="ml-2 inline-flex flex-col space-y-[2px]">
                          <span className="inline-block">
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
                          <span className="inline-block">
                            <svg
                              className="fill-current"
                              width="10"
                              height="5"
                              viewBox="0 0 10 5"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M5 5L10 0L-4.37114e-07 8.74228e-07L5 5Z"
                                fill=""
                              />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {page.length > 0 ? (
                page.map((row, key) => {
                  prepareRow(row);
                  return (
                    <tr {...row.getRowProps()} key={key}>
                      {row.cells.map((cell, key) => {
                        return (
                          <td {...cell.getCellProps()} key={key}>
                            {cell.render('Cell')}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={columns.length} className="py-8 text-center">
                    <p className="text-sm text-bodydark">{t('permissions.table.no_permissions')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer con paginación */}
        <div className="flex flex-col justify-between gap-4 border-t border-stroke px-8 pt-5 dark:border-strokedark sm:flex-row sm:items-center">
          <p className="font-medium">
            {t('permissions.table.pagination', { currentPage, totalPages, totalItems })}
          </p>
          <div className="flex gap-2">
            <button
              className="flex cursor-pointer items-center justify-center rounded-md p-1 px-2 hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => previousPage()}
              disabled={!canGoPrev || loading}
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
              {t('permissions.table.page')} {currentPage}
            </span>

            <button
              className="flex cursor-pointer items-center justify-center rounded-md p-1 px-2 hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => nextPage()}
              disabled={!canGoNext || loading}
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
      </section>

      {/* Modals */}
      {showCreateModal && (
        <CreatePermissionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
          trigger={createButtonRef}
        />
      )}
      {showEditModal && (
        <EditPermissionModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPermissionId(null);
          }}
          onSuccess={handleEditSuccess}
          trigger={editButtonRef}
          permissionId={selectedPermissionId}
        />
      )}
      {showDeleteModal && selectedPermission && (
        <DeletePermissionModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onSuccess={async () => {
            await loadPage(currentPage);
            handleDeleteCancel();
          }}
          trigger={deleteButtonRef}
          permission={selectedPermission}
        />
      )}
    </>
  );
};

export default PermissionsTable;
