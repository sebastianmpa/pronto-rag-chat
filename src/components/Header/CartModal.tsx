import React, { useEffect, useRef, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useCustomerSearch } from '../../hooks/useCustomerSearch';
import { useSalesRepSearch } from '../../hooks/useSalesRepSearch';
import { useUserProfile } from '../../hooks/useUser';
import { Customer } from '../../types/customers';
import { SalesRep } from '../../types/salesRep';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    lastCustomer,
    setLastCustomer,
    pricingLoading,
    refreshPrices,
  } = useCart();

  const [customerQuery, setCustomerQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const SALES_REP_KEY = 'cart_selected_sales_rep';

  // SalesRep state — inicializado desde localStorage
  const [selectedSalesRep, setSelectedSalesRepState] = useState<SalesRep | null>(() => {
    try {
      const raw = localStorage.getItem(SALES_REP_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [salesRepQuery, setSalesRepQuery] = useState('');
  const [showSalesRepDropdown, setShowSalesRepDropdown] = useState(false);
  const salesRepSearchRef = useRef<HTMLInputElement>(null);
  const salesRepDropdownRef = useRef<HTMLDivElement>(null);

  const setSelectedSalesRep = (rep: SalesRep | null) => {
    setSelectedSalesRepState(rep);
    if (rep) {
      localStorage.setItem(SALES_REP_KEY, JSON.stringify(rep));
    } else {
      localStorage.removeItem(SALES_REP_KEY);
    }
  };

  const { customers, loading: searchLoading, searchCustomers, clearSearch } = useCustomerSearch();
  const { salesReps, loading: salesRepLoading, searchSalesReps, clearSearch: clearSalesRepSearch } = useSalesRepSearch();
  const { profile: userProfile, fetchProfile } = useUserProfile();

  const profileSalesRepId: string =
    userProfile?.userProfile?.salesRepId ??
    userProfile?.salesRepId ??
    '';

  // El salesRepId efectivo: el seleccionado manualmente o el del perfil
  const effectiveSalesRepId = selectedSalesRep?.SALESREPID ?? profileSalesRepId;
  const effectiveSalesRepName = selectedSalesRep?.NAME ?? '';

  // Al abrir el modal, recalcular precios y obtener perfil del usuario
  useEffect(() => {
    if (isOpen) {
      refreshPrices(lastCustomer?.CUSTOMERID);
      fetchProfile();
    }
  }, [isOpen]);

  // Búsqueda con debounce
  useEffect(() => {
    if (customerQuery.trim().length < 3) {
      setShowDropdown(false);
      return;
    }
    const t = setTimeout(() => {
      searchCustomers({ q: customerQuery.trim(), page: 1, limit: 10 });
      setShowDropdown(true);
    }, 300);
    return () => clearTimeout(t);
  }, [customerQuery]);

  // Mostrar dropdown cuando lleguen resultados
  useEffect(() => {
    if (!searchLoading && customers.length > 0 && customerQuery.trim().length >= 3) {
      setShowDropdown(true);
    }
  }, [customers, searchLoading]);

  // Cerrar dropdown de cliente al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        searchRef.current && !searchRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
      if (
        salesRepDropdownRef.current && !salesRepDropdownRef.current.contains(e.target as Node) &&
        salesRepSearchRef.current && !salesRepSearchRef.current.contains(e.target as Node)
      ) {
        setShowSalesRepDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectCustomer = (customer: Customer) => {
    setLastCustomer(customer);
    setCustomerQuery('');
    setShowDropdown(false);
    clearSearch();
    refreshPrices(customer.CUSTOMERID);
  };

  const handleClearCustomer = () => {
    setLastCustomer(null);
    setCustomerQuery('');
    clearSearch();
    refreshPrices(undefined);
  };

  // SalesRep debounce search
  useEffect(() => {
    if (salesRepQuery.trim().length < 1) {
      setShowSalesRepDropdown(false);
      return;
    }
    const t = setTimeout(() => {
      searchSalesReps({ q: salesRepQuery.trim(), page: 1, limit: 20 });
      setShowSalesRepDropdown(true);
    }, 300);
    return () => clearTimeout(t);
  }, [salesRepQuery]);

  useEffect(() => {
    if (!salesRepLoading && salesReps.length > 0) setShowSalesRepDropdown(true);
  }, [salesReps, salesRepLoading]);

  const handleSelectSalesRep = (rep: SalesRep) => {
    setSelectedSalesRep(rep);
    setSalesRepQuery('');
    setShowSalesRepDropdown(false);
    clearSalesRepSearch();
  };

  const handleClearSalesRep = () => {
    setSelectedSalesRep(null);
    setSalesRepQuery('');
    clearSalesRepSearch();
  };

  const handleGenerateOrder = () => {
    const orderLines = items
      .map((item) => `${item.mfrId} | ${item.partNumber} | ${item.description} | Qty: ${item.quantity}`)
      .join('\n');
    alert(`Orden generada:\n\n${orderLines}`);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed left-0 top-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-3xl flex-col rounded-lg bg-white dark:bg-boxdark"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-stroke px-8 py-5 dark:border-strokedark">
          <h3 className="text-xl font-bold text-black dark:text-white">
            Carrito de compras
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-black dark:hover:bg-meta-4 dark:hover:text-white"
            title="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Customer section */}
        <div className="flex-shrink-0 border-b border-stroke bg-gray-50 px-8 py-4 dark:border-strokedark dark:bg-boxdark-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Cliente:
            </span>
            {lastCustomer ? (
              <div className="flex flex-1 items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-black dark:text-white">
                  {lastCustomer.NAME || `${lastCustomer.FIRSTNAME ?? ''} ${lastCustomer.LASTNAME ?? ''}`.trim()}
                  <span className="ml-1 text-xs text-gray-500">({lastCustomer.CUSTOMERID})</span>
                </span>
                <button
                  type="button"
                  onClick={handleClearCustomer}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  title="Cambiar a Guest"
                >
                  ✕
                </button>
                <button
                  type="button"
                  onClick={() => refreshPrices(lastCustomer.CUSTOMERID)}
                  disabled={pricingLoading}
                  className="ml-auto flex items-center gap-1 rounded border border-stroke px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-100 disabled:opacity-40 dark:border-strokedark dark:text-gray-300 dark:hover:bg-meta-4"
                  title="Recalcular precios"
                >
                  {pricingLoading ? (
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                    </svg>
                  )}
                  Recalcular
                </button>
              </div>
            ) : (
              <div className="relative flex flex-1 items-center gap-3">
                <span className="rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-600 dark:bg-meta-4 dark:text-gray-300">
                  Guest (precio de lista)
                </span>
                <div className="relative flex-1">
                  <input
                    ref={searchRef}
                    type="text"
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    placeholder="Buscar cliente..."
                    className="w-full rounded border border-stroke bg-transparent px-3 py-1.5 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                  />
                  {searchLoading && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  )}
                  {showDropdown && customers.length > 0 && (
                    <div
                      ref={dropdownRef}
                      className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark"
                    >
                      {customers.map((c) => (
                        <button
                          key={c.CUSTOMERID}
                          type="button"
                          onMouseDown={() => handleSelectCustomer(c)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-black transition hover:bg-gray-50 dark:text-white dark:hover:bg-meta-4"
                        >
                          <span className="font-medium">{c.NAME}</span>
                          <span className="text-xs text-gray-400">{c.CUSTOMERID}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => refreshPrices(undefined)}
                  disabled={pricingLoading}
                  className="flex items-center gap-1 rounded border border-stroke px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-100 disabled:opacity-40 dark:border-strokedark dark:text-gray-300 dark:hover:bg-meta-4"
                  title="Recalcular precios"
                >
                  {pricingLoading ? (
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                    </svg>
                  )}
                  Recalcular
                </button>
              </div>
            )}
          </div>
          {/* Sales Rep */}
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Vendedor:
            </span>
            {selectedSalesRep ? (
              /* Vendedor seleccionado: muestra badge, oculta input */
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {selectedSalesRep.NAME}
                  <span className="ml-1 text-xs opacity-70">{selectedSalesRep.SALESREPID}</span>
                </span>
                <button
                  type="button"
                  onClick={handleClearSalesRep}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  title="Cambiar vendedor"
                >
                  ✕
                </button>
              </div>
            ) : (
              /* Sin vendedor seleccionado: muestra el del perfil + input de búsqueda */
              <>
                {effectiveSalesRepId && (
                  <span className="rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-700 dark:bg-meta-4 dark:text-gray-300 whitespace-nowrap">
                    {effectiveSalesRepId}
                    <span className="ml-1 text-xs text-gray-400">(perfil)</span>
                  </span>
                )}
                <div className="relative flex-1">
                  <input
                    ref={salesRepSearchRef}
                    type="text"
                    value={salesRepQuery}
                    onChange={(e) => setSalesRepQuery(e.target.value)}
                    placeholder="Buscar vendedor..."
                    className="w-full rounded border border-stroke bg-transparent px-3 py-1.5 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                  />
                  {salesRepLoading && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  )}
                  {showSalesRepDropdown && salesReps.length > 0 && (
                    <div
                      ref={salesRepDropdownRef}
                      className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark"
                    >
                      {salesReps.map((rep) => (
                        <button
                          key={rep.SALESREPID}
                          type="button"
                          onMouseDown={() => handleSelectSalesRep(rep)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-black transition hover:bg-gray-50 dark:text-white dark:hover:bg-meta-4"
                        >
                          <span className="font-medium">{rep.NAME}</span>
                          <span className="text-xs text-gray-400">{rep.SALESREPID}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-8 py-4">
          {items.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <svg className="mx-auto mb-3 h-12 w-12 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm">El carrito está vacío</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stroke text-left text-xs font-semibold text-gray-500 dark:border-strokedark dark:text-gray-400">
                  <th className="pb-3 pr-4">Fabricante</th>
                  <th className="pb-3 pr-4">Parte</th>
                  <th className="pb-3 pr-4">Descripción</th>
                  <th className="pb-3 pr-4 text-right">
                    Precio
                    {pricingLoading && (
                      <span className="ml-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent align-middle" />
                    )}
                  </th>
                  <th className="pb-3 pr-4 text-center">Cantidad</th>
                  <th className="pb-3 text-center">Quitar</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={`${item.mfrId}-${item.partNumber}`}
                    className="border-b border-stroke last:border-0 dark:border-strokedark"
                  >
                    <td className="py-3 pr-4 font-medium text-black dark:text-white">
                      {item.mfrId}
                    </td>
                    <td className="py-3 pr-4 font-mono text-black dark:text-white">
                      {item.partNumber}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-300 max-w-[200px] truncate">
                      {item.description}
                    </td>
                    <td className="py-3 pr-4 text-right font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                      {pricingLoading ? (
                        <span className="text-gray-400">...</span>
                      ) : item.netPrice != null ? (
                        `$${Number(item.netPrice).toFixed(2)}`
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.mfrId, item.partNumber, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded border border-stroke bg-gray-100 text-black transition hover:bg-gray-200 dark:border-strokedark dark:bg-boxdark-2 dark:text-white dark:hover:bg-meta-4"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) updateQuantity(item.mfrId, item.partNumber, val);
                          }}
                          className="w-14 rounded border border-stroke bg-transparent px-2 py-1 text-center text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.mfrId, item.partNumber, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded border border-stroke bg-gray-100 text-black transition hover:bg-gray-200 dark:border-strokedark dark:bg-boxdark-2 dark:text-white dark:hover:bg-meta-4"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item.mfrId, item.partNumber)}
                        className="flex h-7 w-7 items-center justify-center rounded text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                        title="Quitar del carrito"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-stroke dark:border-strokedark">
          {/* Total */}
          {items.length > 0 && (
            <div className="flex items-center justify-end gap-3 border-b border-stroke px-8 py-3 dark:border-strokedark">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total:</span>
              <span className="text-lg font-bold text-black dark:text-white">
                {pricingLoading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent align-middle" />
                ) : (
                  `$${items.reduce((sum, item) => sum + (item.netPrice ?? 0) * item.quantity, 0).toFixed(2)}`
                )}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between px-8 py-5">
            <button
              type="button"
              onClick={clearCart}
              disabled={items.length === 0}
              className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
              Limpiar carrito
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleGenerateOrder}
                disabled={items.length === 0}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-black transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Generar orden
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartModal;
