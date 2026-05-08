// lib/checkout-store.ts
import { create } from 'zustand';
import { CheckoutItem } from '@/types';


interface CheckoutStore {
  isOpen: boolean;
  items: CheckoutItem[];

  openCheckout: (items: CheckoutItem | CheckoutItem[]) => void;
  closeCheckout: () => void;

  addItem: (item: CheckoutItem) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;

  clearCheckout: () => void;
}

export const useCheckout = create<CheckoutStore>((set, get) => ({
  isOpen: false,
  items: [],

  openCheckout: (items) =>
    set({
      isOpen: true,
      items: Array.isArray(items)
        ? items
        : [{ ...items, quantity: items.quantity || 1 }],
    }),

  closeCheckout: () =>
    set({
      isOpen: false,
    }),

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find(
        (i) =>
          i.productId === item.productId &&
          i.variantId === item.variantId
      );

      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId &&
            i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }

      return { items: [...state.items, item] };
    }),

  updateItemQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      ),
    })),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter(
        (item) => item.productId !== productId
      ),
    })),

  clearCheckout: () =>
    set({
      items: [],
    }),
}));



