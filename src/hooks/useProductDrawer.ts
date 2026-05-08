// hooks/useProductDrawer.ts
import { create } from 'zustand';
import { IProduct } from '@/types/product';

interface ProductDrawerState {
  product: IProduct | null;
  isOpen: boolean;
  openDrawer: (product: IProduct) => void;
  closeDrawer: () => void;
}

export const useProductDrawer = create<ProductDrawerState>((set) => ({
  product: null,
  isOpen: false,
  
  openDrawer: (product) => {
    set({ product, isOpen: true });
    
    // Update URL without page reload (client-side only)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('product', product.slug);
      url.searchParams.set('drawer', 'true');
      window.history.pushState({ productSlug: product.slug }, '', url.toString());
    }
  },
  
  closeDrawer: () => {
    set({ product: null, isOpen: false });
    
    // Remove product param from URL (client-side only)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('product');
      url.searchParams.delete('drawer');
      window.history.pushState({}, '', url.toString());
    }
  },
}));