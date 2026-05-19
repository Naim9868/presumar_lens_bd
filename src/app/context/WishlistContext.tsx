// app/context/WishlistContext.tsx
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useWishlist } from '@/hooks/useWishlist';
import { WishlistItem } from '@/types';

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  wishlistCount: number;
  wishlistTotal: number;
  addToWishlist: (product: any, variantId?: string, selectedVariant?: any) => boolean;
  removeFromWishlist: (id: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string, variantId?: string) => boolean;
  getWishlistCount: () => number;
  getWishlistTotal: () => number;
  isLoaded: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlistContext = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlistContext must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const wishlist = useWishlist();

  return (
    <WishlistContext.Provider value={wishlist}>
      {children}
    </WishlistContext.Provider>
  );
};