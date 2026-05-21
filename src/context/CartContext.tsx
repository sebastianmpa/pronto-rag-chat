import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { getPricing } from '../libs/PricingService';
import { Customer } from '../types/customers';

const LAST_CUSTOMER_KEY = 'cart_last_customer';

export interface CartItem {
  mfrId: string;
  partNumber: string;
  description: string;
  quantity: number;
  netPrice?: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  lastCustomer: Customer | null;
  pricingLoading: boolean;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (mfrId: string, partNumber: string) => void;
  updateQuantity: (mfrId: string, partNumber: string, quantity: number) => void;
  clearCart: () => void;
  setLastCustomer: (customer: Customer | null) => void;
  refreshPrices: (customerId?: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

const loadLastCustomer = (): Customer | null => {
  try {
    const raw = localStorage.getItem(LAST_CUSTOMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastCustomer, setLastCustomerState] = useState<Customer | null>(loadLastCustomer);
  const [pricingLoading, setPricingLoading] = useState(false);
  const itemsRef = useRef<CartItem[]>([]);
  itemsRef.current = items;

  const setLastCustomer = useCallback((customer: Customer | null) => {
    setLastCustomerState(customer);
    if (customer) {
      localStorage.setItem(LAST_CUSTOMER_KEY, JSON.stringify(customer));
    } else {
      localStorage.removeItem(LAST_CUSTOMER_KEY);
    }
  }, []);

  const refreshPrices = useCallback(async (customerId?: string) => {
    const current = itemsRef.current;
    if (current.length === 0) return;
    setPricingLoading(true);
    try {
      const updated = await Promise.all(
        current.map(async (item) => {
          try {
            const result = await getPricing({
              mfrId: item.mfrId,
              partNumber: item.partNumber,
              ...(customerId ? { customerId } : {}),
            });
            return { ...item, netPrice: result.net_price };
          } catch {
            return item;
          }
        })
      );
      setItems(updated);
    } finally {
      setPricingLoading(false);
    }
  }, []);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.mfrId === item.mfrId && i.partNumber === item.partNumber
      );
      if (existing) {
        return prev.map((i) =>
          i.mfrId === item.mfrId && i.partNumber === item.partNumber
            ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
            : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }];
    });
  }, []);

  const removeItem = useCallback((mfrId: string, partNumber: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.mfrId === mfrId && i.partNumber === partNumber))
    );
  }, []);

  const updateQuantity = useCallback(
    (mfrId: string, partNumber: string, quantity: number) => {
      if (quantity <= 0) {
        setItems((prev) =>
          prev.filter((i) => !(i.mfrId === mfrId && i.partNumber === partNumber))
        );
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.mfrId === mfrId && i.partNumber === partNumber ? { ...i, quantity } : i
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        lastCustomer,
        pricingLoading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setLastCustomer,
        refreshPrices,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
