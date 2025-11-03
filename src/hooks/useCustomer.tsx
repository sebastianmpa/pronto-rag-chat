import { useState, useEffect } from 'react';
import { getCustomerById } from '../libs/CustomerService';
import { Customer } from '../types/Customer';

export const useCustomerById = (id: string) => {
  const [data, setData] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getCustomerById(id)
      .then(setData)
      .catch((err) => setError(err.message || 'Error'))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error };
};
