'use client';

import { useLocalStorage } from './useLocalStorage';
import { CartItem, ProductVariant } from '@/types';
import { verifyProductAvailability } from '@/app/actions/cart.actions';
import { toast } from 'react-hot-toast';

export function useCart() {
  const { storedValue: cartItems, setValue: setCartItems, isLoaded } = useLocalStorage<CartItem[]>('cart', []);

  const addToCart = async (product: any, variant?: ProductVariant, quantity: number = 1) => {
    const variantToUse = variant || product.variants?.find((v: any) => v.isDefault) || product.variants?.[0];
    
    // Verify availability
    const availability = await verifyProductAvailability(product._id, variantToUse?.variantKey);
    
    if (!availability.available) {
      toast.error('Product is out of stock');
      return false;
    }
    
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
      
      const newItem: CartItem = {
        id: `${product._id}-${variantToUse?.variantKey || 'default'}`,
        productId: product._id,
        variantId: variantToUse?.sku,
        name: product.name,
        price: variantToUse?.price || product.discountPrice,
        quantity,
        image: product.thumbnail || product.images?.[0],
        sku: variantToUse?.sku,
        variantKey: variantToUse?.variantKey,
        attributes: variantToUse?.attributes,
        selectedVariant: variantToUse,
      };
      
      setCartItems([...cartItems, newItem]);
    }
    
    toast.success('Added to cart');
    return true;
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
    toast.success('Removed from cart');
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    isLoaded,
  };
}