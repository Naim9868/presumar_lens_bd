'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useCart } from '@/hooks/useCart';
import { CartItem } from '@/types/cart';
import { IProduct, IProductVariant } from '@/types/product';

interface CartContextType {
  cartItems: CartItem[];
  cartTotal: number;
  cartCount: number;
  addToCart: (product: IProduct, variant?: IProductVariant, quantity?: number) => Promise<boolean>;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCart();

  const contextValue: CartContextType = {
    cartItems: cart.cartItems,
    cartTotal: cart.cartTotal,
    cartCount: cart.cartCount,
    addToCart: cart.addToCart,
    updateQuantity: cart.updateQuantity,
    removeFromCart: cart.removeFromCart,
    clearCart: cart.clearCart,
    getCartTotal: cart.getCartTotal,
    getCartCount: cart.getCartCount,
    isLoaded: cart.isLoaded,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}