// hooks/useWishlist.tsx
'use client';

import { useLocalStorage } from './useLocalStorage';
import { WishlistItem } from '@/types';
import { toast } from 'react-hot-toast';
import { IProduct, ProductVariant } from '@/types/product';
import { useCallback, useMemo } from 'react';

export function useWishlist() {
  const { storedValue: wishlistItems, setValue: setWishlistItems, isLoaded } = useLocalStorage<WishlistItem[]>('wishlist', []);

  const addToWishlist = useCallback((product: IProduct, variantId?: string, selectedVariant?: ProductVariant) => {
    const existingItem = wishlistItems.find(item =>
      item.productId === product._id &&
      (variantId ? item.variantId === variantId : !item.variantId)
    );

    if (existingItem) {
      toast.error('Product already in wishlist');
      return false;
    }

    const newItem: WishlistItem = {
      id: `${product._id}${variantId ? `_${variantId}` : ''}`,
      productId: product._id,
      variantId,
      slug: product.slug,
      name: product.name,
      price: selectedVariant?.price || product.price,
      quantity: 1,
      image:
        selectedVariant?.images?.[0] ||
        product.thumbnail ||
        product.images?.[0] ||
        '/images/placeholder.jpg',
      sku: selectedVariant?.sku,
      variantKey: selectedVariant?.variantKey,
      attributes: selectedVariant?.attributes,
      selectedVariant,
    };

    setWishlistItems([...wishlistItems, newItem]);

    toast.success('Added to wishlist');
    return true;
  }, [wishlistItems, setWishlistItems]);

  const removeFromWishlist = useCallback((id: string) => {
    setWishlistItems(items => items.filter(item => item.id !== id));
    toast.success('Removed from wishlist');
  }, [setWishlistItems]);

  const clearWishlist = useCallback(() => {
    setWishlistItems([]);
    toast.success('Wishlist cleared');
  }, [setWishlistItems]);

  const isInWishlist = useCallback((productId: string, variantId?: string) => {
    return wishlistItems.some(item =>
      item.productId === productId &&
      (variantId ? item.variantId === variantId : !item.variantId)
    );
  }, [wishlistItems]);

  const getWishlistCount = useCallback(() => {
    return wishlistItems.length;
  }, [wishlistItems]);

  const getWishlistTotal = useCallback(() => {
    return wishlistItems.reduce((total = 0, item) => total + (item.price * 1), 0);
  }, [wishlistItems]);

  // Memoized values
  const wishlistCount = useMemo(() => getWishlistCount(), [getWishlistCount]);
  const wishlistTotal = useMemo(() => getWishlistTotal(), [getWishlistTotal]);

  return {
    wishlistItems,
    wishlistCount,
    wishlistTotal,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
    getWishlistCount,
    getWishlistTotal,
    isLoaded,
  };
}