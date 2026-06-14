// hooks/useCart.ts
'use client';

import { useMemo, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { CartItem, ProductVariant } from '@/types';
import { verifyProductAvailability } from '@/app/actions/cart.actions';
import { toast } from 'react-hot-toast';
import { IProduct } from '@/types/product';

// Helper function to get the first image from product
const getProductImage = (product: IProduct): string => {
  // Check thumbnail first
  if (product.thumbnail) {
    return product.thumbnail;
  }
  
  // Check image groups for first image
  if (product.imageGroups && Array.isArray(product.imageGroups) && product.imageGroups.length > 0) {
    const firstGroup = product.imageGroups[0];
    if (firstGroup && firstGroup.images && Array.isArray(firstGroup.images) && firstGroup.images.length > 0) {
      const firstImage = firstGroup.images[0];
      // Handle both string and object image formats
      if (typeof firstImage === 'string') {
        return firstImage;
      }
      if (typeof firstImage === 'object' && firstImage.url) {
        return firstImage.url;
      }
    }
  }
  
  // Return default placeholder
  return '/images/placeholder.jpg';
};

export function useCart() {
  const { storedValue: cartItems, setValue: setCartItems, isLoaded } = useLocalStorage<CartItem[]>('cart', []);

  const addToCart = useCallback(async (product: IProduct, variant?: ProductVariant, quantity: number = 1) => {
    const variantToUse = variant || product.variants?.find((v) => v.isDefault) || product.variants?.[0];
    
    if (!variantToUse) {
      toast.error('Product variant not found');
      return false;
    }
    
    // Verify availability
    const availability = await verifyProductAvailability(product._id, variantToUse?.variantKey);
    
    if (!availability.available) {
      toast.error('Product is out of stock');
      return false;
    }

    // Debug log
    cartItems.forEach((item) => {
      console.log(item);
    });
    
    const existingItem = cartItems.find(
      item => item.productId === product._id && item.variantKey === variantToUse?.variantKey
    );
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > availability.stock) {
        toast.error(`Only ${availability.stock} items available`);
        return false;
      }
      
      setCartItems(items =>
        items.map(item =>
          item.productId === product._id && item.variantKey === variantToUse?.variantKey
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } else {
      if (quantity > availability.stock) {
        toast.error(`Only ${availability.stock} items available`);
        return false;
      }
      
      // Get product image
      const productImage = getProductImage(product);
      
      const newItem: CartItem = {
        id: `${product._id}-${variantToUse?.variantKey || 'default'}`,
        productId: product._id,
        variantId: variantToUse?.sku,
        name: product.name,
        slug: product.slug,
        price: variantToUse?.price || product.lowestPrice || 0,
        quantity,
        image: productImage,
        sku: variantToUse?.sku,
        variantKey: variantToUse?.variantKey,
        attributes: variantToUse?.attributes,
        selectedVariant: variantToUse,
      };
      
      setCartItems((prev) => [...prev, newItem]);
    }
    
    toast.success('Added to cart');
    return true;
  }, [cartItems, setCartItems]);

  const removeFromCart = useCallback((id: string) => {
    setCartItems(items =>
      items.filter(item => item.id !== id)
    );
    toast.success('Removed from cart');
  }, [setCartItems]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, [setCartItems, removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, [setCartItems]);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total = 0, item) => total + (item.price * item.quantity), 0);
  }, [cartItems]);

  const getCartCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  // Memoized values
  const cartTotal = useMemo(() => getCartTotal(), [getCartTotal]);
  const cartCount = useMemo(() => getCartCount(), [getCartCount]);

  return {
    cartItems,
    cartTotal,
    cartCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    isLoaded,
  };
}