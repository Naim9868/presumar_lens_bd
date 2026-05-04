import { create } from 'zustand';

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface ProductVariant {
  _id: string;
  sku: string;
  price: number;
  comparePrice?: number;
  stock: number;
  attributes: {
    mount: string;
    condition: string;
  };
  isDefault: boolean;
}

export interface ProductDrawerProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  brand: {
    _id: string;
    name: string;
    slug: string;
  };
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  images: string[];
  thumbnail: string;
  variants: ProductVariant[];
  minPrice: number;
  maxPrice: number;
  defaultVariant?: ProductVariant;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  tags?: string[];
  status: string;
}

interface ProductDrawerState {
  isOpen: boolean;
  product: ProductDrawerProduct | null;
  openDrawer: (product: ProductDrawerProduct) => void;
  closeDrawer: () => void;
}

export const useProductDrawer = create<ProductDrawerState>((set) => ({
  isOpen: false,
  product: null,
  openDrawer: (product) => set({ isOpen: true, product }),
  closeDrawer: () => set({ isOpen: false, product: null }),
}));