// lib/product-drawer.ts
import { create } from 'zustand';
import { IProduct } from '@/types/product';

interface ProductDrawerState {
  product: IProduct | null;
  isOpen: boolean;
  open: (product: IProduct) => void;
  close: () => void;
}

export const useProductDrawer = create<ProductDrawerState>((set) => ({
  product: null,
  isOpen: false,
  open: (product) => set({ product, isOpen: true }),
  close: () => set({ product: null, isOpen: false }),
}));