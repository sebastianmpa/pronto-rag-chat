import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DropdownDefault from '../components/Dropdowns/DropdownDefault';
import DefaultLayout from '../layout/DefaultLayout';
import { useMyConversationsPaginated, useMyConversationById } from '../hooks/useConversation';
import { getMyConversationsPaginated } from '../libs/ConversationService';
import { format } from 'date-fns';
import { useUserProfile } from '../hooks/useUser';
import { sendMessageToConversationService } from '../libs/ConversationService';
import { RatingBubble, RatingType } from '../components/RatingBubble';
import { useRating } from '../hooks/useRating';
import { useStockTransfer } from '../hooks/useStockTransfer';
import { usePricing } from '../hooks/usePricing';
import { useCustomerSearch } from '../hooks/useCustomerSearch';

// Helper functions
const formatDate = (date: string) => {
  return format(new Date(date), 'MMMM d, yyyy');
};

// Helper para extraer texto y tabla del content
// Helper para extraer texto y tabla del content
const parseMessageContent = (content: string, _hasTable?: boolean, tableData?: { partInfo?: any[] }): { text: string; tableData: any[] | null } => {
  // Si tenemos tableData estructurado del nuevo formato de respuesta, priorizarlo
  if (tableData?.partInfo && Array.isArray(tableData.partInfo)) {
    console.log('[parseMessageContent] ✅ Using structured tableData with', tableData.partInfo.length, 'items');
    return { text: content, tableData: tableData.partInfo };
  }
  
  // Si no hay tableData estructurado, no hay tabla
  return { text: content, tableData: null };
};

// Formatea los mensajes del assistant para saltos de línea y URLs
const renderMessageContent = (content: string, role?: string, onSkuClick?: (sku: string) => void) => {
  // Try to parse as JSON if it looks like JSON
  let displayContent = content;
  let isJsonError = false;
  
  // Primero, intenta parsear la primera capa de JSON (string que contiene JSON)
  if (content.trim().startsWith('"') && content.trim().endsWith('"')) {
    try {
      displayContent = JSON.parse(content);
    } catch (e) {
      // Si falla, mantener el contenido original
    }
  }
  
  // Ahora intenta parsear como JSON (segunda capa o JSON directo)
  if (displayContent.trim().startsWith('{') && displayContent.trim().endsWith('}')) {
    try {
      let parsed = JSON.parse(displayContent);
      
      // Si tiene un campo error, extraer ese
      if (parsed.error) {
        displayContent = parsed.error;
        isJsonError = true;
      }
    } catch (e) {
      // Si falla el parseo, intentar con estrategias alternativas
      try {
        // Estrategia 1: Reemplazar valores de Python con null/true/false
        let normalized = displayContent
          .replace(/:\s*None\b/g, ': null')
          .replace(/:\s*True\b/g, ': true')
          .replace(/:\s*False\b/g, ': false');
        
        let parsed = JSON.parse(normalized);
        if (parsed.error) {
          displayContent = parsed.error;
          isJsonError = true;
        }
      } catch (e2) {
        // Si sigue fallando, usar el contenido original
        displayContent = content;
      }
    }
  }
  
  if (role === 'assistant') {
    // Regex for Markdown links: [text](url)
    const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+[\w/])\)/g;
    // Regex for plain URLs
    const urlRegex = /(https?:\/\/[^\s)]+[\w/])/g;
    // Regex for HTML tags: <b class='pronto-sku'>text</b>
    const htmlTagRegex = /<b\s+class=['"]pronto-sku['"]\s*>([^<]+)<\/b>/g;
    
    // Split by line breaks first
    return displayContent.split(/\n|\r\n/).map((line, idx) => {
      let parts: (string | JSX.Element)[] = [];
      let lastIdx = 0;
      let match;
      
      // First, process SKU tags <b class='pronto-sku'>text</b>
      lastIdx = 0;
      htmlTagRegex.lastIndex = 0;
      while ((match = htmlTagRegex.exec(line)) !== null) {
        if (match.index > lastIdx) {
          parts.push(line.slice(lastIdx, match.index));
        }
        const skuText = match[1];
        parts.push(
          <span
            key={`pronto-sku-${idx}-${match.index}`}
            className="font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
            onClick={() => onSkuClick && onSkuClick(skuText)}
            title={`Click to check stock for ${skuText}`}
          >
            {skuText}
          </span>
        );
        lastIdx = match.index + match[0].length;
      }
      if (lastIdx < line.length) {
        parts.push(line.slice(lastIdx));
      }
      
      // Then, replace Markdown links with anchor tags
      parts = parts.flatMap((part, i) => {
        if (typeof part !== 'string') return [part];
        
        let subParts: (string | JSX.Element)[] = [];
        let subLastIdx = 0;
        let mdMatch;
        
        while ((mdMatch = mdLinkRegex.exec(part)) !== null) {
          if (mdMatch.index > subLastIdx) {
            subParts.push(part.slice(subLastIdx, mdMatch.index));
          }
          subParts.push(
            <a
              key={mdMatch[2] + i}
              href={mdMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="underline break-all text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              {mdMatch[1]}
            </a>
          );
          subLastIdx = mdMatch.index + mdMatch[0].length;
        }
        if (subLastIdx < part.length) {
          subParts.push(part.slice(subLastIdx));
        }
        
        return subParts;
      });
      
      // Finally, process plain URLs
      parts = parts.flatMap((part, i) => {
        if (typeof part !== 'string') return [part];
        return part.split(urlRegex).map((sub, j) => {
          let url = sub;
          let isUrl = false;
          if (/^https?:\/\//.test(sub)) {
            isUrl = true;
            if (url.endsWith(')')) {
              const open = url.slice(0, -1).split('(').length - 1;
              const close = url.slice(0, -1).split(')').length - 1;
              if (open > close) {
                url = url.slice(0, -1);
              }
            }
          }
          if (isUrl) {
            const isPdf = url.trim().toLowerCase().endsWith('.pdf');
            return (
              <a
                key={url + '-' + i + '-' + j}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline break-all text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {isPdf ? 'Download file' : 'Open link'}
              </a>
            );
          }
          return sub;
        });
      });
      
      // If it was a JSON error, show it in a styled container
      if (isJsonError && idx === 0) {
        return (
          <div 
            key={idx}
            className="rounded-sm border border-yellow-500 bg-yellow-50 p-3 text-yellow-700 dark:border-yellow-600 dark:bg-yellow-900 dark:text-yellow-200"
          >
            {parts}
          </div>
        );
      }
      
      return <React.Fragment key={idx}>{parts}<br /></React.Fragment>;
    });
  }
  // Usuario: solo texto plano
  return displayContent;
};



// Nuevo componente: PartsAccordion
const PartsAccordion: React.FC<{ data: any[]; messageId: string; onSupersededClick?: (superseded: string) => void }> = ({ data, messageId: _messageId, onSupersededClick }) => {
  const { t } = useTranslation();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | string | null>(null);
  const [copiedRelatedIdx, setCopiedRelatedIdx] = useState<{ itemIdx: number; partIdx: number } | null>(null);
  const [viewingLocation, setViewingLocation] = useState<{ [key: string]: 1 | 4 }>({});
  const [transferModalIdx, setTransferModalIdx] = useState<number | null>(null);
  const [transferForm, setTransferForm] = useState({ mfr: '', sku: '', quantity: '', order: '', orderCancelled: 'yes' });
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [pricingModalIdx, setPricingModalIdx] = useState<number | null>(null);
  const [pricingForm, setPricingForm] = useState({ mfr: '', partNumber: '', customerName: '' });
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [pricingResult, setPricingResult] = useState<any>(null);
  const [pricingStep, setPricingStep] = useState<'search' | 'select' | 'result'>('search');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isCustomerReady, setIsCustomerReady] = useState(false);
  const [pricingRelatedIdx, setPricingRelatedIdx] = useState<{itemIdx: number, partIdx: number} | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const orderInputRef = useRef<HTMLInputElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const { requestTransfer: hookRequestTransfer } = useStockTransfer();
  const { 
    pricing,
    loading: pricingHookLoading,
    error: pricingHookError,
    fetchPricing 
  } = usePricing();
  const { 
    customers,
    loading: customerSearchLoading,
    error: customerSearchError,
    searchCustomers 
  } = useCustomerSearch();
  
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
        limit: 10 // Load only 10 customers for better performance
      });
    } catch (err: any) {
      setPricingError(err?.message || 'Failed to search for customers');
      setShowCustomerDropdown(false);
      setIsSearching(false);
    }
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
        setPricingError('No customers found with that search term');
        setShowCustomerDropdown(false);
        setIsSearching(false);
      }
    } else {
      setIsSearching(false);
    }
  }, [customers, customerSearchLoading, customerSearchError, pricingForm.customerName, selectedCustomer]);
  
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
        customerId: customer.CUSTOMERID
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
    setPricingError(null);
    setPricingResult(null);
    setPricingStep('search');
    setSelectedCustomer(null);
    setIsCustomerReady(false);
    setShowCustomerDropdown(false);
    setIsSearching(false);
    setPricingForm({ mfr: '', partNumber: '', customerName: '' });
  };
  
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
  
  if (!Array.isArray(data)) {
    console.log('[PartsAccordion] Data is not an array:', typeof data);
    return null;
  }
  
  console.log('[PartsAccordion] Received data:', data.length, 'items');
  if (data.length > 0) {
    console.log('[PartsAccordion] First item:', data[0]);
  }
  
  // Helper: Agrupar partes por mfrId + partNumber y luego por ubicación
  const groupedData = useMemo(() => {
    const grouped = new Map<string, { loc1?: any; loc4?: any }>();
    
    data.forEach((item, idx) => {
      const mfrId = item.mfrId || item.MFRID || 'UNKNOWN';
      const partNumber = item.partNumber || item.PARTNUMBER || 'UNKNOWN';
      const key = `${mfrId}|${partNumber}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, {});
      }
      const group = grouped.get(key)!;
      
      // Si no tiene location definido, asumir que es location 1
      // Convertir a número si es string
      const location = parseInt(String(item.location)) || 1;
      
      if (location === 1) {
        group.loc1 = item;
      } else if (location === 4) {
        group.loc4 = item;
      }
      
      console.log(`[PartsAccordion] Item ${idx}: mfrId=${mfrId}, partNumber=${partNumber}, location=${location}`);
    });
    
    const result = Array.from(grouped.values());
    console.log('[PartsAccordion] Grouped data:', result.length, 'groups');
    return result;
  }, [data]);
  
  // Helper to copy part number
  const handleCopy = (partNumber: string, idx: number | string) => {
    if (!partNumber) return;
    navigator.clipboard.writeText(partNumber);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1200);
  };
  
  // Helper to copy related part number
  const handleCopyRelated = (partNumber: string, itemIdx: number, partIdx: number) => {
    if (!partNumber) return;
    navigator.clipboard.writeText(partNumber);
    setCopiedRelatedIdx({ itemIdx, partIdx });
    setTimeout(() => setCopiedRelatedIdx(null), 1200);
  };

  // Handler for superseded click
  const handleSupersededClick = (superseded: string) => {
    if (onSupersededClick && superseded && superseded !== '-') {
      onSupersededClick(superseded);
    }
  };
  
  return (
    <div className="mt-3 w-full mx-auto">
      {groupedData.map((group, idx) => {
        console.log(`[PartsAccordion Render] Group ${idx}:`, group);
        
        // Determinar qué ubicación mostrar por defecto (preferir 1, luego 4)
        const defaultLocation = (group.loc1 ? 1 : (group.loc4 ? 4 : 1)) as 1 | 4;
        const currentLocation = viewingLocation[idx] || defaultLocation;
        let item = currentLocation === 1 ? group.loc1 : group.loc4;
        
        // Si la ubicación actual no existe, intentar usar la otra
        if (!item) {
          item = currentLocation === 1 ? group.loc4 : group.loc1;
        }
        
        // Si aún no hay item, no mostrar nada
        if (!item) {
          console.log(`[PartsAccordion Render] Group ${idx} has no item, skipping`);
          return null;
        }
        
        console.log(`[PartsAccordion Render] Group ${idx} rendering with item:`, item);
        
        const general = item.general_info || {};
        const relatedParts = item.related_parts || [];
        const pricing = item.pricing || {};
        const mfrId = general.MFRID || item.mfrId || '-';
        const partNumber = general.PARTNUMBER || item.partNumber || '-';
        const description = general.DESCRIPTION || '-';
        const ubicacion = item.location || '-';
        const superseded = item.superseded || general.SUPERCEDETO || '-';
        const cantidad = item.qty_loc ?? general.QTY_LOC ?? '-';
        const netPrice = pricing.net_price ?? null;
        const hasAlternateLocation = currentLocation === 1 ? !!group.loc4 : !!group.loc1;
        
        return (
          <div key={idx} className="mb-4 border border-stroke dark:border-strokedark rounded-lg overflow-hidden shadow-sm bg-white dark:bg-boxdark w-full mx-auto">
            {/* Header del acordeón */}
            <div className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-boxdark-2 hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors border-b border-stroke dark:border-strokedark">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {item.productThumbnailImage && item.productThumbnailImage.startsWith('http') && (
                  <img src={item.productThumbnailImage} alt="thumb" className="w-10 h-10 object-contain rounded border" />
                )}
                <div className="flex flex-col min-w-0 flex-1">
                  {/* Primera línea: MFRID PARTNUMBER DESCRIPTION (sin separador) */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <span className="truncate">{mfrId}</span>
                    <span className="truncate">{partNumber}</span>
                    <span className="truncate flex-1">{description}</span>
                  </div>
                  {/* Segunda línea: Location y Superseded a la izquierda */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span className="truncate">{t('parts_accordion.location')}: {ubicacion ?? '-'}</span>
                    <span className="flex items-center gap-1">
                      <span className="truncate">{t('parts_accordion.superseded')}: 
                        {superseded && superseded !== '' && superseded !== '-' ? (
                          <button
                            type="button"
                            onClick={() => handleSupersededClick(superseded)}
                            className="ml-1 text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                            title={`Click to search for stock ${superseded}`}
                          >
                            {superseded}
                          </button>
                        ) : (
                          <span className="ml-1">-</span>
                        )}
                      </span>
                      {superseded && superseded !== '' && superseded !== '-' && (
                        <button
                          type="button"
                          className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900 border border-transparent focus:outline-none flex-shrink-0"
                          title={t('parts_accordion.copy_part_number')}
                          onClick={() => handleCopy(superseded, `superseded-${idx}`)}
                        >
                          <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
                            <rect x="3" y="3" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
                          </svg>
                        </button>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              {/* Quantity and Price alineados a la derecha en su propia columna */}
              <div className="flex flex-col items-end justify-center mr-2 ml-3">
                {/* Quantity y Price en la misma línea */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">{t('parts_accordion.quantity')}: {cantidad ?? '-'}</span>
                  {netPrice !== null && netPrice !== undefined && (
                    <span className="text-sm font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                      ${Number(netPrice).toFixed(2)}
                    </span>
                  )}
                </div>
                {/* Botón para cambiar de ubicación si existe alternativa */}
                <div className="flex items-center gap-2 mt-1">
                  {hasAlternateLocation && (
                    <div className="inline-flex items-center bg-gray-100 dark:bg-boxdark-2 rounded-full p-1 gap-1 border-2 border-stroke dark:border-strokedark" role="tablist" aria-label="Locations switch">
                      <button
                        type="button"
                        onClick={() => setViewingLocation(prev => ({ ...prev, [idx]: 1 }))}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${currentLocation === 1 ? 'bg-primary text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}
                        title={`${t('parts_accordion.view_location')} 1`}
                        aria-pressed={currentLocation === 1}
                      >
                        1
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewingLocation(prev => ({ ...prev, [idx]: 4 }))}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${currentLocation === 4 ? 'bg-primary text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}
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
                    className="p-1.5 rounded-full transition-colors bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-800 dark:hover:bg-green-700 dark:text-green-200 border border-green-300 dark:border-green-600"
                    title="Get pricing information"
                    onClick={() => {
                      setPricingForm({ 
                        mfr: mfrId, 
                        partNumber: partNumber, 
                        customerName: '' 
                      });
                      setPricingModalIdx(idx);
                      setPricingError(null);
                      setPricingResult(null);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {/* Transfer button - ONLY SHOW ON LOCATION 4 */}
                {currentLocation === 4 && (
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 border border-transparent focus:outline-none"
                    title={t('stock_transfer.request') || 'Request transfer'}
                    onClick={() => {
                      setTransferForm({ mfr: item.mfrId, sku: item.partNumber, quantity: '', order: '', orderCancelled: 'yes' });
                      setTransferModalIdx(idx);
                      setTransferError(null);
                      setTransferSuccess(false);
                    }}
                  >
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                )}
                {/* Copy button */}
                <button
                  type="button"
                  className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 border border-transparent focus:outline-none"
                  title={t('parts_accordion.copy_part_number')}
                  onClick={() => handleCopy(partNumber, idx)}
                >
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
                    <rect x="3" y="3" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
                  </svg>
                </button>
                {copiedIdx === idx && (
                  <span className="text-xs text-green-600 dark:text-green-400 ml-1">{t('parts_accordion.copied')}</span>
                )}
                {/* Expand/collapse button */}
                <button
                  type="button"
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-meta-4 border border-transparent focus:outline-none"
                  title={expandedIdx === idx ? 'Close' : 'Open'}
                >
                  <svg
                    className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${expandedIdx === idx ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Contenido expandido */}
            {expandedIdx === idx && (
              <div className="p-4">
                {item.productStandarImage && item.productStandarImage.startsWith('http') && (
                  <div className="mb-3 flex justify-center">
                    <img src={item.productStandarImage} alt="main" className="max-h-40 object-contain rounded border" />
                  </div>
                )}
                {/* Mostrar superseded_list alineado a la izquierda, con título, si tiene valores válidos */}
                {Array.isArray(item.superseded_list) && item.superseded_list.filter(x => x && x !== 'null' && x !== null).length > 0 && (
                  <div className="mb-3 text-xs text-gray-700 dark:text-gray-300 text-left">
                    <span className="font-semibold">{t('parts_accordion.superseded_list')}:</span> {item.superseded_list.filter(x => x && x !== 'null' && x !== null).join('  >>  ')}
                  </div>
                )}
                {/* Título de la tabla */}
                {relatedParts && relatedParts.length > 0 && (
                  <div className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{t('parts_accordion.related_products')}</div>
                )}
                {/* Tabla de partes relacionadas */}
                {relatedParts && relatedParts.length > 0 && (
                  <div className="overflow-x-auto min-w-[600px]">
                    <table className="w-full text-xs border border-stroke dark:border-strokedark">
                      <thead className="bg-white dark:bg-boxdark">
                        <tr>
                          <th className="px-2 py-1 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">{t('parts_accordion.mfr_id')}</th>
                          <th className="px-2 py-1 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">{t('parts_accordion.part_number')}</th>
                          <th className="px-2 py-1 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">{t('parts_accordion.description')}</th>
                          <th className="px-2 py-1 text-right font-medium text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">{t('parts_accordion.qty')}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-boxdark">
                        {relatedParts.map((part: any, pidx: number) => (
                          <tr key={pidx} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-boxdark-2">
                            <td className="px-2 py-1 text-gray-900 dark:text-white">{part.MFRID || '-'}</td>
                            <td className="px-2 py-1 text-gray-900 dark:text-white">
                              <div className="flex items-center gap-1">
                                <span 
                                  onClick={() => onSupersededClick && onSupersededClick(part.PARTNUMBER)}
                                  className="cursor-pointer hover:underline text-blue-600 dark:text-blue-400 font-medium"
                                  title={`Click to check stock for ${part.PARTNUMBER}`}
                                >
                                  {part.PARTNUMBER || '-'}
                                </span>
                                {part.PARTNUMBER && (
                                  <>
                                    <button
                                      type="button"
                                      className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900 border border-transparent focus:outline-none flex-shrink-0"
                                      title={t('parts_accordion.copy_part_number')}
                                      onClick={() => handleCopyRelated(part.PARTNUMBER, idx, pidx)}
                                    >
                                      <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
                                        <rect x="3" y="3" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
                                      </svg>
                                    </button>
                                    {/* Pricing button for related parts */}
                                    <button
                                      type="button"
                                      className="p-0.5 rounded-full hover:bg-green-100 dark:hover:bg-green-900 border border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20 focus:outline-none flex-shrink-0"
                                      title="Get pricing for this part"
                                      onClick={() => {
                                        setPricingForm({ 
                                          mfr: part.MFRID || '', 
                                          partNumber: part.PARTNUMBER || '', 
                                          customerName: '' 
                                        });
                                        setPricingRelatedIdx({itemIdx: idx, partIdx: pidx});
                                        setPricingError(null);
                                        setPricingResult(null);
                                        setPricingStep('search');
                                        setSelectedCustomer(null);
                                      }}
                                    >
                                      <svg className="w-3.5 h-3.5 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                                {copiedRelatedIdx?.itemIdx === idx && copiedRelatedIdx?.partIdx === pidx && (
                                  <span className="text-xs text-green-600 dark:text-green-400">{t('parts_accordion.copied')}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-1 text-gray-900 dark:text-white">{part.DESCRIPTION || '-'}</td>
                            <td className="px-2 py-1 text-right text-gray-900 dark:text-white min-w-[60px]">{part.QUANTITYLOC ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Si no hay partes relacionadas */}
                {(!relatedParts || relatedParts.length === 0) && (
                  <div className="text-xs text-gray-500 mt-2">{t('parts_accordion.no_related_parts')}</div>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Stock Transfer Modal */}
      {transferModalIdx !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            // Close modal when clicking overlay and reset form/state
            setTransferModalIdx(null);
            setTransferError(null);
            setTransferSuccess(false);
            setTransferForm({ mfr: '', sku: '', quantity: '', order: '', orderCancelled: 'yes' });
            setTransferLoading(false);
          }}
        >
          <div
            className="rounded-2xl border border-blue-300 bg-white dark:bg-boxdark text-black dark:text-white py-5 px-7 shadow-xl w-full max-w-sm relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white rounded-full px-4 py-1 text-xs font-semibold shadow-md">
              {t('stock_transfer.request') || 'Stock Transfer'}
            </div>
            
            {transferSuccess ? (
              // Success state
              <div className="text-center">
                <div className="mb-4">
                  <svg className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-blue-700 dark:text-blue-300 mb-4">
                  {t('stock_transfer.success_message') || 'Transfer request submitted successfully!'}
                </p>
                <button
                  type="button"
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md transition-all duration-150"
                  onClick={() => {
                    setTransferModalIdx(null);
                    setTransferSuccess(false);
                    setTransferForm({ mfr: '', sku: '', quantity: '', order: '', orderCancelled: 'yes' });
                  }}
                >
                  {t('common.close') || 'Close'}
                </button>
              </div>
            ) : (
              // Form state
              <>
                <p className="mb-4 text-base font-semibold text-blue-700 dark:text-blue-300 text-center">
                  {t('stock_transfer.request_transfer') || 'Request Stock Transfer'}
                </p>
                
                {/* Order Number - FIRST FIELD - NUMERIC ONLY */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('stock_transfer.order_number') || 'Order Number'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={orderInputRef}
                    type="number"
                    value={transferForm.order}
                    onChange={e => setTransferForm({ ...transferForm, order: e.target.value })}
                    placeholder="Enter order number"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                  />
                </div>
                
                {/* MFR (read-only) - PRECARGADO */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('stock_transfer.manufacturer') || 'Manufacturer'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={transferForm.mfr}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  />
                </div>
                
                {/* SKU (read-only) - PRECARGADO */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('stock_transfer.sku') || 'SKU'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={transferForm.sku}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  />
                </div>
                
                {/* Quantity - PRECARGADO (vacío) */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('stock_transfer.quantity') || 'Quantity'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={transferForm.quantity}
                    onChange={e => setTransferForm({ ...transferForm, quantity: e.target.value })}
                    placeholder="Enter quantity"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                  />
                </div>
                
                {/* Order Cancelled - SELECT (VISIBLE BUT NOT SENT) */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('stock_transfer.order_cancelled') || 'Was the order cancelled?'}
                  </label>
                  <select
                    value={transferForm.orderCancelled}
                    onChange={e => setTransferForm({ ...transferForm, orderCancelled: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                  >
                    <option value="yes">{t('common.yes') || 'Yes'}</option>
                    <option value="no">{t('common.no') || 'No'}</option>
                  </select>
                </div>
                
                {/* Error message */}
                {transferError && (
                  <p className="text-red-500 text-xs mb-3 text-center bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                    {transferError}
                  </p>
                )}
                
                {/* Buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold shadow-md transition-all duration-150"
                    onClick={() => {
                      setTransferModalIdx(null);
                      setTransferError(null);
                      setTransferForm({ mfr: '', sku: '', quantity: '', order: '', orderCancelled: 'yes' });
                    }}
                    disabled={transferLoading}
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md transition-all duration-150 ${
                      !transferForm.quantity || !transferForm.order || transferLoading ? 'opacity-50 cursor-not-allowed' : ''
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
                          order: parseInt(transferForm.order)
                        });
                        setTransferSuccess(true);
                        // Auto-close after 2 seconds
                        setTimeout(() => {
                          setTransferModalIdx(null);
                          setTransferSuccess(false);
                          setTransferForm({ mfr: '', sku: '', quantity: '', order: '', orderCancelled: 'yes' });
                        }, 2000);
                      } catch (err) {
                        // Error is already set by the hook
                      }
                    }}
                    disabled={!transferForm.quantity || !transferForm.order || transferLoading}
                  >
                    {transferLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
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
      {(pricingModalIdx !== null || pricingRelatedIdx !== null) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={resetPricingModal}
        >
          <div
            className="rounded-2xl border border-green-300 bg-white dark:bg-boxdark text-black dark:text-white py-5 px-7 shadow-xl w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white rounded-full px-4 py-1 text-xs font-semibold shadow-md">
              {t('pricing.title') || 'Pricing Information'}
            </div>
            
            {pricingStep === 'result' && pricingResult ? (
              // Show pricing information
              <div>
                <div className="flex items-center justify-between mb-4">
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
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    ← {t('pricing.new_search') || 'New search'}
                  </button>
                </div>
                
                {/* Customer Info */}
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('pricing.customer_info') || 'Customer Information'}</h4>
                  <div className="text-xs space-y-1">
                    <div><strong>{t('pricing.customer_id') || 'ID'}:</strong> {pricingResult.customer?.id}</div>
                    <div><strong>{t('pricing.customer_name') || 'Name'}:</strong> {pricingResult.customer?.name}</div>
                    {pricingResult.customer?.phone && (
                      <div><strong>{t('pricing.customer_phone') || 'Phone'}:</strong> {pricingResult.customer.phone}</div>
                    )}
                    {pricingResult.customer?.email && (
                      <div><strong>{t('pricing.customer_email') || 'Email'}:</strong> {pricingResult.customer.email}</div>
                    )}
                    <div><strong>{t('pricing.customer_location') || 'Location'}:</strong> {pricingResult.customer?.city}, {pricingResult.customer?.state}</div>
                  </div>
                </div>

                {/* Part Info */}
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('pricing.part_info') || 'Part Information'}</h4>
                  <div className="text-xs space-y-1">
                    <div><strong>{t('pricing.manufacturer') || 'Manufacturer'}:</strong> {pricingResult.mfr_id}</div>
                    <div><strong>{t('pricing.part_number') || 'Part Number'}:</strong> {pricingResult.part_number}</div>
                  </div>
                </div>

                {/* Pricing Info */}
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">{t('pricing.details') || 'Pricing Details'}</h4>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>{t('pricing.customer_type') || 'Customer Type'}:</span>
                      <span className="font-semibold">{pricingResult.customer_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('pricing.price_level') || 'Price Level'}:</span>
                      <span className="font-semibold">{pricingResult.customer_price_level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('pricing.list_price') || 'List Price'}:</span>
                      <span className="font-semibold">${pricingResult.list_price}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-lg">
                      <span className="font-bold">{t('pricing.net_price') || 'Net Price'}:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">${pricingResult.net_price}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  type="button"
                  className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold shadow-md transition-all duration-150"
                  onClick={resetPricingModal}
                >
                  {t('common.close') || 'Close'}
                </button>
              </div>
            ) : (
              // Search for customers with auto-complete dropdown
              <>
                <p className="mb-4 text-base font-semibold text-green-700 dark:text-green-300 text-center">
                  {t('pricing.get_info') || 'Get Pricing Information'}
                </p>
                
                {/* Search Field with Dropdown */}
                <div className="mb-3 relative">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('pricing.customer_search') || 'Customer Search'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={customerInputRef}
                      type="text"
                      value={pricingForm.customerName}
                      onChange={e => setPricingForm({ ...pricingForm, customerName: e.target.value })}
                      onFocus={() => {
                        if (pricingForm.customerName.length >= 3 && customers && customers.length > 0) {
                          setShowCustomerDropdown(true);
                        }
                      }}
                      placeholder={t('pricing.search_placeholder') || 'Type at least 3 characters to search...'}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 pr-10 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-400 focus:outline-none transition-all"
                      autoComplete="off"
                    />
                    {/* Loading spinner */}
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {/* Check icon when customer selected */}
                    {selectedCustomer && !isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('pricing.search_hint') || 'Start typing name, email, or phone number (min. 3 characters)'}
                  </div>
                  
                  {/* Customer Dropdown */}
                  {showCustomerDropdown && customers && customers.length > 0 && (
                    <div
                      ref={customerDropdownRef}
                      className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto bg-white dark:bg-boxdark border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg"
                    >
                      {customers.map((customer) => (
                        <div
                          key={customer.CUSTOMERID}
                          className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setPricingForm({ ...pricingForm, customerName: customer.NAME });
                            setShowCustomerDropdown(false);
                          }}
                        >
                          <div className="font-semibold text-sm text-gray-900 dark:text-white">{customer.NAME}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5 mt-1">
                            <div>ID: {customer.CUSTOMERID}</div>
                            {customer.PHONE && <div>📞 {customer.PHONE}</div>}
                            {customer.EMAIL && <div>📧 {customer.EMAIL}</div>}
                            <div>📍 {customer.CITY}, {customer.STATE}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* MFR (read-only) */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('pricing.manufacturer') || 'Manufacturer'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={pricingForm.mfr}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  />
                </div>
                
                {/* Part Number (read-only) */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('pricing.part_number') || 'Part Number'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={pricingForm.partNumber}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  />
                </div>
                
                {/* Error message */}
                {pricingError && (
                  <p className="text-red-500 text-xs mb-3 text-center bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                    {pricingError}
                  </p>
                )}
                
                {/* Buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold shadow-md transition-all duration-150"
                    onClick={resetPricingModal}
                    disabled={pricingLoading}
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold shadow-md transition-all duration-150 ${
                      !isCustomerReady || pricingLoading ? 'opacity-50 cursor-not-allowed' : ''
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
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
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
    </div>
  );
};



const MessagesMe: React.FC = () => {
  const { t } = useTranslation();
  const [pageOffset, setPageOffset] = useState<number | null>(null);
  // Search state for chat list
  const [searchTerm, setSearchTerm] = useState('');
  // Animación CSS para los puntos de typing
  const typingDotsStyle = `
    @keyframes chat-typing {
      0% { opacity: 0.2; }
      20% { opacity: 1; }
      100% { opacity: 0.2; }
    }
    .chat-typing-dots {
      display: inline-flex;
      gap: 4px;
      height: 1em;
      align-items: center;
    }
    .chat-typing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #888;
      opacity: 0.2;
      animation: chat-typing 1.2s infinite;
    }
    .chat-typing-dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    .chat-typing-dot:nth-child(3) {
      animation-delay: 0.4s;
    }
  `;
  const { profile: userProfile } = useUserProfile();
  // Commands available in the chat UI (like ChatGPT slash commands)
  const commands = [
    { name: '/fix', description: 'Autocompleta el chat para corregir el mensaje' },
    // Add more commands here as needed
  ];
  const inputRef = useRef<HTMLInputElement>(null);
  const [commandsOpen, setCommandsOpen] = useState(false);
  const commandsBtnRef = useRef<HTMLButtonElement>(null);
  const commandsMenuRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut (Ctrl+Shift+I) to toggle commands menu and global click/esc handlers
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        setCommandsOpen((s) => !s);
      }
      if (e.key === 'Escape') {
        setCommandsOpen(false);
      }
    };

    const clickHandler = (ev: MouseEvent) => {
      const target = ev.target as Node;
      if (commandsOpen) {
        if (
          commandsMenuRef.current && commandsBtnRef.current &&
          !commandsMenuRef.current.contains(target) && !commandsBtnRef.current.contains(target)
        ) {
          setCommandsOpen(false);
        }
      }
    };

    document.addEventListener('keydown', keyHandler);
    document.addEventListener('click', clickHandler);
    return () => {
      document.removeEventListener('keydown', keyHandler);
      document.removeEventListener('click', clickHandler);
    };
  }, [commandsOpen]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  // typing: true solo mientras espera respuesta del backend
  // const [typing, setTyping] = useState(false); // Unused

  // Hook para crear conversación
  // const { conversation, loading: loadingCreate, error: errorCreate, handleCreateConversation } = useConversation(); // Unused

  // Hooks para mis conversaciones
  const { data: chats, loading: loadingChats } = useMyConversationsPaginated({ page, limit });
  const [pollChats, setPollChats] = useState<any>(null);

  // Polling: refresh chats every 5 seconds
  useEffect(() => {
    let ignore = false;
    const poll = async () => {
      try {
        const result = await getMyConversationsPaginated(page, limit);
        if (!ignore) setPollChats(result);
      } catch (e) {
        // ignore polling errors
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => { ignore = true; clearInterval(interval); };
  }, [page, limit]);

  // Polling: refresh chats every 5 seconds
  // (Obsolete polling code removed)
  // Filtered chats based on search
  const filteredChats = (pollChats?.items || chats?.items || []).filter(chat => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      chat.store_domain?.toLowerCase().includes(term) ||
      chat.last_detected_model?.toLowerCase().includes(term) ||
      chat.last_detected_part?.toLowerCase().includes(term) ||
      chat.lang?.toLowerCase().includes(term)
    );
  }) ?? [];
  // Solo obtener detalles si el chat es existente
  const conversationId = selectedChat && !selectedChat.isNew ? (selectedChat?.id || selectedChat?.conversation_id || '') : '';
  const { data: chatDetail, loading: loadingDetail } = useMyConversationById(conversationId);

  // Ref para scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  // Mensajes locales que aún no han sido confirmados por el backend
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  // Estado de error para mostrar mensajes de error
  const [error] = useState<string | null>(null);
  // Efecto typing del assistant
  const [assistantTyping, setAssistantTyping] = useState(false);
  // Rating state
  const { submitRating, loading: ratingLoading, error: ratingError } = useRating();
  const [showRatingBubble, setShowRatingBubble] = useState(false);
  const [conversationEnded, setConversationEnded] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  // Scroll automático cada vez que cambian los mensajes (locales o backend)
  useEffect(() => {
    scrollToBottom();
  }, [chatDetail?.conversation_message, localMessages, assistantTyping]);

  // Scroll to bottom when rating modal appears
  useEffect(() => {
    if (showRatingBubble) {
      scrollToBottom();
    }
  }, [showRatingBubble]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // Crear nueva conversación al seleccionar 'New Chat' (solo UI, sin request)
  const handleNewChat = () => {
    const userName = userProfile?.firstName || userProfile?.name || '';
    setSelectedChat(null);
    setLocalMessages([]);
    setAssistantTyping(false);
    setTimeout(() => {
      setSelectedChat({ id: 'new', isNew: true });
      setLocalMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: t('welcome', { userName }),
          createdAt: new Date().toISOString(),
        }
      ]);
    }, 0);
  };

  const handleTyping = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const message = inputValue.trim();
      if (message) {
        handleSubmit(message);
      }
    }
  };

  // Handler para clic en superseded - envía mensaje "stock + superseded"
  const handleSupersededClicked = (superseded: string) => {
    const message = `stock ${superseded}`;
    handleSubmit(message);
  };

  // Enviar mensaje o crear conversación
  const sendMessageToConversation = async (payload: {
    customer_id: string;
    question: string;
    lang: string;
    store_domain: string;
    conversation_id?: string;
  }) => {
    // Si conversation_id existe, lo incluye; si no, crea nueva conversación
    return await sendMessageToConversationService(payload);
  };

  const handleSubmit = async (message?: string) => {
    try {
      const messageContent = message || inputValue.trim();
      if (!messageContent) return;

      // DEBUG: Mensaje que se va a enviar
      console.log('[DEBUG] handleSubmit - messageContent:', messageContent);
      console.log('[DEBUG] selectedChat:', selectedChat);
      console.log('[DEBUG] userProfile:', userProfile);

      // Mostrar el mensaje del usuario inmediatamente
      setLocalMessages(prev => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          role: 'user',
          content: messageContent,
          createdAt: new Date().toISOString(),
        }
      ]);
      setInputValue('');
      setAssistantTyping(true);

      let apiResponse = null;

      if (selectedChat?.isNew && selectedChat?.id === 'new') {
        // Usar el customer_id guardado en localStorage
        const customerId = localStorage.getItem('customer_id');
        console.log('[DEBUG] Nuevo chat - customerId (localStorage):', customerId);
        if (!customerId || typeof customerId !== 'string' || customerId.length !== 36) {
          setLocalMessages(prev => [
            ...prev,
            {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: 'Error: No se pudo obtener el ID de usuario para crear la conversación.',
              createdAt: new Date().toISOString(),
            }
          ]);
          setAssistantTyping(false);
          return;
        }
        // Enviar la petición correctamente
        try {
          // Asegura que lang sea BCP 47 válido
          let lang = navigator.language || 'en-US';
          if (typeof lang !== 'string' || !lang.match(/^[a-zA-Z]{2,3}(-[a-zA-Z]{2,3})?$/)) {
            lang = 'en-US';
          }
          const payload = {
            customer_id: customerId,
            question: messageContent,
            lang,
            store_domain: 'www.smallenginesprodealer.com',
          };
          console.log('[DEBUG] Nuevo chat - payload:', payload);
          const result = await sendMessageToConversation(payload);
          console.log('[DEBUG] Nuevo chat - API result:', result);
          apiResponse = result;
          if (result && result.conversation_id) {
            setSelectedChat({
              id: result.conversation_id,
              store_domain: result.store_domain || 'www.smallenginesprodealer.com',
            });
          }
        } catch (err) {
          console.error('[DEBUG] Nuevo chat - API error:', err);
          setLocalMessages(prev => [
            ...prev,
            {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: err?.message === 'Request timed out after 1 minute'
                ? 'Error: El chat tardó demasiado en responder. Inténtalo de nuevo.'
                : 'Error, inténtalo de nuevo.',
              createdAt: new Date().toISOString(),
            }
          ]);
        }
      } else if (selectedChat?.id) {
        // Retomar conversación existente y enviar mensaje
        try {
          const payload = {
            customer_id: chatDetail?.customer_id ?? '',
            question: messageContent,
            lang: chatDetail?.lang || navigator.language || 'en-US',
            store_domain: chatDetail?.store_domain || 'www.smallenginesprodealer.com',
            conversation_id: selectedChat.id,
          };
          apiResponse = await sendMessageToConversation(payload);
        } catch (err) {
          console.error('[DEBUG] Retomar chat - API error:', err);
          setLocalMessages(prev => [
            ...prev,
            {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: err?.message === 'Request timed out after 1 minute'
                ? 'Error: El chat tardó demasiado en responder. Inténtalo de nuevo.'
                : 'Error, inténtalo de nuevo.',
              createdAt: new Date().toISOString(),
            }
          ]);
        }
      }

      // Mostrar el mensaje del assistant si hay answer o table_data
      if (apiResponse && (apiResponse.answer || apiResponse.table_data)) {
        setLocalMessages(prev => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: apiResponse.answer || '',
            table: apiResponse.table || (apiResponse.table_data && apiResponse.table_data.partInfo ? true : false), // Boolean que indica si hay tabla
            table_data: apiResponse.table_data, // Nueva estructura de datos
            createdAt: new Date().toISOString(),
          }
        ]);
      }

      // Mostrar el modal de calificación si close_chat viene en true, aunque answer esté vacío
      if (apiResponse && apiResponse.close_chat === true) {
        setTimeout(() => {
          setConversationEnded(true);
          setShowRatingBubble(true);
        }, 1000);
      }

      // Cuando la respuesta llegue y chatDetail se actualice, borra los mensajes locales
      if (apiResponse) {
        setAssistantTyping(false);
        // Deja los mensajes locales hasta que el backend actualice la conversación
        // (no borres los mensajes locales aquí)
      } else {
        setAssistantTyping(false);
        // Si no hubo respuesta, no borres los mensajes locales (ya se muestra error)
      }
    } catch (error) {
      setAssistantTyping(false);
      setLocalMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Error, inténtalo de nuevo.',
          createdAt: new Date().toISOString(),
        }
      ]);
      console.error('[DEBUG] handleSubmit - error:', error);
    }
  };

  // Handler for rating submission
  function handleRatingSubmit(rating: RatingType, comment?: string) {
    submitRating({
      conversation_id: conversationId,
      rating,
      comment,
    });
    setRatingSubmitted(true);
    setShowRatingBubble(false);
    setConversationEnded(false);
    setLocalMessages([{
      id: `thanks-${Date.now()}`,
      role: 'assistant',
      content: 'Thank you for your feedback!',
      createdAt: new Date().toISOString(),
    }]);
  }

  useEffect(() => {
    // Si la conversación cambia, borra los mensajes locales, el efecto typing y oculta el rating bubble
    setShowRatingBubble(false);
    setConversationEnded(false);
    if (!assistantTyping) {
      setLocalMessages([]);
      setAssistantTyping(false);
    }
    // Clear input and close commands when switching conversations so leftover commands (eg. /fix) don't persist
    setInputValue('');
    setCommandsOpen(false);
    // If assistantTyping está activo, don't clear local messages or typing animation
  }, [conversationId]);

  // Measure header + content wrapper padding and compute offset to size the chat container
  useEffect(() => {
    const measure = () => {
      try {
        const header = document.querySelector('header');
        const contentWrapper = document.querySelector('main > div');
        const headerH = header ? (header as HTMLElement).getBoundingClientRect().height : 0;
        let padTop = 0;
        let padBottom = 0;
        if (contentWrapper) {
          const cs = getComputedStyle(contentWrapper as Element);
          padTop = parseFloat(cs.paddingTop || '0') || 0;
          padBottom = parseFloat(cs.paddingBottom || '0') || 0;
        }
        const total = Math.round(headerH + padTop + padBottom);
        setPageOffset(total);
      } catch (e) {
        // ignore
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    const headerEl = document.querySelector('header');
    const wrapperEl = document.querySelector('main > div');
    if (headerEl) ro.observe(headerEl);
    if (wrapperEl) ro.observe(wrapperEl);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, []);

  return (
    <DefaultLayout noPadding>
      {/* Mostrar error si existe */}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded mb-2 text-center">
          {error}
        </div>
      )}
      <div className="min-h-0">
        <div
          style={pageOffset ? { height: `calc(100vh - ${pageOffset}px)` } : undefined}
          className="h-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark xl:flex w-full"
        >
          {/* Chat List */}
          <div className="hidden h-full flex-col xl:flex xl:w-72 bg-white dark:bg-boxdark border-r-2 border-blue-300">
            {/* Header */}
            <div className="border-b border-stroke dark:border-strokedark px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-medium text-black dark:text-white whitespace-nowrap">
                  {t('my_chats')} <span className="text-xs ml-1">{chats?.totalItems ?? 0}</span>
                </h4>
                <button
                  onClick={handleNewChat}
                  className="inline-flex items-center justify-center rounded-lg bg-primary py-2 px-2.5 sm:px-4 text-sm font-medium text-white hover:bg-opacity-90 transition-all"
                >
                  <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline whitespace-nowrap">{t('new_chat')}</span>
                  <span className="inline sm:hidden">{t('new_chat')}</span>
                </button>
              </div>
            </div>
            {/* Comandos panel removed per request */}
            {/* Chats per page selector */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3 border-b border-stroke dark:border-strokedark">
              <label htmlFor="limit" className="text-sm font-medium text-black dark:text-white whitespace-nowrap">
                {t('show_last')}
              </label>
              <select
                id="limit"
                value={limit}
                onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                className="ml-2 rounded border border-stroke bg-white dark:bg-boxdark-2 dark:border-strokedark px-2 py-1 text-sm dark:text-white"
              >
                {[5, 10, 20, 50].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            {/* Search */}
            <div className="px-4 sm:px-6 py-2 sm:py-3 border-b border-stroke dark:border-strokedark">
              <form className="relative" onSubmit={e => e.preventDefault()}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full rounded border border-stroke bg-gray-2 dark:bg-boxdark-2 py-2 sm:py-2.5 pl-4 sm:pl-5 pr-10 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
                  placeholder={t('search')}
                  disabled={loadingChats}
                />
                <button type="submit" className="absolute top-1/2 right-4 -translate-y-1/2">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M8.25 3C5.3505 3 3 5.3505 3 8.25C3 11.1495 5.3505 13.5 8.25 13.5C11.1495 13.5 13.5 11.1495 13.5 8.25C13.5 5.3505 11.1495 3 8.25 3ZM1.5 8.25C1.5 4.52208 4.52208 1.5 8.25 1.5C11.9779 1.5 15 4.52208 15 8.25C15 11.9779 11.9779 15 8.25 15C4.52208 15 1.5 11.9779 1.5 8.25Z" fill="#637381" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M11.957 11.958C12.2499 11.6651 12.7247 11.6651 13.0176 11.958L16.2801 15.2205C16.573 15.5133 16.573 15.9882 16.2801 16.2811C15.9872 16.574 15.5124 16.574 15.2195 16.2811L11.957 13.0186C11.6641 12.7257 11.6641 12.2508 11.957 11.958Z" fill="#637381" />
                  </svg>
                </button>
              </form>
            </div>
            {/* Chat list */}
            <div className="flex-1 overflow-auto">
              <div className="space-y-0">
                {loadingChats && (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    {t('loading_chats')}
                  </div>
                )}
                {filteredChats.map((chat) => {
                  // El título será el abstract, si no existe, fallback a los otros campos
                  const chatTitle = chat.abstract || chat.last_detected_model || chat.last_detected_part || chat.lang || chat.store_domain;
                  return (
                    <div
                      key={chat.id}
                      className={`flex cursor-pointer items-center border-b border-stroke dark:border-strokedark py-3 px-6 hover:bg-gray-2 dark:hover:bg-boxdark-2 transition-colors ${
                        selectedChat?.id === chat.id ? 'bg-gray-2 dark:bg-boxdark-2' : ''
                      }`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="relative mr-3.5 h-11 w-11 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-800 flex items-center justify-center">
                        <span className="text-sm font-medium text-black dark:text-white">
                          A
                        </span>
                        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 bg-success"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-black dark:text-white truncate">
                          {chatTitle}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          Pronto Mowers
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Chat Box */}
          <div className="flex h-full flex-col border-l border-stroke dark:border-strokedark w-full flex-1 bg-white dark:bg-boxdark min-h-0">
            {selectedChat?.id ? (
              <>
                <div className="sticky top-0 flex items-center justify-between border-b border-stroke px-6 py-3 dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white z-10">
                  <div className="flex items-center">
                    <div className="mr-3.5 h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-800 flex items-center justify-center">
                      <span className="text-lg font-medium text-black dark:text-white">A</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-black dark:text-white">
                        {selectedChat.isNew ? t('new_chat') : (chatDetail?.abstract || chatDetail?.last_detected_model || chatDetail?.store_domain || t('chat'))}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Pronto Mowers</p>
                    </div>
                  </div>
                  <div>
                    <DropdownDefault />
                  </div>
                </div>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-auto px-6 py-7.5 space-y-3.5">
                    {loadingDetail && !selectedChat.isNew && (
                      <div className="flex justify-center py-8">
                        <span className="text-gray-500 dark:text-gray-400">Loading conversation...</span>
                      </div>
                    )}
                    {selectedChat.isNew ? (
                      <>
                        {/* Mensaje de bienvenida del assistant */}
                        <div className="flex justify-start">
                          <div className="max-w-xs">
                            <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                              {t('assistant')}
                            </p>
                              <div className="rounded-2xl border border-blue-300 bg-white dark:bg-boxdark text-black dark:text-white py-3 px-4">
                                <p className="text-sm text-[105%] break-words">
                                  {localMessages.length > 0 && localMessages[0].role === 'assistant'
                                    ? renderMessageContent(localMessages[0].content, 'assistant', handleSupersededClicked)
                                    : ''}
                                </p>
                              </div>
                          </div>
                        </div>
                        {/* Mensajes locales del usuario */}
                        {localMessages.filter(m => m.role === 'user').map(msg => (
                          <div className="flex justify-end" key={msg.id}>
                            <div className="max-w-xs">
                              <div className="rounded-2xl border border-blue-700 bg-blue-600 text-white py-3 px-4">
                                <p className="text-sm text-[105%] break-words">{msg.content}</p>
                              </div>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {/* Animación de typing del assistant */}
                        {assistantTyping && (
                          <div className="flex justify-start">
                            <div className="max-w-xs">
                              <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">{t('assistant')}</p>
                              <div className="rounded-2xl rounded-tl-none bg-gray-2 dark:bg-boxdark-2 text-black dark:text-white py-3 px-4 flex items-center">
                                <span className="chat-typing-dots">
                                  <span className="chat-typing-dot"></span>
                                  <span className="chat-typing-dot"></span>
                                  <span className="chat-typing-dot"></span>
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        <style>{typingDotsStyle}</style>
                      </>
                    ) : (() => {
                      // Mensajes locales + mensajes reales
                      const allMessages = [...chatDetail?.conversation_message ?? [], ...localMessages];
                       if (!allMessages.length) return null;
                       // Filtrar mensajes del assistant con 'No answer found'
                       const filteredMessages = allMessages.map(msg => {
                         if (msg.role === 'assistant' && msg.content && msg.content.trim().toLowerCase() === 'no answer found') {
                           return {
                           ...msg,
                           content: "Thank you for your rating and feedback! Your input helps us improve our service."
                           };
                         }
                         return msg;
                       });
                       let lastDate = '';
                       return <>
                         {filteredMessages.map((msg) => {
                           const msgDate = formatDate(msg.createdAt);
                           const showDate = msgDate !== lastDate;
                           lastDate = msgDate;
                           
                           // Detectar automáticamente si el mensaje tiene tabla/acordeón
                           let hasTable = false;
                           if (msg.role === 'assistant') {
                             // 1. Si tiene table_data con partInfo (nuevo formato estructurado)
                             if (msg.table_data && msg.table_data.partInfo && Array.isArray(msg.table_data.partInfo)) {
                               hasTable = true;
                               console.log('[hasTable detection] ✅ New structured table_data format detected with partInfo array');
                             }
                             // 2. Si viene el flag table (formato legacy)
                             else if (msg.table === true) {
                               hasTable = true;
                               console.log('[hasTable detection] Flag msg.table === true (legacy)');
                             } else if (typeof msg.content === 'string') {
                               const trimmed = msg.content.trim();
                               
                               // 3. Si contiene el patrón _____{'partInfo':...} - PRIORITY: check FIRST (legacy)
                               if (msg.content.includes('_____') && msg.content.includes('partInfo')) {
                                 hasTable = true;
                                 console.log('[hasTable detection] ✅ Embedded partInfo pattern detected (legacy)');
                               }
                               // 3. Si incluye el separador antiguo
                               else if (msg.content.includes('--------')) {
                                 hasTable = true;
                                 console.log('[hasTable detection] Separator "--------" found (legacy)');
                               }
                               // 4. Si el string STARTS with [ (pure JSON array) - must start AND end with [ ]
                               else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                                 // Additional check: must contain { to be array of objects
                                 if (trimmed.includes('{')) {
                                   hasTable = true;
                                   console.log('[hasTable detection] ✅ Array pattern detected (legacy)');
                                 }
                               }
                               // 5. Si el string STARTS with { (pure JSON object) - must start AND end with { }
                               else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                                 // Additional check: must contain typical part fields
                                 if (trimmed.includes('partNumber') || trimmed.includes('related_parts') || trimmed.includes('general_info') || trimmed.includes('MFRID') || trimmed.includes('PARTNUMBER')) {
                                   hasTable = true;
                                   console.log('[hasTable detection] Object pattern detected (legacy)');
                                 }
                               }
                               else {
                                 console.log('[hasTable detection] ❌ No pattern match (legacy). Content starts with:', trimmed.substring(0, 50));
                               }
                             }
                           }
                           // Parsear el content si tiene tabla
                           const { text, tableData } = hasTable
                             ? parseMessageContent(msg.content, true, msg.table_data)
                             : { text: msg.content, tableData: null };
                           
                           // Si hasTable es true y el text está vacío o es solo JSON, no mostrar texto
                           const shouldRenderText = !hasTable || (text && text.trim().length > 0 && !text.trim().startsWith('[') && !text.trim().startsWith('{'));
                           
                           console.log('[Render] hasTable:', hasTable, '| tableData type:', Array.isArray(tableData) ? `Array[${tableData.length}]` : typeof tableData, '| shouldRenderText:', shouldRenderText);
                           
                           return (
                             <React.Fragment key={msg.id}>
                               {showDate && (
                                 <div className="flex justify-center my-4">
                                   <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-boxdark-2 text-xs text-gray-600 dark:text-gray-400 border border-gray-200">
                                     {msgDate}
                                   </span>
                                 </div>
                               )}
                               <div className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                                   <div className={msg.role === 'user' ? 'max-w-md' : 'max-w-full'}>
                                   {msg.role !== 'user' && (
                                     <p className="mb-2 text-xs font-medium text-blue-700 dark:text-blue-300">
                                       {t('assistant')}
                                     </p>
                                   )}
                                   <div className={`rounded-2xl py-3 px-4 border shadow-md ${
                                     msg.role === 'user'
                                       ? 'border-blue-700 bg-blue-600 text-white'
                                       : 'border-blue-300 bg-white text-blue-900 dark:bg-boxdark-2 dark:text-white'
                                   }`}
                                   >
                                     {shouldRenderText && (
                                       <p className="text-sm text-[105%] break-words">
                                         {renderMessageContent(text, msg.role, handleSupersededClicked)}
                                       </p>
                                     )}
                                     {/* Mostrar acordeón si tableData es array */}
                                     {msg.role === 'assistant' && tableData && Array.isArray(tableData) && (
                                       <PartsAccordion data={tableData} messageId={msg.id} onSupersededClick={handleSupersededClicked} />
                                     )}
                                   </div>
                                   <div className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                     <div className="flex items-center gap-3 flex-wrap">
                                       <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                       {/* Mostrar conversation_context si existe en el mensaje */}
                                       {msg.role === 'assistant' && msg.conversation_context && (
                                         <div className="text-xs text-gray-600 dark:text-gray-400 flex flex-wrap gap-x-3 gap-y-1 items-center">
                                           {msg.conversation_context.intent && (
                                             <span><span className="font-semibold text-gray-700 dark:text-gray-300">{t('conversation_context.intent')}:</span> {msg.conversation_context.intent}</span>
                                           )}
                                           {msg.conversation_context.mfr && (
                                             <span><span className="font-semibold text-gray-700 dark:text-gray-300">{t('conversation_context.manufacturer')}:</span> {msg.conversation_context.mfr}</span>
                                           )}
                                           {msg.conversation_context.model && (
                                             <span><span className="font-semibold text-gray-700 dark:text-gray-300">{t('conversation_context.model')}:</span> {msg.conversation_context.model}</span>
                                           )}
                                           {msg.conversation_context.serial && (
                                             <span><span className="font-semibold text-gray-700 dark:text-gray-300">{t('conversation_context.serial')}:</span> {msg.conversation_context.serial}</span>
                                           )}
                                           {msg.conversation_context.part && (
                                             <span><span className="font-semibold text-gray-700 dark:text-gray-300">{t('conversation_context.component')}:</span> {msg.conversation_context.part}</span>
                                           )}
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             </React.Fragment>
                           ); 
                         })}
                        {/* Efecto de typing del assistant */}
                        {assistantTyping && (
                          <div className="flex justify-start">
                            <div className="max-w-xs">
                              <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">{t('assistant')}</p>
                              <div className="rounded-2xl rounded-tl-none bg-gray-2 dark:bg-boxdark-2 text-black dark:text-white py-3 px-4 flex items-center">
                                <span className="chat-typing-dots">
                                  <span className="chat-typing-dot"></span>
                                  <span className="chat-typing-dot"></span>
                                  <span className="chat-typing-dot"></span>
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Animación de los puntos de typing (CSS inyectado) */}
                        <style>{typingDotsStyle}</style>
                      </>;
                    })()}
                    {/* Show rating bubble if needed */}
                     {showRatingBubble && (
                       <div className="flex justify-start">
                         <div className="max-w-xs">
                           <div className="rounded-2xl border border-blue-300 bg-white dark:bg-boxdark text-black dark:text-white py-3 px-4">
                             <RatingBubble
                               onSubmit={handleRatingSubmit}
                               loading={ratingLoading}
                               error={ratingError}
                             />
                           </div>
                         </div>
                       </div>
                     )}
                    <div ref={messagesEndRef} />
                  </div>
                  {/* Input fijo abajo */}
                  <div className="border-t border-stroke bg-white dark:border-strokedark dark:bg-boxdark sticky bottom-0 z-10">
                     <div className="py-5 px-6">
                       <form className="flex items-center justify-between space-x-4" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
                         <div className="flex items-center gap-3 flex-1">
                           <button
                             ref={commandsBtnRef}
                             type="button"
                             aria-expanded={commandsOpen}
                            title="Abrir comandos (Ctrl/Cmd+Shift+I)"
                             onClick={() => setCommandsOpen((s) => !s)}
                             className="h-10 w-10 flex items-center justify-center rounded-md bg-primary text-white hover:bg-primary/90 transition-all"
                           >
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                               <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                               <path d="M12 8v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                               <path d="M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                             </svg>
                           </button>
                           <div className="relative flex-1">
                             <input
                               ref={inputRef}
                               type="text"
                               value={inputValue}
                               onChange={e => setInputValue(e.target.value)}
                               placeholder={t('type_message')}
                               disabled={assistantTyping}
                               className="h-12 w-full rounded-md border border-stroke bg-gray-2 dark:bg-boxdark-2 pl-4 pr-12 text-sm text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                               onKeyDown={handleTyping}
                             />

                             {/* Floating vertical commands menu (appears above the input) */}
                             {commandsOpen && (
                               <div ref={commandsMenuRef} className="absolute left-0 bottom-full mb-2 w-48 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-md shadow-lg z-50">
                                 <ul className="p-1">
                                   {commands.map((cmd) => (
                                     <li key={cmd.name}>
                                       <button
                                         type="button"
                                         onClick={() => {
                                           const insert = `${cmd.name} `;
                                           setInputValue((prev) => (prev ? `${insert}${prev}` : insert));
                                           setCommandsOpen(false);
                                           setTimeout(() => {
                                             const el = inputRef.current;
                                             if (el) {
                                               const pos = insert.length;
                                               el.focus();
                                               el.setSelectionRange(pos, pos);
                                             }
                                           }, 0);
                                         }}
                                         className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-boxdark-2 transition-colors flex items-center gap-3"
                                       >
                                         <span className="font-mono text-sm text-blue-600">{cmd.name}</span>
                                         <span className="text-xs text-gray-500 dark:text-gray-400">{cmd.description}</span>
                                       </button>
                                     </li>
                                   ))}
                                 </ul>
                               </div>
                             )}
                           </div>
                         </div>
                         <button 
                           type="submit"
                           disabled={assistantTyping}
                           className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-primary text-white hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                             <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                             <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                           </svg>
                         </button>
                       </form>
                       <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                         {t('disclaimer')}
                       </div>
                     </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('select_chat')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default MessagesMe;