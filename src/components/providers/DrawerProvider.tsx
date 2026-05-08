'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode
} from 'react';
import { IProduct } from '@/types/product';


// ✅ Better type (you can replace with your Product type later)
type ProductType = IProduct;

type ProductDrawerContextType = {
  isOpen: boolean;
  product: ProductType | null;
  openDrawer: (product: ProductType) => void;
  closeDrawer: () => void;
};

// ✅ undefined instead of null (fixes most TS issues)
const ProductDrawerContext = createContext<ProductDrawerContextType | undefined>(undefined);

export const ProductDrawerProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [product, setProduct] = useState<ProductType | null>(null);

  const openDrawer = (productData: ProductType) => {
    setProduct(productData);
    setIsOpen(true);
  };

  const closeDrawer = () => {
    setIsOpen(false);
    setProduct(null);
  };

  return (
    <ProductDrawerContext.Provider
      value={{
        isOpen,
        product,
        openDrawer,
        closeDrawer
      }}
    >
      {children}
    </ProductDrawerContext.Provider>
  );
};

// ✅ Hook with safety check
export const useProductDrawer = () => {
  const context = useContext(ProductDrawerContext);

  if (!context) {
    throw new Error('useProductDrawer must be used within ProductDrawerProvider');
  }

  return context;
};