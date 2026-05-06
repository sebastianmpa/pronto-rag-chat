import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getTermsPaginated } from '../../../libs/TermService';
import { getAllTermCategories } from '../../../libs/TermCategoryService';
import { Term, TermsResponse } from '../../../types/Term';
import CreateTermModal from './CreateTermModal';
import EditTermModal from './EditTermModal';
import DeleteTermModal from './DeleteTermModal';
import axiosInstance from '../../../interceptor/axiosInstance';
import { usePartInfo } from '../../../hooks/usePartInfo';
import { usePricing } from '../../../hooks/usePricing';
import { useCustomerSearch } from '../../../hooks/useCustomerSearch';

const TermTable = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [termFilter, setTermFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [categoryFilter, setcategoryFilter] = useState<string>('');
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
  const [categories, setCategories] = useState<Map<string, string>>(new Map()); // ID -> category_name

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);

  // Part Info Modal states
  const [partNumberFilter, setPartNumberFilter] = useState('');
  const [showPartModal, setShowPartModal] = useState(false);
  const [expandedPartIdx, setExpandedPartIdx] = useState<number | null>(null);
  const [viewingLocation, setViewingLocation] = useState<{ [key: string]: 1 | 4 }>({});
  
  // Pricing modal states
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingForm, setPricingForm] = useState({ mfr: '', partNumber: '', customerName: '' });
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [pricingResult, setPricingResult] = useState<any>(null);
  const [pricingStep, setPricingStep] = useState<'search' | 'result'>('search');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isCustomerReady, setIsCustomerReady] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  
  // Part info hook
  const { partInfoList, loading: loadingPart, error: partError } = usePartInfo(partNumberFilter);
  
  // Pricing and customer search hooks
  const { 
    pricing,
    error: pricingHookError,
    fetchPricing
  } = usePricing();
  const { 
    customers,
    loading: customerSearchLoading,
    error: customerSearchError,
    searchCustomers 
  } = useCustomerSearch();
  
  // Agrupar datos de partes por mfrId|partNumber - usando useMemo
  const groupedPartData = partInfoList.length > 0 ? (() => {
    const grouped = new Map<string, { loc1?: any; loc4?: any }>();
    
    partInfoList.forEach((item) => {
      const key = `${item.mfrId}|${item.partNumber}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, {});
      }
      const group = grouped.get(key)!;
      
      const location = parseInt(String(item.location)) || 1;
      if (location === 1) {
        group.loc1 = item;
      } else if (location === 4) {
        group.loc4 = item;
      }
    });
    
    return Array.from(grouped.values());
  })() : [];

  const { t } = useTranslation();

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllTermCategories();
        const categoryMap = new Map<string, string>();
        data.forEach((cat) => {
          categoryMap.set(cat.id, cat.category_name);
        });
        setCategories(categoryMap);
      } catch (err: any) {
        // Si hay error (403, 401, etc.), simplemente no cargar categorías
        // Esto es normal para usuarios sin permisos de admin
        console.warn('Could not load categories (this is normal for non-admin users):', err?.message);
        setCategories(new Map()); // Set empty map instead of showing error
      }
    };
    fetchCategories();
  }, []);

  // Fetch terms data - ONLY depends on page and limit
  const fetchTerms = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTermsPaginated(page, limit, termFilter || undefined, locationFilter || undefined, selectedUserId || undefined, categoryFilter || undefined);
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
  }, [page, limit, termFilter, locationFilter, selectedUserId, categoryFilter]);

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

  // Handle customer search (auto-search while typing)
  const handleCustomerSearch = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setShowCustomerDropdown(false);
      return;
    }

    try {
      setIsSearching(true);
      setPricingError(null);
      
      await searchCustomers({
        q: searchQuery.trim(),
        page: 1,
        limit: 10
      });
    } catch (err: any) {
      setPricingError(err?.message || 'Failed to search for customers');
      setShowCustomerDropdown(false);
      setIsSearching(false);
    }
  };

  // Reset pricing modal
  const resetPricingModal = () => {
    setPricingError(null);
    setPricingResult(null);
    setPricingStep('search');
    setSelectedCustomer(null);
    setIsCustomerReady(false);
    setShowCustomerDropdown(false);
    setIsSearching(false);
    setPricingForm({ mfr: '', partNumber: '', customerName: '' });
    setPricingLoading(false);
  };

  // Validate when customer is fully loaded
  useEffect(() => {
    if (selectedCustomer && selectedCustomer.CUSTOMERID) {
      setIsCustomerReady(true);
    } else {
      setIsCustomerReady(false);
    }
  }, [selectedCustomer]);

  // Update dropdown when customers data changes
  useEffect(() => {
    if (customerSearchLoading) return;
    
    if (selectedCustomer) {
      setShowCustomerDropdown(false);
      setIsSearching(false);
      return;
    }
    
    if (customerSearchError) {
      setPricingError(customerSearchError);
      setShowCustomerDropdown(false);
      setIsSearching(false);
    } else if (pricingForm.customerName.trim().length >= 3) {
      if (customers && customers.length > 0) {
        setShowCustomerDropdown(true);
        setIsSearching(false);
      } else {
        setPricingError(t('pricing.no_customers_found') || 'No customers found with that search term');
        setShowCustomerDropdown(false);
        setIsSearching(false);
      }
    } else {
      setIsSearching(false);
    }
  }, [customers, customerSearchLoading, customerSearchError, pricingForm.customerName, selectedCustomer, t]);

  // Debounce customer search
  useEffect(() => {
    if (selectedCustomer) return;
    
    const timeoutId = setTimeout(() => {
      if (pricingForm.customerName.trim().length >= 3) {
        handleCustomerSearch(pricingForm.customerName);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricingForm.customerName]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node) &&
        customerInputRef.current &&
        !customerInputRef.current.contains(event.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // React to pricing data changes
  useEffect(() => {
    if (pricingLoading && pricing && selectedCustomer) {
      setPricingResult({
        ...pricing,
        customer: {
          id: selectedCustomer.CUSTOMERID,
          name: selectedCustomer.NAME,
          firstName: selectedCustomer.FIRSTNAME,
          lastName: selectedCustomer.LASTNAME,
          phone: selectedCustomer.PHONE,
          email: selectedCustomer.EMAIL,
          city: selectedCustomer.CITY,
          state: selectedCustomer.STATE
        }
      });
      setPricingStep('result');
      setPricingLoading(false);
    } else if (pricingLoading && pricingHookError) {
      setPricingError(pricingHookError);
      setPricingLoading(false);
    }
  }, [pricing, pricingHookError, pricingLoading, selectedCustomer]);

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
                  
                  <input
                    type="text"
                    value={categoryFilter}
                    onChange={(e) => { setcategoryFilter(e.target.value); setPage(1); }}
                    placeholder={t('terms.table.category') || 'Categoría'}
                    className="h-9 w-48 rounded border border-stroke bg-white px-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
                  />
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
                  <th className="min-w-[160px] px-4 py-4 font-medium text-black dark:text-white align-top">
                    {t('terms.table.category') || 'Categoría'}
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
                            onClick={() => {
                              setPartNumberFilter(term.definition || '');
                              setShowPartModal(true);
                            }}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-boxdark-3 border border-transparent focus:outline-none"
                            title={t('common.search') || 'Search'}
                          >
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-5 align-top">
                        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-black dark:bg-meta-9 dark:text-white">{term.term_type || '-'}</span>
                      </td>
                      <td className="px-4 py-5 align-top">
                        <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {term.term_category_id ? categories.get(term.term_category_id) || '-' : '-'}
                        </span>
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
                          {/* Edit Button (updated style + icon) */}
                          <button
                            onClick={() => handleEdit(term.id)}
                            title={t('terms.table.edit')}
                            aria-label={t('terms.table.edit')}
                            className="p-2 rounded-md bg-white dark:bg-boxdark-2 text-primary hover:bg-primary hover:text-white shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                              <path d="M20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.29a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
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
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
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

      {/* Part Information Modal */}
      {showPartModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPartModal(false)}
        >
          <div
            className="rounded-2xl border border-blue-300 bg-white dark:bg-boxdark text-black dark:text-white py-5 px-7 shadow-xl w-full max-w-5xl max-h-[88vh] overflow-y-auto relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 pb-4 border-b border-blue-200 dark:border-blue-800">
              <h2 className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {t('parts.related_parts_information') || 'Related Parts Information'}
              </h2>
            </div>
            
            {/* Search Info */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('common.searching_for') || 'Searching for'}: <strong>{partNumberFilter}</strong>
              </p>
            </div>

            {/* Loading state */}
            {loadingPart && (
              <div className="flex justify-center py-8">
                <span className="text-gray-500 dark:text-gray-400">{t('common.loading')}</span>
              </div>
            )}

            {/* Error state */}
            {partError && !loadingPart && (
              <div className="rounded-sm border border-red-500 bg-red-50 p-4 text-red-700 dark:bg-red-900 dark:text-red-200">
                {partError}
              </div>
            )}

            {/* No results */}
            {!loadingPart && partInfoList.length === 0 && !partError && (
              <div className="text-center text-gray-500 py-8">{t('parts_table.no_parts_found')}</div>
            )}

            {/* Results */}
            {!loadingPart && partInfoList.length > 0 && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                {groupedPartData.map((group, idx) => {
                  const defaultLocation = (group.loc1 ? 1 : (group.loc4 ? 4 : 1)) as 1 | 4;
                  const currentLocation = viewingLocation[idx] || defaultLocation;
                  let item = currentLocation === 1 ? group.loc1 : group.loc4;

                  if (!item) {
                    item = currentLocation === 1 ? group.loc4 : group.loc1;
                  }

                  if (!item) return null;

                  const general = item.general_info || {};
                  const relatedParts = item.related_parts || [];
                  const pricing = item.pricing || {};
                  const netPrice = pricing.net_price ?? null;
                  const hasAlternateLocation = currentLocation === 1 ? !!group.loc4 : !!group.loc1;

                  return (
                    <div className="border border-stroke dark:border-strokedark rounded-lg overflow-hidden shadow-sm bg-white dark:bg-boxdark">
                      {/* Header del acordeón */}
                      <div className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-boxdark-2 hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors border-b border-stroke dark:border-strokedark">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {item.productThumbnailImage && item.productThumbnailImage.startsWith('http') && (
                            <img src={item.productThumbnailImage} alt="thumb" className="w-12 h-12 object-contain rounded border flex-shrink-0" />
                          )}
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                              <span className="truncate text-blue-600 dark:text-blue-400 font-bold">{item.mfrId}</span>
                              <span className="truncate text-blue-600 dark:text-blue-400 font-bold">{item.partNumber}</span>
                              <span className="truncate flex-1 text-gray-700 dark:text-gray-300">{general.DESCRIPTION || item.description || '-'}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>{t('parts_accordion.location')}: <strong>{item.location}</strong></span>
                              <span>{t('parts_accordion.quantity')}: <strong>{item.qty_loc}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Columna derecha: Cantidad, Precio y Botones */}
                        <div className="flex flex-col items-end justify-center gap-2 ml-4 flex-shrink-0">
                          {/* Primera fila: Cantidad y Precio */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {t('parts_accordion.quantity')}: {item.qty_loc}
                            </span>
                            {netPrice !== null && netPrice !== undefined && (
                              <span className="text-sm font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                                ${Number(netPrice).toFixed(2)}
                              </span>
                            )}
                          </div>
                          
                          {/* Segunda fila: Botones de ubicación y acciones */}
                          <div className="flex items-center gap-2">
                            {hasAlternateLocation && (
                              <div className="inline-flex items-center bg-gray-100 dark:bg-boxdark-2 rounded-full p-1 gap-1 border-2 border-stroke dark:border-strokedark">
                                <button
                                  type="button"
                                  onClick={() => setViewingLocation(prev => ({ ...prev, [idx]: 1 }))}
                                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${currentLocation === 1 ? 'bg-primary text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}
                                >
                                  1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setViewingLocation(prev => ({ ...prev, [idx]: 4 }))}
                                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${currentLocation === 4 ? 'bg-primary text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}
                                >
                                  4
                                </button>
                              </div>
                            )}
                            
                            {/* Pricing Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setPricingForm({ mfr: item.mfrId, partNumber: item.partNumber, customerName: '' });
                                setShowPricingModal(true);
                              }}
                              className="p-1.5 rounded-full transition-colors bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-800 dark:hover:bg-green-700 dark:text-green-200 border border-green-300 dark:border-green-600"
                              title={t('pricing.get_info') || 'Get pricing information'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => setExpandedPartIdx(expandedPartIdx === idx ? null : idx)}
                              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-meta-4 border border-transparent"
                            >
                              <svg
                                className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${expandedPartIdx === idx ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded content */}
                      {expandedPartIdx === idx && (
                        <div className="p-6 bg-gray-50 dark:bg-boxdark-2">
                          {item.productStandarImage && item.productStandarImage.startsWith('http') && (
                            <div className="mb-4 flex justify-center">
                              <img src={item.productStandarImage} alt="main" className="max-h-48 object-contain rounded border" />
                            </div>
                          )}

                          {relatedParts.length > 0 && (
                            <div>
                              <div className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                                {t('parts_accordion.related_products')}
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs border border-stroke dark:border-strokedark rounded">
                                  <thead className="bg-white dark:bg-boxdark">
                                    <tr>
                                      <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">
                                        {t('parts_accordion.mfr_id')}
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">
                                        {t('parts_accordion.part_number')}
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">
                                        {t('parts_accordion.description')}
                                      </th>
                                      <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">
                                        {t('parts_accordion.qty')}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white dark:bg-boxdark">
                                    {relatedParts.map((part, pidx) => (
                                      <tr key={pidx} className="border-b border-stroke dark:border-strokedark hover:bg-blue-50 dark:hover:bg-boxdark-2">
                                        <td className="px-3 py-2 text-gray-900 dark:text-white">{part.MFRID}</td>
                                        <td className="px-3 py-2 text-gray-900 dark:text-white font-semibold text-blue-600 dark:text-blue-400">{part.PARTNUMBER}</td>
                                        <td className="px-3 py-2 text-gray-900 dark:text-white">{part.DESCRIPTION}</td>
                                        <td className="px-3 py-2 text-right text-gray-900 dark:text-white font-medium">{part.QUANTITYLOC}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {relatedParts.length === 0 && (
                            <div className="text-xs text-gray-500 mt-2">{t('parts_accordion.no_related_parts')}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Close button */}
            <div className="mt-6 flex justify-end sticky bottom-0 bg-white dark:bg-boxdark pt-4 border-t border-stroke dark:border-strokedark">
              <button
                type="button"
                className="px-6 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold shadow-md transition-all duration-150"
                onClick={() => setShowPartModal(false)}
              >
                {t('common.close') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPricingModal(false)}>
          <div
            className="rounded-2xl border border-blue-300 bg-white dark:bg-boxdark py-5 px-7 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-stroke dark:border-strokedark mb-4">
              <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {pricingStep === 'search' ? t('pricing.get_info') : t('pricing.details')}
              </h2>
              <button
                type="button"
                onClick={() => setShowPricingModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {pricingStep === 'search' && (
              <div className="space-y-4">
                {/* Part Number Display */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('parts.part_number') || 'Part Number'}
                  </label>
                  <input
                    type="text"
                    value={pricingForm.partNumber}
                    disabled
                    className="w-full px-4 py-2 border border-stroke dark:border-strokedark rounded-lg bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-400"
                  />
                </div>

                {/* Manufacturer Display */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('parts.manufacturer') || 'Manufacturer'}
                  </label>
                  <input
                    type="text"
                    value={pricingForm.mfr}
                    disabled
                    className="w-full px-4 py-2 border border-stroke dark:border-strokedark rounded-lg bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-400"
                  />
                </div>

                {/* Customer Search */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('pricing.customer_search') || 'Search Customer'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative" ref={customerDropdownRef}>
                    <input
                      ref={customerInputRef}
                      type="text"
                      value={pricingForm.customerName}
                      onChange={(e) => {
                        setPricingForm(prev => ({ ...prev, customerName: e.target.value }));
                        if (e.target.value === '') {
                          setSelectedCustomer(null);
                        }
                      }}
                      placeholder={t('pricing.min_3_chars') || 'Type at least 3 characters...'}
                      className="w-full px-4 py-2 border border-stroke dark:border-strokedark rounded-lg bg-white dark:bg-boxdark text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-2.5">
                        <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                    
                    {/* Customer Dropdown */}
                    {showCustomerDropdown && !selectedCustomer && customers && customers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        {customers.map((customer) => (
                          <div
                            key={customer.CUSTOMERID}
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setPricingForm(prev => ({ ...prev, customerName: customer.NAME }));
                            }}
                            className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-boxdark-2 cursor-pointer border-b border-stroke dark:border-strokedark last:border-0"
                          >
                            <div className="font-semibold text-gray-900 dark:text-white">{customer.NAME}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              ID: {customer.CUSTOMERID} | {customer.CITY}, {customer.STATE}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {pricingError && !selectedCustomer && (
                    <p className="text-xs text-red-500 mt-1">{pricingError}</p>
                  )}
                </div>

                {/* Selected Customer Info */}
                {selectedCustomer && (
                  <div className="p-3 bg-blue-50 dark:bg-boxdark-2 rounded-lg border border-blue-200 dark:border-blue-700">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{selectedCustomer.NAME}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">ID: {selectedCustomer.CUSTOMERID}</p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-stroke dark:border-strokedark">
                  <button
                    type="button"
                    onClick={() => setShowPricingModal(false)}
                    className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold transition-all"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isCustomerReady && selectedCustomer) {
                        setPricingLoading(true);
                        fetchPricing({ mfrId: pricingForm.mfr, partNumber: pricingForm.partNumber, customerId: selectedCustomer.CUSTOMERID });
                      }
                    }}
                    disabled={!isCustomerReady || pricingLoading}
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold transition-all"
                  >
                    {pricingLoading ? (
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('common.loading') || 'Loading...'}
                      </div>
                    ) : (
                      t('pricing.get_pricing') || 'Get Pricing'
                    )}
                  </button>
                </div>
              </div>
            )}

            {pricingStep === 'result' && pricingResult && (
              <div className="space-y-4">
                {/* Customer Info */}
                <div className="bg-gray-50 dark:bg-boxdark-2 p-4 rounded-lg border border-stroke dark:border-strokedark">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('pricing.customer_info') || 'Customer Information'}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Name:</span>
                      <p className="font-semibold text-gray-900 dark:text-white">{pricingResult.customer?.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">ID:</span>
                      <p className="font-semibold text-gray-900 dark:text-white">{pricingResult.customer?.id}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                      <p className="font-semibold text-gray-900 dark:text-white">{pricingResult.customer?.phone || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Email:</span>
                      <p className="font-semibold text-gray-900 dark:text-white">{pricingResult.customer?.email || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing Details */}
                <div className="bg-gray-50 dark:bg-boxdark-2 p-4 rounded-lg border border-stroke dark:border-strokedark">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('pricing.details') || 'Pricing Details'}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white dark:bg-boxdark p-3 rounded border border-stroke dark:border-strokedark">
                      <span className="text-gray-500 dark:text-gray-400">{t('pricing.list_price') || 'List Price'}</span>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">${pricingResult.list_price?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="bg-white dark:bg-boxdark p-3 rounded border border-stroke dark:border-strokedark">
                      <span className="text-gray-500 dark:text-gray-400">{t('pricing.net_price') || 'Net Price'}</span>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">${pricingResult.net_price?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </div>

                {/* Part Info */}
                <div className="bg-gray-50 dark:bg-boxdark-2 p-4 rounded-lg border border-stroke dark:border-strokedark">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('parts.info') || 'Part Information'}</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500 dark:text-gray-400">{t('parts.part_number')}:</span> <span className="font-semibold text-gray-900 dark:text-white">{pricingForm.partNumber}</span></div>
                    <div><span className="text-gray-500 dark:text-gray-400">{t('parts.manufacturer')}:</span> <span className="font-semibold text-gray-900 dark:text-white">{pricingForm.mfr}</span></div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-stroke dark:border-strokedark">
                  <button
                    type="button"
                    onClick={resetPricingModal}
                    className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold transition-all"
                  >
                    {t('pricing.new_search') || 'New Search'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPricingModal(false)}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-opacity-90 text-white font-semibold transition-all"
                  >
                    {t('common.close') || 'Close'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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
