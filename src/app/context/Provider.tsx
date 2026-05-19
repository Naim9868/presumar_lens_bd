// context/Providers.tsx
'use client';

import React, { ReactNode } from 'react';
import { CartProvider } from './CartContext';
import { WishlistProvider } from './WishlistContext';
import { CartModalProvider } from "./CartSidebarModalContext";
import { WishlistModalProvider } from './WishlistSidebarModalContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <CartModalProvider>
            <WishlistModalProvider>
                {children}
            </WishlistModalProvider>
        </CartModalProvider>
      </WishlistProvider>
    </CartProvider>
  );
}