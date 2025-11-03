import { useMemo, useEffect, useState, useRef } from 'react';
import {
  useTable,
  useSortBy,
  useGlobalFilter,
  useFilters,
  usePagination,
  Column,
} from 'react-table';
import { useRolesPaginated, useRoles } from '../../../hooks/useRole';
import { Role } from '../../../types/Role';
import CreateRoleModal from './CreateRoleModal';
import EditRoleModal from './EditRoleModal';
import DeleteRoleModal from './DeleteRoleModal';

const RoleTable = () => {
  const {
    data: rolesData,
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
  } = useRolesPaginated(1, 10);

  const { remove } = useRoles();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  // Load data on component mount
  useEffect(() => {
    loadPage(1);
  }, []);

  // Define table columns
  const columns: Column<Role>[] = useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name',
      },
      {
        Header: 'Internal Name',
        accessor: 'internalName',
      },
      {
        Header: 'Description',
        accessor: 'description',
        Cell: ({ value }: { value: string }) => (
          <div className="max-w-xs truncate" title={value}>
            {value}
          </div>
        ),
      },
      {
        Header: 'Created At',
        accessor: 'createdAt',
        Cell: ({ value }: { value: string }) => (
          <span>
            {new Date(value).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        ),
      },
      {
        Header: 'Actions',
        accessor: 'id',
        Cell: ({ value }: { value: string }) => (
          <div className="flex items-center space-x-3.5">
            {/* Edit Button (Pencil with shadow) */}
            <button
              ref={(el) => {
                if (el && selectedRoleId === value) {
                  editButtonRef.current = el;
                }
              }}
              className="hover:text-primary"
              title="Edit"
              onClick={() => handleEdit(value)}
            >
              {/* Pencil icon SVG (with shadow) - same as PermissionsTable */}
              <svg
                className="fill-current"
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.414 2.586a2 2 0 0 0-2.828 0l-9.9 9.9a1 1 0 0 0-.263.465l-1.5 5.25a1 1 0 0 0 1.236 1.236l5.25-1.5a1 1 0 0 0 .465-.263l9.9-9.9a2 2 0 0 0 0-2.828l-2.36-2.36zm-2.121 1.415l2.12 2.12-9.193 9.193-2.12-2.12 9.193-9.193zm-10.193 10.193l2.12 2.12-3.03.866.91-3.03zm13.193-13.193a4 4 0 0 1 0 5.657l-9.9 9.9a3 3 0 0 1-1.394.788l-5.25 1.5a3 3 0 0 1-3.708-3.708l1.5-5.25a3 3 0 0 1 .788-1.394l9.9-9.9a4 4 0 0 1 5.657 0z" fill="currentColor"/>
              </svg>
            </button>

            {/* Delete Button */}
            <button
              ref={deleteButtonRef}
              className="hover:text-danger"
              title="Delete"
              onClick={() => handleDelete(value)}
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
        ),
      },
    ],
    []
  );

  const data = useMemo(() => rolesData, [rolesData]);

  const tableInstance = useTable<Role>(
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
    console.log('View role:', id);
    // TODO: Implementar vista de detalles
  };

  const handleEdit = (id: string) => {
    console.log('🔵 Edit button clicked, ID:', id);
    console.log('🔵 Current modal state:', showEditModal);
    setSelectedRoleId(id);
    setShowEditModal(true);
    console.log('🔵 Edit modal should be open now');
  };

  const handleDelete = (id: string) => {
    const role = rolesData.find((r) => r.id === id);
    if (role) {
      setSelectedRoleId(id);
      setSelectedRole(role);
      setTimeout(() => {
        setShowDeleteModal(true);
      }, 50);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSelectedRoleId(null);
    setSelectedRole(null);
  };

  const handleDeleteSuccess = async () => {
    await loadPage(currentPage);
    handleDeleteCancel();
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
  if (loading && rolesData.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <section className="data-table-common data-table-two rounded-sm border border-stroke bg-white py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
        {/* Header con búsqueda y botón crear */}
        <div className="flex flex-col gap-4 border-b border-stroke px-8 pb-4 dark:border-strokedark md:flex-row md:items-center md:justify-between">
          <div className="w-full md:w-1/2">
            <input
              type="text"
              value={globalFilter || ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full rounded-md border border-stroke px-5 py-2.5 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              placeholder="Search roles..."
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
              <p className="pl-2 text-black dark:text-white">Records per page</p>
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
              Create Role
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
                    <p className="text-sm text-bodydark">No roles to display</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer con paginación */}
        <div className="flex flex-col justify-between gap-4 border-t border-stroke px-8 pt-5 dark:border-strokedark sm:flex-row sm:items-center">
          <p className="font-medium">
            Showing page {currentPage} of {totalPages} ({totalItems} total records)
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
              Página {currentPage}
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

      {/* Modal de Creación */}
      {showCreateModal && (
        <CreateRoleModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
          trigger={createButtonRef}
        />
      )}

      {/* Modal de Edición */}
      {showEditModal && (
        <EditRoleModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRoleId(null);
          }}
          onSuccess={handleEditSuccess}
          trigger={editButtonRef}
          roleId={selectedRoleId}
        />
      )}

      {/* Modal de Eliminación */}
      {showDeleteModal && selectedRole && (
        <DeleteRoleModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onSuccess={handleDeleteSuccess}
          trigger={deleteButtonRef}
          role={selectedRole}
        />
      )}
    </>
  );
};

export default RoleTable;