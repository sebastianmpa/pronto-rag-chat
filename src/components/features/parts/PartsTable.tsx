import { useMemo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePartInfo } from '../../../hooks/usePartInfo';
import { useStockTransfer } from '../../../hooks/useStockTransfer';
import { usePricing } from '../../../hooks/usePricing';
import { useCustomerSearch } from '../../../hooks/useCustomerSearch';
import { PartInfo } from '../../../types/partInfo';
import { Customer } from '../../../types/customers';
import {
  getAllTermCategories,
  getTermsByCategory,
} from '../../../libs/TermCategoryService';
import { ManufacturerService } from '../../../libs/ManufacturerService';
import { TermCategory } from '../../../types/TermCategory';
import { useCart } from '../../../context/CartContext';

const PartsTable = () => {
  const { t } = useTranslation();
  const { addItem } = useCart();
  const [partNumberFilter, setPartNumberFilter] = useState('');
  const [showTable, setShowTable] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | string | null>(null);
  const [copiedRelatedIdx, setCopiedRelatedIdx] = useState<{
    itemIdx: number;
    partIdx: number;
  } | null>(null);
  const [viewingLocation, setViewingLocation] = useState<{
    [key: string]: 1 | 4;
  }>({});
  const [transferModalIdx, setTransferModalIdx] = useState<number | null>(null);
  const [transferForm, setTransferForm] = useState({
    mfr: '',
    sku: '',
    quantity: '',
    order: '',
    orderCancelled: 'yes',
  });
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const orderInputRef = useRef<HTMLInputElement>(null);
  const { requestTransfer: hookRequestTransfer } = useStockTransfer();

  // Pricing modal states
  const [pricingModalIdx, setPricingModalIdx] = useState<number | null>(null);
  const [pricingForm, setPricingForm] = useState({
    mfr: '',
    partNumber: '',
    customerName: '',
  });
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [pricingResult, setPricingResult] = useState<any>(null);
  const [pricingStep, setPricingStep] = useState<'search' | 'result'>('search');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isCustomerReady, setIsCustomerReady] = useState(false);
  const [pricingRelatedIdx, setPricingRelatedIdx] = useState<{
    itemIdx: number;
    partIdx: number;
  } | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Use pricing and customer search hooks
  const {
    pricing,
    loading: pricingHookLoading,
    error: pricingHookError,
    fetchPricing,
    clearPricing,
  } = usePricing();
  const {
    customers,
    loading: customerSearchLoading,
    error: customerSearchError,
    searchCustomers,
  } = useCustomerSearch();

  // Hook para obtener la info de la parte
  const {
    partInfoList,
    loading: loadingPart,
    error,
    fetchPartInfo,
  } = usePartInfo(partNumberFilter);

  // Agrupar datos por mfrId|partNumber
  const groupedData = useMemo(() => {
    const grouped = new Map<string, { loc1?: PartInfo; loc4?: PartInfo }>();

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
  }, [partInfoList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partNumberFilter.trim()) return;

    setShowTable(true);
    await fetchPartInfo();
  };

  const handleCopy = (partNumber: string, idx: number | string) => {
    if (!partNumber) return;
    navigator.clipboard.writeText(partNumber);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1200);
  };

  const handleCopyRelated = (
    partNumber: string,
    itemIdx: number,
    partIdx: number
  ) => {
    if (!partNumber) return;
    navigator.clipboard.writeText(partNumber);
    setCopiedRelatedIdx({ itemIdx, partIdx });
    setTimeout(() => setCopiedRelatedIdx(null), 1200);
  };

  // Wrapper for requestTransfer that handles loading, error, and success states
  const requestTransfer = async (payload: any) => {
    setTransferLoading(true);
    setTransferError(null);
    try {
      await hookRequestTransfer(payload);
    } catch (err: any) {
      setTransferError(err?.message || 'Failed to submit transfer request');
      setTransferLoading(false);
      throw err;
    }
    setTransferLoading(false);
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

      // Search for customers using the hook
      await searchCustomers({
        q: searchQuery.trim(),
        page: 1,
        limit: 10, // Load only 10 customers for better performance
      });
    } catch (err: any) {
      setPricingError(err?.message || 'Failed to search for customers');
      setShowCustomerDropdown(false);
      setIsSearching(false);
    }
  };

  // Handle pricing fetch (step 2)
  const handlePricingFetch = async (customer: any) => {
    try {
      setPricingLoading(true);
      setPricingError(null);
      setSelectedCustomer(customer);
      setShowCustomerDropdown(false);

      await fetchPricing({
        mfrId: pricingForm.mfr,
        partNumber: pricingForm.partNumber,
        customerId: customer.CUSTOMERID,
      });
    } catch (err: any) {
      setPricingError(err?.message || 'Failed to get pricing information');
      setPricingLoading(false);
    }
  };

  // Reset pricing modal
  const resetPricingModal = () => {
    setPricingModalIdx(null);
    setPricingRelatedIdx(null);
    setCatPricingOpen(false);
    setPricingError(null);
    setPricingResult(null);
    setPricingStep('search');
    setSelectedCustomer(null);
    setIsCustomerReady(false);
    setShowCustomerDropdown(false);
    setIsSearching(false);
    setPricingForm({ mfr: '', partNumber: '', customerName: '' });
    setPricingLoading(false);
    clearPricing(); // Clear the pricing hook state
  };

  // Validate when customer is fully loaded and ready
  useEffect(() => {
    if (selectedCustomer && selectedCustomer.CUSTOMERID) {
      setIsCustomerReady(true);
    } else {
      setIsCustomerReady(false);
    }
  }, [selectedCustomer]);

  // Update dropdown when customers data changes
  useEffect(() => {
    // Only process when search has finished loading
    if (customerSearchLoading) return;

    // Don't show dropdown if customer is already selected
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
        // No results found
        setPricingError(
          t('pricing.no_customers_found') ||
            'No customers found with that search term'
        );
        setShowCustomerDropdown(false);
        setIsSearching(false);
      }
    } else {
      setIsSearching(false);
    }
  }, [
    customers,
    customerSearchLoading,
    customerSearchError,
    pricingForm.customerName,
    selectedCustomer,
    t,
  ]);

  // Debounce customer search
  useEffect(() => {
    // Don't search if a customer is already selected (prevents search when clicking from dropdown)
    if (selectedCustomer) return;

    const timeoutId = setTimeout(() => {
      if (pricingForm.customerName.trim().length >= 3) {
        handleCustomerSearch(pricingForm.customerName);
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricingForm.customerName]);

  // Clean pricing state when opening a new pricing modal
  useEffect(() => {
    if (pricingModalIdx !== null || pricingRelatedIdx !== null) {
      // Only reset the form but keep modal open for new search
      setPricingError(null);
      setPricingResult(null);
      setPricingStep('search');
      setSelectedCustomer(null);
      setIsCustomerReady(false);
      setShowCustomerDropdown(false);
      setIsSearching(false);
      setPricingForm((prev) => ({
        ...prev,
        customerName: '',
      }));
      setPricingLoading(false);
      clearPricing(); // Clear the pricing hook state
    }
  }, [pricingModalIdx, pricingRelatedIdx, clearPricing]);

  // Focus on order input when modal opens
  useEffect(() => {
    if (transferModalIdx !== null && orderInputRef.current) {
      setTimeout(() => orderInputRef.current?.focus(), 100);
    }
    if (pricingModalIdx !== null && customerInputRef.current) {
      setTimeout(() => customerInputRef.current?.focus(), 100);
    }
  }, [transferModalIdx, pricingModalIdx]);

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
          state: selectedCustomer.STATE,
        },
      });
      setPricingStep('result');
      setPricingLoading(false);
    } else if (pricingLoading && pricingHookError) {
      setPricingError(pricingHookError);
      setPricingLoading(false);
    }
  }, [pricing, pricingHookError, pricingLoading, selectedCustomer]);

  // Handle pricing modal keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        (pricingModalIdx !== null || pricingRelatedIdx !== null)
      ) {
        resetPricingModal();
      }
    };

    if (pricingModalIdx !== null || pricingRelatedIdx !== null) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [pricingModalIdx, pricingRelatedIdx]);

  // Category filter states
  const [allCategories, setAllCategories] = useState<TermCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TermCategory | null>(
    null
  );
  const [categoryQuery, setCategoryQuery] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categoryDropdownResults, setCategoryDropdownResults] = useState<
    TermCategory[]
  >([]);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  // Parts grouped by term from selected category: { term, definition, parts, loading }
  const [categoryTermParts, setCategoryTermParts] = useState<
    Array<{
      id: string;
      term: string;
      definition: string;
      parts: PartInfo[];
      loading: boolean;
      expanded: boolean;
    }>
  >([]);
  const [loadingCategory, setLoadingCategory] = useState(false);
  // State for category parts accordions
  const [catViewingLocation, setCatViewingLocation] = useState<{
    [key: string]: 1 | 4;
  }>({});
  const [catExpandedKey, setCatExpandedKey] = useState<string | null>(null);
  const [catPricingOpen, setCatPricingOpen] = useState(false);
  const [catTransferOpen, setCatTransferOpen] = useState(false);

  // Load categories on mount
  useEffect(() => {
    getAllTermCategories()
      .then(setAllCategories)
      .catch(() => setAllCategories([]));
  }, []);

  // Click-outside for category dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target as Node)
      ) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // When category selected: fetch terms then fetch parts for each term automatically
  useEffect(() => {
    if (!selectedCategory) {
      setCategoryTermParts([]);
      return;
    }
    setLoadingCategory(true);
    setCategoryTermParts([]);
    getTermsByCategory(selectedCategory.internal_category_name)
      .then((terms) => {
        if (!terms || terms.length === 0) {
          setLoadingCategory(false);
          return;
        }
        // Initialize state with loading=true for each term
        const initial = terms.map((t) => ({
          id: t.id,
          term: t.term,
          definition: t.definition,
          parts: [],
          loading: true,
          expanded: false,
        }));
        setCategoryTermParts(initial);
        setLoadingCategory(false);
        // Fetch parts for each term
        terms.forEach((term, i) => {
          ManufacturerService.fetchPartInfo(term.definition)
            .then((res) => {
              const parts = res.partInfo || [];
              setCategoryTermParts((prev) =>
                prev.map((tp, j) =>
                  j === i ? { ...tp, parts, loading: false } : tp
                )
              );
            })
            .catch(() => {
              setCategoryTermParts((prev) =>
                prev.map((tp, j) =>
                  j === i ? { ...tp, parts: [], loading: false } : tp
                )
              );
            });
        });
      })
      .catch(() => setLoadingCategory(false));
  }, [selectedCategory]);

  return (
    <section className="data-table-common rounded-sm border border-stroke bg-white py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* Page title (use translation key if available, fallback to literal) */}
      <div className="px-8 pb-2 pt-6">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          {t('parts.related_parts_information') || 'Related Parts Information'}
        </h2>
      </div>
      {/* Formulario de búsqueda */}
      <form
        className="w-full rounded-b-lg border-x border-b border-stroke bg-white px-8 py-6 shadow-sm dark:border-strokedark dark:bg-boxdark-2"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          {/* Part number search */}
          <div className="flex-1">
            <label
              htmlFor="partNumberFilter"
              className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium"
            >
              {t('parts_table.part_number')}
            </label>
            <div className="relative">
              <input
                id="partNumberFilter"
                type="text"
                value={partNumberFilter}
                disabled={!!selectedCategory}
                onChange={(e) => setPartNumberFilter(e.target.value)}
                className={`bg-gray-50 placeholder-gray-500 dark:placeholder-gray-400 w-full rounded-md border border-stroke px-4 py-3 pr-12 text-sm text-black outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-strokedark dark:bg-transparent dark:text-white dark:focus:border-primary ${
                  selectedCategory ? 'cursor-not-allowed opacity-50' : ''
                }`}
                placeholder={t('parts_table.enter_part_number')}
              />
              <button
                type="submit"
                className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 hover:text-gray-900 absolute right-3 top-1/2 -translate-y-1/2 rounded border border-transparent p-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loadingPart || !!selectedCategory}
                title={t('parts_table.search')}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="text-gray-400 dark:text-gray-500 flex items-center gap-2 text-xs sm:pb-3">
            <span className="hidden h-8 w-px bg-stroke dark:bg-strokedark sm:block" />
            <span>o</span>
            <span className="hidden h-8 w-px bg-stroke dark:bg-strokedark sm:block" />
          </div>

          {/* Category filter (mutually exclusive with part number search) */}
          <div className="flex-1">
            <label className="text-gray-700 dark:text-gray-300 mb-2 block text-sm font-medium">
              {t('terms.table.category') || 'Categoría'}
            </label>
            <div className="relative" ref={categoryDropdownRef}>
              {selectedCategory ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm dark:border-blue-700 dark:bg-blue-900/20">
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    {selectedCategory.category_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(null);
                      setCategoryQuery('');
                      setCategoryTermParts([]);
                    }}
                    className="ml-1 text-base leading-none text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={categoryQuery}
                    disabled={!!partNumberFilter.trim()}
                    placeholder={
                      t('terms.table.category') || 'Buscar categoría...'
                    }
                    onChange={(e) => {
                      setCategoryQuery(e.target.value);
                      const q = e.target.value.toLowerCase();
                      setCategoryDropdownResults(
                        q
                          ? allCategories.filter((c) =>
                              c.category_name.toLowerCase().includes(q)
                            )
                          : allCategories
                      );
                      setCategoryDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setCategoryDropdownResults(allCategories);
                      setCategoryDropdownOpen(true);
                    }}
                    className={`bg-gray-50 w-full rounded-md border border-stroke px-4 py-3 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:bg-transparent dark:text-white dark:focus:border-primary ${
                      partNumberFilter.trim()
                        ? 'cursor-not-allowed opacity-50'
                        : ''
                    }`}
                  />
                  {categoryDropdownOpen &&
                    categoryDropdownResults.length > 0 && (
                      <ul className="absolute left-0 top-full z-50 mt-1 max-h-52 w-full overflow-auto rounded border border-stroke bg-white shadow-md dark:border-strokedark dark:bg-boxdark">
                        {categoryDropdownResults.map((cat) => (
                          <li key={cat.id}>
                            <button
                              type="button"
                              className="hover:bg-gray-100 block w-full px-4 py-2 text-left text-sm dark:hover:bg-meta-4"
                              onClick={() => {
                                setSelectedCategory(cat);
                                setCategoryQuery(cat.category_name);
                                setCategoryDropdownOpen(false);
                                setPartNumberFilter('');
                              }}
                            >
                              {cat.category_name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Botón limpiar filtros */}
        {(partNumberFilter.trim() || selectedCategory) && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setPartNumberFilter('');
                setSelectedCategory(null);
                setCategoryQuery('');
                setCategoryTermParts([]);
                setShowTable(false);
              }}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200 dark:text-gray-300 inline-flex items-center gap-2 rounded-md border border-stroke px-4 py-2 text-sm font-medium transition-colors dark:border-strokedark dark:bg-meta-4 dark:hover:bg-boxdark-2"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              {t('common.clear_filters') || 'Limpiar filtros'}
            </button>
          </div>
        )}
      </form>

      {/* Errores */}
      {error && (
        <div className="text-red-500 px-8 py-6 text-center">{error}</div>
      )}

      {/* Category results: one accordion-group per term, each with full part accordions */}
      {selectedCategory && (
        <div className="mt-6 space-y-6 px-8">
          {loadingCategory && (
            <div className="flex justify-center py-8">
              <span className="text-gray-500 dark:text-gray-400">
                {t('common.loading')}
              </span>
            </div>
          )}
          {!loadingCategory && categoryTermParts.length === 0 && (
            <div className="text-gray-500 dark:text-gray-400 py-8 text-center">
              {t('common.no_results')}
            </div>
          )}
          {categoryTermParts.map((tp, tIdx) => {
            // Group parts by mfrId|partNumber for loc1/loc4 handling
            const catGrouped = new Map<
              string,
              { loc1?: PartInfo; loc4?: PartInfo }
            >();
            tp.parts.forEach((p) => {
              const key = `${p.mfrId}|${p.partNumber}`;
              if (!catGrouped.has(key)) catGrouped.set(key, {});
              const g = catGrouped.get(key)!;
              const loc = parseInt(String(p.location)) || 1;
              if (loc === 1) g.loc1 = p;
              else if (loc === 4) g.loc4 = p;
            });
            const catGroupedList = Array.from(catGrouped.values());
            return (
              <div
                key={tp.id}
                className="overflow-hidden rounded-lg border border-stroke shadow-sm dark:border-strokedark"
              >
                {/* Term header */}
                <button
                  type="button"
                  className="hover:bg-gray-100 flex w-full items-center justify-between bg-gray-2 px-4 py-3 transition-colors dark:bg-boxdark-2 dark:hover:bg-meta-4"
                  onClick={() =>
                    setCategoryTermParts((prev) =>
                      prev.map((x, i) =>
                        i === tIdx ? { ...x, expanded: !x.expanded } : x
                      )
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-black dark:text-white">
                      {tp.term}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      ({tp.definition})
                    </span>
                    {!tp.loading && (
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {catGroupedList.length}{' '}
                        {t('parts_table.parts') || 'partes'}
                      </span>
                    )}
                    {tp.loading && (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        {t('common.loading')}...
                      </span>
                    )}
                  </div>
                  <svg
                    className={`text-gray-500 h-4 w-4 transition-transform ${
                      tp.expanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Parts as full-style accordions */}
                {tp.expanded && (
                  <div className="space-y-4 bg-white p-4 dark:bg-boxdark">
                    {tp.loading && (
                      <div className="text-gray-400 py-6 text-center text-sm">
                        {t('common.loading')}...
                      </div>
                    )}
                    {!tp.loading && catGroupedList.length === 0 && (
                      <div className="text-gray-400 py-6 text-center text-sm">
                        {t('parts_table.no_parts_found')}
                      </div>
                    )}
                    {!tp.loading &&
                      catGroupedList.map((group, gIdx) => {
                        const catKey = `${tIdx}-${gIdx}`;
                        const defaultLoc = (group.loc1 ? 1 : 4) as 1 | 4;
                        const currentLoc =
                          catViewingLocation[catKey] || defaultLoc;
                        let item = currentLoc === 1 ? group.loc1 : group.loc4;
                        if (!item)
                          item = currentLoc === 1 ? group.loc4 : group.loc1;
                        if (!item) return null;
                        const general = item.general_info || {};
                        const relatedParts = item.related_parts || [];
                        const catPricing = item.pricing || {};
                        const catNetPrice = catPricing.net_price ?? null;
                        const hasAlternateLoc =
                          currentLoc === 1 ? !!group.loc4 : !!group.loc1;
                        const isPartExpanded = catExpandedKey === catKey;
                        return (
                          <div
                            key={gIdx}
                            className="overflow-hidden rounded-lg border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark"
                          >
                            <div className="bg-gray-50 hover:bg-gray-100 flex w-full items-center justify-between border-b border-stroke px-3 py-2 transition-colors dark:border-strokedark dark:bg-boxdark-2 dark:hover:bg-meta-4">
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                {item.productThumbnailImage &&
                                  item.productThumbnailImage.startsWith(
                                    'http'
                                  ) && (
                                    <img
                                      src={item.productThumbnailImage}
                                      alt="thumb"
                                      className="h-10 w-10 rounded border object-contain"
                                    />
                                  )}
                                <div className="flex min-w-0 flex-1 flex-col">
                                  <div className="text-gray-700 dark:text-gray-300 flex flex-wrap items-center gap-2 text-xs font-semibold">
                                    <span className="truncate">
                                      {item.mfrId}
                                    </span>
                                    <span className="truncate font-bold text-blue-600 dark:text-blue-400">
                                      {item.partNumber}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        navigator.clipboard.writeText(
                                          item.partNumber
                                        )
                                      }
                                      className="flex-shrink-0 rounded border border-transparent p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900"
                                      title="Copiar número de parte"
                                    >
                                      <svg
                                        className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <rect
                                          x="9"
                                          y="9"
                                          width="13"
                                          height="13"
                                          rx="2"
                                          strokeWidth="2"
                                          stroke="currentColor"
                                          fill="none"
                                        />
                                        <rect
                                          x="3"
                                          y="3"
                                          width="13"
                                          height="13"
                                          rx="2"
                                          strokeWidth="2"
                                          stroke="currentColor"
                                          fill="none"
                                        />
                                      </svg>
                                    </button>
                                    <span className="flex-1 truncate">
                                      {(general as any).DESCRIPTION || '-'}
                                    </span>
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3 text-xs">
                                    <span>
                                      {t('parts_accordion.location')}:{' '}
                                      {item.location}
                                    </span>
                                    <span>
                                      {t('parts_accordion.superseded')}:
                                      {item.superseded &&
                                      item.superseded !== '-' ? (
                                        <span className="ml-1 font-medium text-blue-600 dark:text-blue-400">
                                          {item.superseded}
                                        </span>
                                      ) : (
                                        <span className="ml-1">-</span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-3 flex flex-col items-end justify-center gap-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap text-xs font-semibold">
                                    {t('parts_accordion.quantity')}:{' '}
                                    {item.qty_loc}
                                  </span>
                                  {catNetPrice !== null &&
                                    catNetPrice !== undefined && (
                                      <span className="whitespace-nowrap text-sm font-bold text-green-600 dark:text-green-400">
                                        ${Number(catNetPrice).toFixed(2)}
                                      </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {hasAlternateLoc && (
                                    <div className="bg-gray-100 inline-flex items-center gap-1 rounded-full border-2 border-stroke p-1 dark:border-strokedark dark:bg-boxdark-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setCatViewingLocation((prev) => ({
                                            ...prev,
                                            [catKey]: 1,
                                          }))
                                        }
                                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                          currentLoc === 1
                                            ? 'bg-primary text-black shadow'
                                            : 'text-gray-600 dark:text-gray-400'
                                        }`}
                                      >
                                        1
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setCatViewingLocation((prev) => ({
                                            ...prev,
                                            [catKey]: 4,
                                          }))
                                        }
                                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                          currentLoc === 4
                                            ? 'bg-primary text-black shadow'
                                            : 'text-gray-600 dark:text-gray-400'
                                        }`}
                                      >
                                        4
                                      </button>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    className="rounded-full border border-green-300 bg-green-100 p-1.5 text-green-700 hover:bg-green-200 dark:border-green-600 dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700"
                                    title={
                                      t('pricing.get_info') ||
                                      'Get pricing information'
                                    }
                                    onClick={() => {
                                      clearPricing();
                                      setPricingForm({
                                        mfr: item.mfrId,
                                        partNumber: item.partNumber,
                                        customerName: '',
                                      });
                                      setPricingRelatedIdx(null);
                                      setCatPricingOpen(true);
                                      setPricingError(null);
                                      setPricingResult(null);
                                      setPricingStep('search');
                                      setSelectedCustomer(null);
                                      setIsCustomerReady(false);
                                      setShowCustomerDropdown(false);
                                      setPricingLoading(false);
                                    }}
                                  >
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                  </button>
                                  {currentLoc === 4 && (
                                    <button
                                      type="button"
                                      className="rounded border border-transparent p-1 hover:bg-blue-100 dark:hover:bg-blue-900"
                                      title={
                                        t('stock_transfer.request') ||
                                        'Request transfer'
                                      }
                                      onClick={() => {
                                        setTransferForm({
                                          mfr: item.mfrId,
                                          sku: item.partNumber,
                                          quantity: '',
                                          order: '',
                                          orderCancelled: 'yes',
                                        });
                                        setCatTransferOpen(true);
                                        setTransferError(null);
                                        setTransferSuccess(false);
                                      }}
                                    >
                                      <svg
                                        className="h-5 w-5 text-blue-600 dark:text-blue-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                        />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCatExpandedKey(
                                        isPartExpanded ? null : catKey
                                      )
                                    }
                                    className="hover:bg-gray-200 rounded border border-transparent p-1 dark:hover:bg-meta-4"
                                  >
                                    <svg
                                      className={`text-gray-600 dark:text-gray-400 h-5 w-5 transition-transform ${
                                        isPartExpanded ? 'rotate-180' : ''
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                            {isPartExpanded && (
                              <div className="p-4">
                                {item.productStandarImage &&
                                  item.productStandarImage.startsWith(
                                    'http'
                                  ) && (
                                    <div className="mb-3 flex justify-center">
                                      <img
                                        src={item.productStandarImage}
                                        alt="main"
                                        className="max-h-40 rounded border object-contain"
                                      />
                                    </div>
                                  )}
                                {relatedParts.length > 0 && (
                                  <div>
                                    <div className="text-gray-800 dark:text-gray-100 mb-2 text-sm font-semibold">
                                      {t('parts_accordion.related_products')}
                                    </div>
                                    <div className="overflow-x-auto">
                                      <table className="w-full border border-stroke text-xs dark:border-strokedark">
                                        <thead className="bg-white dark:bg-boxdark">
                                          <tr>
                                            <th className="text-gray-700 dark:text-gray-300 border-b border-stroke px-2 py-1 text-left font-medium dark:border-strokedark">
                                              {t('parts_accordion.mfr_id')}
                                            </th>
                                            <th className="text-gray-700 dark:text-gray-300 border-b border-stroke px-2 py-1 text-left font-medium dark:border-strokedark">
                                              {t('parts_accordion.part_number')}
                                            </th>
                                            <th className="text-gray-700 dark:text-gray-300 border-b border-stroke px-2 py-1 text-left font-medium dark:border-strokedark">
                                              {t('parts_accordion.description')}
                                            </th>
                                            <th className="text-gray-700 dark:text-gray-300 border-b border-stroke px-2 py-1 text-right font-medium dark:border-strokedark">
                                              {t('parts_accordion.qty')}
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-boxdark">
                                          {relatedParts.map((rp, rpIdx) => (
                                            <tr
                                              key={rpIdx}
                                              className="hover:bg-gray-50 border-b border-stroke dark:border-strokedark dark:hover:bg-boxdark-2"
                                            >
                                              <td className="text-gray-900 px-2 py-1 dark:text-white">
                                                {rp.MFRID}
                                              </td>
                                              <td className="px-2 py-1">
                                                <div className="flex items-center gap-1">
                                                  <span className="font-bold text-blue-600 dark:text-blue-400">
                                                    {rp.PARTNUMBER}
                                                  </span>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      navigator.clipboard.writeText(
                                                        rp.PARTNUMBER
                                                      )
                                                    }
                                                    className="flex-shrink-0 rounded border border-transparent p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900"
                                                    title="Copiar número de parte"
                                                  >
                                                    <svg
                                                      className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      viewBox="0 0 24 24"
                                                    >
                                                      <rect
                                                        x="9"
                                                        y="9"
                                                        width="13"
                                                        height="13"
                                                        rx="2"
                                                        strokeWidth="2"
                                                        stroke="currentColor"
                                                        fill="none"
                                                      />
                                                      <rect
                                                        x="3"
                                                        y="3"
                                                        width="13"
                                                        height="13"
                                                        rx="2"
                                                        strokeWidth="2"
                                                        stroke="currentColor"
                                                        fill="none"
                                                      />
                                                    </svg>
                                                  </button>
                                                </div>
                                              </td>
                                              <td className="text-gray-900 px-2 py-1 dark:text-white">
                                                {rp.DESCRIPTION}
                                              </td>
                                              <td className="text-gray-900 px-2 py-1 text-right dark:text-white">
                                                {rp.QUANTITYLOC}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                                {relatedParts.length === 0 && (
                                  <div className="text-gray-500 mt-2 text-xs">
                                    {t('parts_accordion.no_related_parts')}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sin resultados */}
      {showTable && !loadingPart && partInfoList.length === 0 && !error && (
        <div className="text-gray-500 px-8 py-8 text-center">
          {t('parts_table.no_parts_found')}
        </div>
      )}

      {/* Resultados */}
      {showTable && !loadingPart && partInfoList.length > 0 && (
        <div className="mt-6 px-8">
          <div className="space-y-4">
            {groupedData.map((group, idx) => {
              const defaultLocation = (group.loc1 ? 1 : group.loc4 ? 4 : 1) as
                | 1
                | 4;
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
              const hasAlternateLocation =
                currentLocation === 1 ? !!group.loc4 : !!group.loc1;

              return (
                <div
                  key={idx}
                  className="mb-4 overflow-hidden rounded-lg border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark"
                >
                  {/* Header del acordeón */}
                  <div className="bg-gray-50 hover:bg-gray-100 flex w-full items-center justify-between border-b border-stroke px-3 py-2 transition-colors dark:border-strokedark dark:bg-boxdark-2 dark:hover:bg-meta-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {item.productThumbnailImage &&
                        item.productThumbnailImage.startsWith('http') && (
                          <img
                            src={item.productThumbnailImage}
                            alt="thumb"
                            className="h-10 w-10 rounded border object-contain"
                          />
                        )}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="text-gray-700 dark:text-gray-300 flex flex-wrap items-center gap-2 text-xs font-semibold">
                          <span className="truncate">{item.mfrId}</span>
                          <button
                            type="button"
                            onClick={async () => {
                              setPartNumberFilter(item.partNumber);
                              setShowTable(true);
                              await fetchPartInfo();
                            }}
                            className="truncate font-bold text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                            title={`Search for ${item.partNumber}`}
                          >
                            {item.partNumber}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              navigator.clipboard.writeText(item.partNumber)
                            }
                            className="flex-shrink-0 rounded border border-transparent p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900"
                            title="Copiar número de parte"
                          >
                            <svg
                              className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <rect
                                x="9"
                                y="9"
                                width="13"
                                height="13"
                                rx="2"
                                strokeWidth="2"
                                stroke="currentColor"
                                fill="none"
                              />
                              <rect
                                x="3"
                                y="3"
                                width="13"
                                height="13"
                                rx="2"
                                strokeWidth="2"
                                stroke="currentColor"
                                fill="none"
                              />
                            </svg>
                          </button>
                          <span className="flex-1 truncate">
                            {(general as any).DESCRIPTION || '-'}
                          </span>
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3 text-xs">
                          <span>
                            {t('parts_accordion.location')}: {item.location}
                          </span>
                          <span>
                            {t('parts_accordion.superseded')}:
                            {item.superseded && item.superseded !== '-' ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  setPartNumberFilter(item.superseded);
                                  setShowTable(true);
                                  await fetchPartInfo();
                                }}
                                className="ml-1 font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                title={`Search for ${item.superseded}`}
                              >
                                {item.superseded}
                              </button>
                            ) : (
                              <span className="ml-1">-</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Columna derecha: Cantidad, Precio y Botones alineados */}
                    <div className="ml-3 flex flex-col items-end justify-center gap-2">
                      {/* Primera fila: Cantidad y Precio */}
                      <div className="flex items-center gap-3">
                        <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap text-xs font-semibold">
                          {t('parts_accordion.quantity')}: {item.qty_loc}
                        </span>
                        {netPrice !== null && netPrice !== undefined && (
                          <span className="whitespace-nowrap text-sm font-bold text-green-600 dark:text-green-400">
                            ${Number(netPrice).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Segunda fila: Botones de ubicación y acciones */}
                      <div className="flex items-center gap-2">
                        {hasAlternateLocation && (
                          <div
                            className="bg-gray-100 inline-flex items-center gap-1 rounded-full border-2 border-stroke p-1 dark:border-strokedark dark:bg-boxdark-2"
                            role="tablist"
                            aria-label="Locations switch"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setViewingLocation((prev) => ({
                                  ...prev,
                                  [idx]: 1,
                                }))
                              }
                              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                currentLocation === 1
                                  ? 'bg-primary text-black shadow'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                              title={`${t('parts_accordion.view_location')} 1`}
                              aria-pressed={currentLocation === 1}
                            >
                              1
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setViewingLocation((prev) => ({
                                  ...prev,
                                  [idx]: 4,
                                }))
                              }
                              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                currentLocation === 4
                                  ? 'bg-primary text-black shadow'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                              title={`${t('parts_accordion.view_location')} 4`}
                              aria-pressed={currentLocation === 4}
                            >
                              4
                            </button>
                          </div>
                        )}

                        {/* Pricing Button */}
                        <button
                          type="button"
                          className="rounded-full border border-green-300 bg-green-100 p-1.5 text-green-700 transition-colors hover:bg-green-200 dark:border-green-600 dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700"
                          title={
                            t('pricing.get_info') || 'Get pricing information'
                          }
                          onClick={() => {
                            clearPricing(); // Clear any previous pricing data
                            setPricingForm({
                              mfr: item.mfrId,
                              partNumber: item.partNumber,
                              customerName: '',
                            });
                            setPricingRelatedIdx(null);
                            setPricingModalIdx(idx);
                            setPricingError(null);
                            setPricingResult(null);
                            setPricingStep('search');
                            setSelectedCustomer(null);
                            setIsCustomerReady(false);
                            setShowCustomerDropdown(false);
                            setPricingLoading(false);
                          }}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>

                        {/* Add to Cart Button */}
                        <button
                          type="button"
                          className="rounded-full border border-yellow-400 bg-primary p-1.5 text-black transition-colors hover:bg-opacity-80 dark:border-yellow-500"
                          title="Agregar al carrito"
                          onClick={() =>
                            addItem({
                              mfrId: item.mfrId,
                              partNumber: item.partNumber,
                              description: item.general_info?.DESCRIPTION || '',
                              netPrice: item.pricing?.net_price,
                            })
                          }
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
                            />
                          </svg>
                        </button>

                        {currentLocation === 4 && (
                          <button
                            type="button"
                            className="rounded border border-transparent p-1 hover:bg-blue-100 focus:outline-none dark:hover:bg-blue-900"
                            title={
                              t('stock_transfer.request') || 'Request transfer'
                            }
                            onClick={() => {
                              setTransferForm({
                                mfr: item.mfrId,
                                sku: item.partNumber,
                                quantity: '',
                                order: '',
                                orderCancelled: 'yes',
                              });
                              setTransferModalIdx(idx);
                              setTransferError(null);
                              setTransferSuccess(false);
                            }}
                          >
                            <svg
                              className="h-5 w-5 text-blue-600 dark:text-blue-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                              />
                            </svg>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedIdx(expandedIdx === idx ? null : idx)
                          }
                          className="hover:bg-gray-200 rounded border border-transparent p-1 focus:outline-none dark:hover:bg-meta-4"
                        >
                          <svg
                            className={`text-gray-600 dark:text-gray-400 h-5 w-5 transition-transform ${
                              expandedIdx === idx ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contenido expandido */}
                  {expandedIdx === idx && (
                    <div className="p-4">
                      {item.productStandarImage &&
                        item.productStandarImage.startsWith('http') && (
                          <div className="mb-3 flex justify-center">
                            <img
                              src={item.productStandarImage}
                              alt="main"
                              className="max-h-40 rounded border object-contain"
                            />
                          </div>
                        )}

                      {/* Partes relacionadas */}
                      {relatedParts.length > 0 && (
                        <div>
                          <div className="text-gray-800 dark:text-gray-100 mb-2 text-sm font-semibold">
                            {t('parts_accordion.related_products')}
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full border border-stroke text-xs dark:border-strokedark">
                              <thead className="bg-white dark:bg-boxdark">
                                <tr>
                                  <th className="text-gray-700 dark:text-gray-300 border-b border-stroke px-2 py-1 text-left font-medium dark:border-strokedark">
                                    {t('parts_accordion.mfr_id')}
                                  </th>
                                  <th className="text-gray-700 dark:text-gray-300 border-b border-stroke px-2 py-1 text-left font-medium dark:border-strokedark">
                                    {t('parts_accordion.part_number')}
                                  </th>
                                  <th className="text-gray-700 dark:text-gray-300 border-b border-stroke px-2 py-1 text-left font-medium dark:border-strokedark">
                                    {t('parts_accordion.description')}
                                  </th>
                                  <th className="text-gray-700 dark:text-gray-300 border-b border-stroke px-2 py-1 text-right font-medium dark:border-strokedark">
                                    {t('parts_accordion.qty')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-boxdark">
                                {relatedParts.map((part, pidx) => (
                                  <tr
                                    key={pidx}
                                    className="hover:bg-gray-50 border-b border-stroke dark:border-strokedark dark:hover:bg-boxdark-2"
                                  >
                                    <td className="text-gray-900 px-2 py-1 dark:text-white">
                                      {part.MFRID}
                                    </td>
                                    <td className="text-gray-900 px-2 py-1 dark:text-white">
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            setPartNumberFilter(
                                              part.PARTNUMBER
                                            );
                                            setShowTable(true);
                                            await fetchPartInfo();
                                          }}
                                          className="font-bold text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                          title={`Search for ${part.PARTNUMBER}`}
                                        >
                                          {part.PARTNUMBER}
                                        </button>
                                        <button
                                          type="button"
                                          className="flex-shrink-0 rounded border border-transparent p-0.5 hover:bg-blue-100 focus:outline-none dark:hover:bg-blue-900"
                                          onClick={() =>
                                            handleCopyRelated(
                                              part.PARTNUMBER,
                                              idx,
                                              pidx
                                            )
                                          }
                                          title="Copiar número de parte"
                                        >
                                          <svg
                                            className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <rect
                                              x="9"
                                              y="9"
                                              width="13"
                                              height="13"
                                              rx="2"
                                              strokeWidth="2"
                                              stroke="currentColor"
                                              fill="none"
                                            />
                                            <rect
                                              x="3"
                                              y="3"
                                              width="13"
                                              height="13"
                                              rx="2"
                                              strokeWidth="2"
                                              stroke="currentColor"
                                              fill="none"
                                            />
                                          </svg>
                                        </button>
                                        {/* Pricing button for related parts */}
                                        <button
                                          type="button"
                                          className="flex-shrink-0 rounded-full border border-green-300 bg-green-50 p-0.5 hover:bg-green-100 focus:outline-none dark:border-green-600 dark:bg-green-900/20 dark:hover:bg-green-900"
                                          title={
                                            t('pricing.get_info') ||
                                            'Get pricing for this part'
                                          }
                                          onClick={() => {
                                            clearPricing(); // Clear any previous pricing data
                                            setPricingForm({
                                              mfr: part.MFRID || '',
                                              partNumber: part.PARTNUMBER || '',
                                              customerName: '',
                                            });
                                            setPricingModalIdx(null);
                                            setPricingRelatedIdx({
                                              itemIdx: idx,
                                              partIdx: pidx,
                                            });
                                            setPricingError(null);
                                            setPricingResult(null);
                                            setPricingStep('search');
                                            setSelectedCustomer(null);
                                            setIsCustomerReady(false);
                                            setShowCustomerDropdown(false);
                                            setPricingLoading(false);
                                          }}
                                        >
                                          <svg
                                            className="h-3.5 w-3.5 text-green-700 dark:text-green-300"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                          </svg>
                                        </button>
                                        {copiedRelatedIdx?.itemIdx === idx &&
                                          copiedRelatedIdx?.partIdx ===
                                            pidx && (
                                            <span className="text-xs text-green-600 dark:text-green-400">
                                              {t('parts_accordion.copied')}
                                            </span>
                                          )}
                                      </div>
                                    </td>
                                    <td className="text-gray-900 px-2 py-1 dark:text-white">
                                      {part.DESCRIPTION}
                                    </td>
                                    <td className="text-gray-900 px-2 py-1 text-right dark:text-white">
                                      {part.QUANTITYLOC}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {relatedParts.length === 0 && (
                        <div className="text-gray-500 mt-2 text-xs">
                          {t('parts_accordion.no_related_parts')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {(transferModalIdx !== null || catTransferOpen) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => {
            setTransferModalIdx(null);
            setCatTransferOpen(false);
            setTransferError(null);
            setTransferSuccess(false);
            setTransferForm({
              mfr: '',
              sku: '',
              quantity: '',
              order: '',
              orderCancelled: 'yes',
            });
            setTransferLoading(false);
          }}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-blue-300 bg-white px-7 py-5 text-black shadow-xl dark:bg-boxdark dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white shadow-md">
              {t('stock_transfer.request') || 'Stock Transfer'}
            </div>

            {transferSuccess ? (
              <div className="text-center">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="mb-4 text-base font-semibold text-blue-700 dark:text-blue-300">
                  {t('stock_transfer.success_message') ||
                    'Transfer request submitted successfully!'}
                </p>
                <button
                  type="button"
                  className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white shadow-md transition-all duration-150 hover:bg-blue-700 active:bg-blue-800"
                  onClick={() => {
                    setTransferModalIdx(null);
                    setCatTransferOpen(false);
                    setTransferSuccess(false);
                    setTransferForm({
                      mfr: '',
                      sku: '',
                      quantity: '',
                      order: '',
                      orderCancelled: 'yes',
                    });
                  }}
                >
                  {t('common.close') || 'Close'}
                </button>
              </div>
            ) : (
              <>
                <p className="mb-4 text-center text-base font-semibold text-blue-700 dark:text-blue-300">
                  {t('stock_transfer.request_transfer') ||
                    'Request Stock Transfer'}
                </p>

                <div className="mb-3">
                  <label className="text-gray-700 dark:text-gray-300 mb-1 block text-xs font-semibold">
                    {t('stock_transfer.order_number') || 'Order Number'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={orderInputRef}
                    type="number"
                    value={transferForm.order}
                    onChange={(e) =>
                      setTransferForm({
                        ...transferForm,
                        order: e.target.value,
                      })
                    }
                    placeholder="Enter order number"
                    className="border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-gray-700 dark:text-gray-300 mb-1 block text-xs font-semibold">
                    {t('stock_transfer.manufacturer') || 'Manufacturer'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={transferForm.mfr}
                    className="border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-full cursor-not-allowed rounded-lg border px-3 py-2 text-sm"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-gray-700 dark:text-gray-300 mb-1 block text-xs font-semibold">
                    {t('stock_transfer.sku') || 'SKU'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={transferForm.sku}
                    className="border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-full cursor-not-allowed rounded-lg border px-3 py-2 text-sm"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-gray-700 dark:text-gray-300 mb-1 block text-xs font-semibold">
                    {t('stock_transfer.quantity') || 'Quantity'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={transferForm.quantity}
                    onChange={(e) =>
                      setTransferForm({
                        ...transferForm,
                        quantity: e.target.value,
                      })
                    }
                    placeholder="Enter quantity"
                    className="border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-gray-700 dark:text-gray-300 mb-1 block text-xs font-semibold">
                    {t('stock_transfer.order_cancelled') ||
                      'Was the order cancelled?'}
                  </label>
                  <select
                    value={transferForm.orderCancelled}
                    onChange={(e) =>
                      setTransferForm({
                        ...transferForm,
                        orderCancelled: e.target.value,
                      })
                    }
                    className="border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white"
                  >
                    <option value="yes">{t('common.yes') || 'Yes'}</option>
                    <option value="no">{t('common.no') || 'No'}</option>
                  </select>
                </div>

                {transferError && (
                  <p className="text-red-500 bg-red-50 dark:bg-red-900/20 mb-3 rounded px-3 py-2 text-center text-xs">
                    {transferError}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 flex-1 rounded-lg py-2 font-semibold shadow-md transition-all duration-150 dark:text-white"
                    onClick={() => {
                      setTransferModalIdx(null);
                      setTransferError(null);
                      setTransferForm({
                        mfr: '',
                        sku: '',
                        quantity: '',
                        order: '',
                        orderCancelled: 'yes',
                      });
                    }}
                    disabled={transferLoading}
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-lg bg-blue-600 py-2 font-semibold text-white shadow-md transition-all duration-150 hover:bg-blue-700 active:bg-blue-800 ${
                      !transferForm.quantity ||
                      !transferForm.order ||
                      transferLoading
                        ? 'cursor-not-allowed opacity-50'
                        : ''
                    }`}
                    onClick={async () => {
                      if (!transferForm.quantity || !transferForm.order) {
                        setTransferError('Please fill in all required fields');
                        return;
                      }

                      try {
                        await requestTransfer({
                          mfr: transferForm.mfr,
                          sku: transferForm.sku,
                          quantity: parseInt(transferForm.quantity),
                          order: parseInt(transferForm.order),
                        });
                        setTransferSuccess(true);
                        setTimeout(() => {
                          setTransferModalIdx(null);
                          setTransferSuccess(false);
                          setTransferForm({
                            mfr: '',
                            sku: '',
                            quantity: '',
                            order: '',
                            orderCancelled: 'yes',
                          });
                        }, 2000);
                      } catch (err) {
                        // Error is already set by the hook
                      }
                    }}
                    disabled={
                      !transferForm.quantity ||
                      !transferForm.order ||
                      transferLoading
                    }
                  >
                    {transferLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        {t('common.submitting') || 'Submitting...'}
                      </span>
                    ) : (
                      t('common.submit') || 'Submit'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {(pricingModalIdx !== null ||
        pricingRelatedIdx !== null ||
        catPricingOpen) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={resetPricingModal}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-green-300 bg-white px-7 py-5 text-black shadow-xl dark:bg-boxdark dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-4 py-1 text-xs font-semibold text-white shadow-md">
              {t('pricing.title') || 'Pricing Information'}
            </div>

            {pricingStep === 'result' && pricingResult ? (
              // Show pricing information
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-base font-semibold text-green-700 dark:text-green-300">
                    {t('pricing.details') || 'Pricing Details'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPricingStep('search');
                      setPricingResult(null);
                      setSelectedCustomer(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-xs underline"
                  >
                    ← {t('pricing.new_search') || 'New search'}
                  </button>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 dark:bg-gray-800 mb-4 rounded-lg p-3">
                  <h4 className="text-gray-700 dark:text-gray-300 mb-2 text-sm font-semibold">
                    {t('pricing.customer_info') || 'Customer Information'}
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div>
                      <strong>{t('pricing.customer_id') || 'ID'}:</strong>{' '}
                      {pricingResult.customer?.id}
                    </div>
                    <div>
                      <strong>{t('pricing.customer_name') || 'Name'}:</strong>{' '}
                      {pricingResult.customer?.name}
                    </div>
                    {pricingResult.customer?.phone && (
                      <div>
                        <strong>
                          {t('pricing.customer_phone') || 'Phone'}:
                        </strong>{' '}
                        {pricingResult.customer.phone}
                      </div>
                    )}
                    {pricingResult.customer?.email && (
                      <div>
                        <strong>
                          {t('pricing.customer_email') || 'Email'}:
                        </strong>{' '}
                        {pricingResult.customer.email}
                      </div>
                    )}
                    <div>
                      <strong>
                        {t('pricing.customer_location') || 'Location'}:
                      </strong>{' '}
                      {pricingResult.customer?.city},{' '}
                      {pricingResult.customer?.state}
                    </div>
                  </div>
                </div>

                {/* Part Info */}
                <div className="bg-gray-50 dark:bg-gray-800 mb-4 rounded-lg p-3">
                  <h4 className="text-gray-700 dark:text-gray-300 mb-2 text-sm font-semibold">
                    {t('pricing.part_info') || 'Part Information'}
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div>
                      <strong>
                        {t('pricing.manufacturer') || 'Manufacturer'}:
                      </strong>{' '}
                      {pricingResult.mfr_id}
                    </div>
                    <div>
                      <strong>
                        {t('pricing.part_number') || 'Part Number'}:
                      </strong>{' '}
                      {pricingResult.part_number}
                    </div>
                  </div>
                </div>

                {/* Pricing Info */}
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-700 dark:bg-green-900/20">
                  <h4 className="mb-2 text-sm font-semibold text-green-700 dark:text-green-300">
                    {t('pricing.details') || 'Pricing Details'}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>
                        {t('pricing.customer_type') || 'Customer Type'}:
                      </span>
                      <span className="font-semibold">
                        {pricingResult.customer_type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('pricing.price_level') || 'Price Level'}:</span>
                      <span className="font-semibold">
                        {pricingResult.customer_price_level}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('pricing.list_price') || 'List Price'}:</span>
                      <span className="font-semibold">
                        ${pricingResult.list_price}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-lg">
                      <span className="font-bold">
                        {t('pricing.net_price') || 'Net Price'}:
                      </span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        ${pricingResult.net_price}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full rounded-lg bg-green-600 py-2 font-semibold text-white shadow-md transition-all duration-150 hover:bg-green-700 active:bg-green-800"
                  onClick={resetPricingModal}
                >
                  {t('common.close') || 'Close'}
                </button>
              </div>
            ) : (
              // Search for customers with auto-complete dropdown
              <>
                <p className="mb-4 text-center text-base font-semibold text-green-700 dark:text-green-300">
                  {t('pricing.get_info') || 'Get Pricing Information'}
                </p>

                {/* Search Field with Dropdown */}
                <div className="relative mb-3">
                  <label className="text-gray-700 dark:text-gray-300 mb-1 block text-xs font-semibold">
                    {t('pricing.customer_search') || 'Customer Search'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={customerInputRef}
                      type="text"
                      value={pricingForm.customerName}
                      onChange={(e) =>
                        setPricingForm({
                          ...pricingForm,
                          customerName: e.target.value,
                        })
                      }
                      onFocus={() => {
                        if (
                          pricingForm.customerName.length >= 3 &&
                          customers &&
                          customers.length > 0
                        ) {
                          setShowCustomerDropdown(true);
                        }
                      }}
                      placeholder={
                        t('pricing.search_placeholder') ||
                        'Type at least 3 characters to search...'
                      }
                      className="border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 w-full rounded-lg border px-3 py-2 pr-10 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-400 dark:text-white"
                      autoComplete="off"
                    />
                    {/* Loading spinner */}
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
                      </div>
                    )}
                    {/* Check icon when customer selected */}
                    {selectedCustomer && !isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg
                          className="h-5 w-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 mt-1 text-xs">
                    {t('pricing.search_hint') ||
                      'Start typing name, email, or phone number (min. 3 characters)'}
                  </div>

                  {/* Customer Dropdown */}
                  {showCustomerDropdown &&
                    customers &&
                    customers.length > 0 && (
                      <div
                        ref={customerDropdownRef}
                        className="border-gray-300 dark:border-gray-700 absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-white shadow-lg dark:bg-boxdark"
                      >
                        {customers.map((customer) => (
                          <div
                            key={customer.CUSTOMERID}
                            className="border-gray-100 dark:border-gray-700 cursor-pointer border-b p-3 transition-colors last:border-b-0 hover:bg-green-50 dark:hover:bg-green-900/20"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setPricingForm({
                                ...pricingForm,
                                customerName: customer.NAME,
                              });
                              setShowCustomerDropdown(false);
                            }}
                          >
                            <div className="text-gray-900 text-sm font-semibold dark:text-white">
                              {customer.NAME}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 mt-1 space-y-0.5 text-xs">
                              <div>ID: {customer.CUSTOMERID}</div>
                              {customer.PHONE && <div>📞 {customer.PHONE}</div>}
                              {customer.EMAIL && <div>📧 {customer.EMAIL}</div>}
                              <div>
                                📍 {customer.CITY}, {customer.STATE}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                {/* MFR (read-only) */}
                <div className="mb-3">
                  <label className="text-gray-700 dark:text-gray-300 mb-1 block text-xs font-semibold">
                    {t('pricing.manufacturer') || 'Manufacturer'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={pricingForm.mfr}
                    className="border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-full cursor-not-allowed rounded-lg border px-3 py-2 text-sm"
                  />
                </div>

                {/* Part Number (read-only) */}
                <div className="mb-4">
                  <label className="text-gray-700 dark:text-gray-300 mb-1 block text-xs font-semibold">
                    {t('pricing.part_number') || 'Part Number'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={pricingForm.partNumber}
                    className="border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-full cursor-not-allowed rounded-lg border px-3 py-2 text-sm"
                  />
                </div>

                {/* Error message */}
                {pricingError && (
                  <p className="text-red-500 bg-red-50 dark:bg-red-900/20 mb-3 rounded px-3 py-2 text-center text-xs">
                    {pricingError}
                  </p>
                )}

                {/* Buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 flex-1 rounded-lg py-2 font-semibold shadow-md transition-all duration-150 dark:text-white"
                    onClick={resetPricingModal}
                    disabled={pricingLoading}
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-lg bg-green-600 py-2 font-semibold text-white shadow-md transition-all duration-150 hover:bg-green-700 active:bg-green-800 ${
                      !isCustomerReady || pricingLoading
                        ? 'cursor-not-allowed opacity-50'
                        : ''
                    }`}
                    onClick={() => {
                      if (isCustomerReady && selectedCustomer) {
                        handlePricingFetch(selectedCustomer);
                      }
                    }}
                    disabled={!isCustomerReady || pricingLoading}
                  >
                    {pricingLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        {t('common.loading') || 'Loading...'}
                      </span>
                    ) : (
                      t('pricing.get_pricing') || 'Get Pricing'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default PartsTable;
