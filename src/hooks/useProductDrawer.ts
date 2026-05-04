'use client';

import { create } from 'zustand';
import { Product } from '@/types';

interface ProductDrawerStore {
  isOpen: boolean;
  product: Product | null;
  openDrawer: (product: Product) => void;
  closeDrawer: () => void;
}

export const useProductDrawer = create<ProductDrawerStore>((set) => ({
  isOpen: false,
  product: null,
  openDrawer: (product) => set({ isOpen: true, product }),
  closeDrawer: () => set({ isOpen: false, product: null }),
}));