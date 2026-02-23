import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePricing } from '../../../hooks/usePricing';
import { useCustomerSearch } from '../../../hooks/useCustomerSearch';

const PricingAndCustomerExample = () => {
  const { t } = useTranslation();
  const [mfrId, setMfrId] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pricing hook
  const {
    pricing,
    loading: pricingLoading,
    error: pricingError,
    fetchPricing,
    clearPricing,
  } = usePricing();

  // Customer search hook
  const {
    customers,
    loading: customersLoading,
    error: customersError,
    currentPage,
    totalPages,
    totalItems,
    searchCustomers,
    clearSearch,
  } = useCustomerSearch();

  const handlePricingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfrId && partNumber) {
      fetchPricing({
        mfrId,
        partNumber,
        customerId: customerId || undefined,
      });
    }
  };

  const handleCustomerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchCustomers({
        q: searchQuery.trim(),
        page: 1,
        limit: 25,
      });
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
        <h3 className="font-medium text-black dark:text-white">
          Pricing & Customer Search Demo
        </h3>
      </div>

      <div className="p-6.5">
        {/* Pricing Section */}
        <div className="mb-8">
          <h4 className="mb-4 text-lg font-semibold text-black dark:text-white">
            Get Pricing Information
          </h4>
          
          <form onSubmit={handlePricingSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-2.5 block text-black dark:text-white">
                  Manufacturer ID
                </label>
                <input
                  type="text"
                  value={mfrId}
                  onChange={(e) => setMfrId(e.target.value)}
                  placeholder="e.g., ECH"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  required
                />
              </div>
              
              <div className="flex-1">
                <label className="mb-2.5 block text-black dark:text-white">
                  Part Number
                </label>
                <input
                  type="text"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="e.g., 1"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  required
                />
              </div>
              
              <div className="flex-1">
                <label className="mb-2.5 block text-black dark:text-white">
                  Customer ID (Optional)
                </label>
                <input
                  type="text"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="Customer ID"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pricingLoading}
                className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-70 disabled:opacity-50"
              >
                {pricingLoading ? 'Loading...' : 'Get Pricing'}
              </button>
              
              <button
                type="button"
                onClick={clearPricing}
                className="flex justify-center rounded bg-secondary py-2 px-6 font-medium text-gray hover:bg-opacity-70"
              >
                Clear
              </button>
            </div>
          </form>

          {/* Pricing Results */}
          {pricingError && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {pricingError}
            </div>
          )}

          {pricing && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded dark:bg-green-900 dark:border-green-600">
              <h5 className="font-semibold mb-2">Pricing Information:</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Manufacturer:</strong> {pricing.mfr_id}</div>
                <div><strong>Part Number:</strong> {pricing.part_number}</div>
                <div><strong>Customer Type:</strong> {pricing.customer_type}</div>
                <div><strong>Price Level:</strong> {pricing.customer_price_level}</div>
                <div><strong>List Price:</strong> ${pricing.list_price}</div>
                <div><strong>Net Price:</strong> ${pricing.net_price}</div>
              </div>
            </div>
          )}
        </div>

        {/* Customer Search Section */}
        <div>
          <h4 className="mb-4 text-lg font-semibold text-black dark:text-white">
            Search Customers
          </h4>
          
          <form onSubmit={handleCustomerSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-2.5 block text-black dark:text-white">
                  Search Query
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., Mario"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={customersLoading}
                className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-70 disabled:opacity-50"
              >
                {customersLoading ? 'Searching...' : 'Search Customers'}
              </button>
              
              <button
                type="button"
                onClick={clearSearch}
                className="flex justify-center rounded bg-secondary py-2 px-6 font-medium text-gray hover:bg-opacity-70"
              >
                Clear Search
              </button>
            </div>
          </form>

          {/* Customer Search Results */}
          {customersError && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {customersError}
            </div>
          )}

          {customers.length > 0 && (
            <div className="mt-4">
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Found {totalItems} customers (Page {currentPage} of {totalPages})
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                      <th className="py-4 px-4 font-medium text-black dark:text-white">ID</th>
                      <th className="py-4 px-4 font-medium text-black dark:text-white">Name</th>
                      <th className="py-4 px-4 font-medium text-black dark:text-white">Phone</th>
                      <th className="py-4 px-4 font-medium text-black dark:text-white">Email</th>
                      <th className="py-4 px-4 font-medium text-black dark:text-white">City</th>
                      <th className="py-4 px-4 font-medium text-black dark:text-white">State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.CUSTOMERID} className="border-b border-stroke dark:border-strokedark">
                        <td className="py-4 px-4 text-black dark:text-white">{customer.CUSTOMERID}</td>
                        <td className="py-4 px-4 text-black dark:text-white">{customer.NAME}</td>
                        <td className="py-4 px-4 text-black dark:text-white">{customer.PHONE || '-'}</td>
                        <td className="py-4 px-4 text-black dark:text-white">{customer.EMAIL || '-'}</td>
                        <td className="py-4 px-4 text-black dark:text-white">{customer.CITY}</td>
                        <td className="py-4 px-4 text-black dark:text-white">{customer.STATE || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingAndCustomerExample;