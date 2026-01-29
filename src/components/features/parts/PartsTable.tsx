import { useMemo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePartInfo } from '../../../hooks/usePartInfo';
import { useStockTransfer } from '../../../hooks/useStockTransfer';
import { PartInfo } from '../../../types/partInfo';

const PartsTable = () => {
  const { t } = useTranslation();
  const [partNumberFilter, setPartNumberFilter] = useState('');
  const [showTable, setShowTable] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | string | null>(null);
  const [copiedRelatedIdx, setCopiedRelatedIdx] = useState<{ itemIdx: number; partIdx: number } | null>(null);
  const [viewingLocation, setViewingLocation] = useState<{ [key: string]: 1 | 4 }>({});
  const [transferModalIdx, setTransferModalIdx] = useState<number | null>(null);
  const [transferForm, setTransferForm] = useState({ mfr: '', sku: '', quantity: '', order: '', orderCancelled: 'yes' });
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const orderInputRef = useRef<HTMLInputElement>(null);
  const { requestTransfer: hookRequestTransfer } = useStockTransfer();

  // Hook para obtener la info de la parte
  const { partInfoList, loading: loadingPart, error, fetchPartInfo } = usePartInfo(partNumberFilter);

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

  const handleCopyRelated = (partNumber: string, itemIdx: number, partIdx: number) => {
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
  
  // Focus on order input when modal opens
  useEffect(() => {
    if (transferModalIdx !== null && orderInputRef.current) {
      setTimeout(() => orderInputRef.current?.focus(), 100);
    }
  }, [transferModalIdx]);

  return (
    <section className="data-table-common rounded-sm border border-stroke bg-white py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* Page title (use translation key if available, fallback to literal) */}
      <div className="px-8 pt-6 pb-2">
        <h2 className="text-lg font-semibold text-black dark:text-white">{t('parts.related_parts_information') || 'Related Parts Information'}</h2>
      </div>
      {/* Formulario de búsqueda */}
      <form
        className="w-full px-8 py-6 bg-white dark:bg-boxdark-2 border-x border-b border-stroke dark:border-strokedark rounded-b-lg shadow-sm"
        onSubmit={handleSubmit}
      >
        <div>
          <label htmlFor="partNumberFilter" className="block text-sm font-medium text-gray-700 mb-4">
            {t('parts_table.part_number')}
          </label>
          <div className="relative">
            <input
              id="partNumberFilter"
              type="text"
              value={partNumberFilter}
              onChange={e => setPartNumberFilter(e.target.value)}
              className="w-full rounded-md border border-stroke bg-gray-50 dark:bg-transparent px-4 py-3 pr-12 text-sm text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-strokedark dark:focus:border-primary"
              placeholder={t('parts_table.enter_part_number')}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent focus:outline-none text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loadingPart}
              title={t('parts_table.search')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </form>

      {/* Errores */}
      {error && (
        <div className="text-center text-red-500 py-6 px-8">{error}</div>
      )}

      {/* Sin resultados */}
      {showTable && !loadingPart && partInfoList.length === 0 && !error && (
        <div className="text-center text-gray-500 py-8 px-8">{t('parts_table.no_parts_found')}</div>
      )}

      {/* Resultados */}
      {showTable && !loadingPart && partInfoList.length > 0 && (
        <div className="mt-6 px-8">
          <div className="space-y-4">
            {groupedData.map((group, idx) => {
              const defaultLocation = (group.loc1 ? 1 : (group.loc4 ? 4 : 1)) as 1 | 4;
              const currentLocation = viewingLocation[idx] || defaultLocation;
              let item = currentLocation === 1 ? group.loc1 : group.loc4;

              if (!item) {
                item = currentLocation === 1 ? group.loc4 : group.loc1;
              }

              if (!item) return null;

              const general = item.general_info || {};
              const relatedParts = item.related_parts || [];
              const hasAlternateLocation = currentLocation === 1 ? !!group.loc4 : !!group.loc1;
              const alternateLocation = currentLocation === 1 ? 4 : 1;

              return (
                <div key={idx} className="mb-4 border border-stroke dark:border-strokedark rounded-lg overflow-hidden shadow-sm bg-white dark:bg-boxdark">
                  {/* Header del acordeón */}
                  <div className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-boxdark-2 hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors border-b border-stroke dark:border-strokedark">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {item.productThumbnailImage && item.productThumbnailImage.startsWith('http') && (
                        <img src={item.productThumbnailImage} alt="thumb" className="w-10 h-10 object-contain rounded border" />
                      )}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <span className="truncate">{item.mfrId}</span>
                          <button
                            type="button"
                            onClick={async () => {
                              setPartNumberFilter(item.partNumber);
                              setShowTable(true);
                              await fetchPartInfo();
                            }}
                            className="truncate text-blue-600 dark:text-blue-400 hover:underline font-bold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            title={`Search for ${item.partNumber}`}
                          >
                            {item.partNumber}
                          </button>
                          <span className="truncate flex-1">{general.DESCRIPTION || item.description || '-'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>{t('parts_accordion.location')}: {item.location}</span>
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
                                className="ml-1 text-blue-600 dark:text-blue-400 font-medium hover:underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
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

                    <div className="flex flex-col items-end justify-center mr-2 ml-3">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {t('parts_accordion.quantity')}: {item.qty_loc}
                      </span>
                      {hasAlternateLocation && (
                        <div className="mt-1">
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
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-2">
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 border border-transparent focus:outline-none"
                        onClick={async () => {
                          setPartNumberFilter(item.partNumber);
                          setShowTable(true);
                          await fetchPartInfo();
                        }}
                      >
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
                          <rect x="3" y="3" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
                        </svg>
                      </button>
                      {copiedIdx === idx && (
                        <span className="text-xs text-green-600 dark:text-green-400">{t('parts_accordion.copied')}</span>
                      )}
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
                      <button
                        type="button"
                        onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-meta-4 border border-transparent focus:outline-none"
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

                      {/* Partes relacionadas */}
                      {relatedParts.length > 0 && (
                        <div>
                          <div className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {t('parts_accordion.related_products')}
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border border-stroke dark:border-strokedark">
                              <thead className="bg-white dark:bg-boxdark">
                                <tr>
                                  <th className="px-2 py-1 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">
                                    {t('parts_accordion.mfr_id')}
                                  </th>
                                  <th className="px-2 py-1 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">
                                    {t('parts_accordion.part_number')}
                                  </th>
                                  <th className="px-2 py-1 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">
                                    {t('parts_accordion.description')}
                                  </th>
                                  <th className="px-2 py-1 text-right font-medium text-gray-700 dark:text-gray-300 border-b border-stroke dark:border-strokedark">
                                    {t('parts_accordion.qty')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-boxdark">
                                {relatedParts.map((part, pidx) => (
                                  <tr key={pidx} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-boxdark-2">
                                    <td className="px-2 py-1 text-gray-900 dark:text-white">{part.MFRID}</td>
                                    <td className="px-2 py-1 text-gray-900 dark:text-white">
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            setPartNumberFilter(part.PARTNUMBER);
                                            setShowTable(true);
                                            await fetchPartInfo();
                                          }}
                                          className="text-blue-600 dark:text-blue-400 hover:underline font-bold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                          title={`Search for ${part.PARTNUMBER}`}
                                        >
                                          {part.PARTNUMBER}
                                        </button>
                                        <button
                                          type="button"
                                          className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900 border border-transparent focus:outline-none flex-shrink-0"
                                          onClick={async () => {
                                            handleCopyRelated(part.PARTNUMBER, idx, pidx);
                                            setPartNumberFilter(part.PARTNUMBER);
                                            setShowTable(true);
                                            await fetchPartInfo();
                                          }}
                                        >
                                          <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
                                            <rect x="3" y="3" width="13" height="13" rx="2" strokeWidth="2" stroke="currentColor" fill="none" />
                                          </svg>
                                        </button>
                                        {copiedRelatedIdx?.itemIdx === idx && copiedRelatedIdx?.partIdx === pidx && (
                                          <span className="text-xs text-green-600 dark:text-green-400">{t('parts_accordion.copied')}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-2 py-1 text-gray-900 dark:text-white">{part.DESCRIPTION}</td>
                                    <td className="px-2 py-1 text-right text-gray-900 dark:text-white">{part.QUANTITYLOC}</td>
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
        </div>
      )}

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
              <>
                <p className="mb-4 text-base font-semibold text-blue-700 dark:text-blue-300 text-center">
                  {t('stock_transfer.request_transfer') || 'Request Stock Transfer'}
                </p>
                
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
                
                {transferError && (
                  <p className="text-red-500 text-xs mb-3 text-center bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                    {transferError}
                  </p>
                )}
                
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
    </section>
  );
};

export default PartsTable;
