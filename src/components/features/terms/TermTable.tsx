import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getTermsPaginated } from '../../../libs/TermService';
import { Term, TermsResponse } from '../../../types/Term';
import CreateTermModal from './CreateTermModal';
import EditTermModal from './EditTermModal';
import DeleteTermModal from './DeleteTermModal';
import axiosInstance from '../../../interceptor/axiosInstance';

const TermTable = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [termFilter, setTermFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  // user filter states (same behaviour as LocatedTermTable)
  const [userQuery, setUserQuery] = useState<string>('');
  const [userResults, setUserResults] = useState<Array<{ id: string; name: string }>>([]);
  const [allUsers, setAllUsers] = useState<Array<{ id: string; name: string; email?: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const userSearchTimer = useRef<number | null>(null);
  const [termsResponse, setTermsResponse] = useState<TermsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const [copiedDefId, setCopiedDefId] = useState<string | null>(null);

  const handleCopyDefinition = (definition: string, id: string) => {
    try {
      navigator.clipboard.writeText(definition);
      setCopiedDefId(id);
      setTimeout(() => setCopiedDefId(null), 1200);
    } catch (err) {
      // ignore
    }
  };

  const { t } = useTranslation();

  // Fetch terms data - ONLY depends on page and limit
  const fetchTerms = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTermsPaginated(page, limit, termFilter || undefined, locationFilter || undefined, selectedUserId || undefined);
      setTermsResponse(result);
    } catch (err: any) {
      setError(err?.message || 'Error fetching terms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, termFilter, locationFilter, selectedUserId]);

  const handleEdit = (termId: string) => {
    const term = termsResponse?.items?.find((t) => t.id === termId);
    if (term) {
      setSelectedTerm(term);
      setSelectedTermId(termId);
      setShowEditModal(true);
    }
  };

  const handleDelete = (termId: string) => {
    setSelectedTermId(termId);
    setShowDeleteModal(true);
  };

  return (
    <section className="data-table-common rounded-sm border border-stroke bg-white py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* Header with page title and create button */}
          <div className="px-4 py-6 md:px-6 xl:px-7.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div>
              <h2 className="text-lg font-semibold text-black dark:text-white">{t('terms.title')}</h2>
              <div className="mt-2">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-boxdark-3 rounded-md px-3 py-2">
                  {/* User filter (loads all users on focus, local filtering, remote fallback) */}
                  <div className="relative">
                    {selectedUserId ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm dark:bg-boxdark-4 border border-stroke">
                        <span className="text-black dark:text-white">{selectedUserName || selectedUserId}</span>
                        <button onClick={() => { setSelectedUserId(null); setSelectedUserName(null); setPage(1); }} className="text-xs text-gray-500 ml-2">×</button>
                      </div>
                    ) : (
                      <div className="relative">
                        <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="11" r="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <input
                          type="text"
                          value={userQuery}
                          onChange={(e) => {
                            setUserQuery(e.target.value);
                            setSelectedUserId(null);
                            if (userSearchTimer.current) window.clearTimeout(userSearchTimer.current);
                            // debounce like LocatedTermTable
                            // @ts-ignore
                            userSearchTimer.current = window.setTimeout(() => {
                              if (allUsers.length > 0) {
                                const filtered = allUsers.filter(u => (u.name || '').toLowerCase().includes(e.target.value.toLowerCase()) || (u.email || '').toLowerCase().includes(e.target.value.toLowerCase()));
                                setUserResults(filtered);
                              } else {
                                // remote search
                                axiosInstance.get('/users/v0', { params: { nameFilter: e.target.value } }).then(resp => {
                                  const items = resp.data?.items || resp.data || [];
                                  const mapped = items.map((u: any) => ({ id: u.id, name: `${u.firstName || u.name || ''} ${u.lastName || ''}`.trim() || u.email || u.id, email: u.email }));
                                  setUserResults(mapped);
                                }).catch(() => setUserResults([]));
                              }
                            }, 200);
                          }}
                          onFocus={() => {
                            if (allUsers.length === 0) {
                              axiosInstance.get('/users/v0').then(resp => {
                                const items = resp.data?.items || resp.data || [];
                                const mapped = items.map((u: any) => ({ id: u.id, name: `${u.firstName || u.name || ''} ${u.lastName || ''}`.trim() || u.email || u.id, email: u.email }));
                                setAllUsers(mapped);
                                setUserResults(mapped);
                              }).catch(() => { setAllUsers([]); setUserResults([]); });
                            } else {
                              setUserResults(allUsers);
                            }
                          }}
                          onClick={() => {
                            if (allUsers.length === 0) {
                              axiosInstance.get('/users/v0').then(resp => {
                                const items = resp.data?.items || resp.data || [];
                                const mapped = items.map((u: any) => ({ id: u.id, name: `${u.firstName || u.name || ''} ${u.lastName || ''}`.trim() || u.email || u.id, email: u.email }));
                                setAllUsers(mapped);
                                setUserResults(mapped);
                              }).catch(() => { setAllUsers([]); setUserResults([]); });
                            } else {
                              setUserResults(allUsers);
                            }
                          }}
                          placeholder={t('terms.table.search_user') || 'Buscar usuario...'}
                          className="h-9 w-64 rounded border border-stroke bg-white pl-9 pr-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
                        />

                        {userResults.length > 0 && (
                          <ul className="absolute left-0 top-full z-50 mt-1 max-h-40 w-56 overflow-auto rounded border bg-white py-1 shadow-md dark:bg-boxdark">
                            {userResults.map((u) => (
                              <li key={u.id}>
                                <button onClick={() => { setSelectedUserId(u.id); setSelectedUserName(u.name); setUserResults([]); setUserQuery(''); setPage(1); }} className="block w-full px-3 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-boxdark-3">{u.name}</button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={termFilter}
                    onChange={(e) => { setTermFilter(e.target.value); setPage(1); }}
                    placeholder={t('terms.table.search_placeholder')}
                    className="h-9 w-56 rounded border border-stroke bg-white pl-3 pr-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
                  />
                  <select
                    value={locationFilter}
                    onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
                    className="h-9 w-40 rounded border border-stroke bg-white px-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
                  >
                    <option value="">{t('terms.table.location') || 'Location'}</option>
                    <option value="1">Location 1</option>
                    <option value="4">Location 4</option>
                  </select>
                </div>
              </div>
            </div>
        </div>

        <div>
          <button
            ref={createButtonRef}
            onClick={() => setShowCreateModal(true)}
            className="inline-flex rounded-md bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90"
          >
            {t('terms.table.create_term')}
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
                  <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                    {t('terms.table.term')}
                  </th>
                  <th className="min-w-[300px] px-4 py-4 font-medium text-black dark:text-white align-top">
                    {t('terms.table.definition')}
                  </th>
                  <th className="min-w-[140px] px-4 py-4 font-medium text-black dark:text-white align-top">
                    {t('terms.table.term_type')}
                  </th>
                  <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white align-top">{t('terms.table.created_by') || 'Creado por'}</th>
                  <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">
                    {t('terms.table.location')}
                  </th>
                  <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                    {t('terms.table.created_at')}
                  </th>
                  <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">
                    {t('terms.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {termsResponse?.items && termsResponse.items.length > 0 ? (
                  termsResponse.items.map((term) => (
                    <tr key={term.id} className="border-b border-stroke dark:border-strokedark">
                      <td className="px-4 py-5 pl-9">
                        <p className="text-black dark:text-white font-medium">{term.term}</p>
                      </td>
                      <td className="px-4 py-5 align-top">
                        <div className="flex items-center gap-2">
                          <p className="text-black dark:text-white truncate max-w-xs" title={term.definition}>
                            {term.definition}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCopyDefinition(term.definition || '', term.id)}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-boxdark-3 border border-transparent focus:outline-none"
                            title={t('parts_accordion.copy_part_number')}
                          >
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
                              <rect x="3" y="3" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
                            </svg>
                          </button>
                          {copiedDefId === term.id && (
                            <span className="text-xs text-green-600 dark:text-green-400">{t('parts_accordion.copied')}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-5 align-top">
                        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-black dark:bg-meta-9 dark:text-white">{term.term_type || '-'}</span>
                      </td>
                      <td className="px-4 py-5 align-top">
                        <p className="text-black dark:text-white">{(term as any).term_user ? `${(term as any).term_user.firstName || ''} ${(term as any).term_user.lastName || ''}`.trim() : (term as any).user_id || t('user_no_name')}</p>
                      </td>
                      <td className="px-4 py-5">
                        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-black dark:bg-meta-9 dark:text-white">
                          {term.location}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <p className="text-black dark:text-white">
                          {new Date(term.createdAt).toLocaleDateString(undefined, {
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
                            className="hover:text-primary"
                            title={t('terms.table.edit')}
                            onClick={() => handleEdit(term.id)}
                          >
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
                            className="hover:text-danger"
                            title={t('terms.table.delete')}
                            onClick={() => handleDelete(term.id)}
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
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {t('common.no_results')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {termsResponse && (
            <div className="px-4 py-5 md:px-6 xl:px-7.5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('common.page')} {page} {t('common.of')} {termsResponse.totalPages}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 rounded border border-stroke bg-gray-2 text-black hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
                >
                  {t('common.previous')}
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {page}
                </span>
                <button
                  onClick={() => setPage(Math.min(termsResponse.totalPages, page + 1))}
                  disabled={page >= termsResponse.totalPages}
                  className="px-3 py-2 rounded border border-stroke bg-gray-2 text-black hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
                >
                  {t('common.next')}
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
      <CreateTermModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onSuccess={() => {
          setShowCreateModal(false);
          setPage(1);
          fetchTerms();
        }} 
      />

      {selectedTerm && (
        <EditTermModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTerm(null);
          }}
          term={selectedTerm}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedTerm(null);
            fetchTerms();
          }}
        />
      )}

      <DeleteTermModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTermId(null);
        }}
        termId={selectedTermId || ''}
        onSuccess={() => {
          setShowDeleteModal(false);
          setSelectedTermId(null);
          setPage(1);
          fetchTerms();
        }}
      />
    </section>
  );
};

export default TermTable;
