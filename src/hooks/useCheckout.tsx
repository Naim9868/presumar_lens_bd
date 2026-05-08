'use client';

import { useCheckout as useCheckoutStore } from '@/stores/checkout-store';

export const useCheckout = () => {
  const store = useCheckoutStore();

  return {
    ...store,

    // helper: calculate totals
    subtotal: store.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ),

    totalItems: store.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    ),
  };
};