'use client';

import { useLocalStorage } from './useLocalStorage';
import { WishlistItem } from '@/types';
import { toast } from 'react-hot-toast';

export function useWishlist() {
  const { storedValue: wishlistItems, setValue: setWishlistItems, isLoaded } = useLocalStorage<WishlistItem[]>('wishlist', []);

  const addToWishlist = (product: any) => {
    const exists = wishlistItems.some(item => item.productId === product._id);
    
    if (exists) {
      toast.error('Already in wishlist');
      return false;
    }
    
    const newItem: WishlistItem = {
      id: product._id,
      productId: product._id,
      name: product.name,
      price: product.discountPrice,
      image: product.thumbnail || product.images?.[0],
      slug: product.slug,
    };
    
    setWishlistItems([...wishlistItems, newItem]);
    toast.success('Added to wishlist');
    return true;
  };

  const removeFromWishlist = (productId: string) => {
    setWishlistItems(items => items.filter(item => item.productId !== productId));
    toast.success('Removed from wishlist');
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.productId === productId);
  };

  const clearWishlist = () => {
    setWishlistItems([]);
  };

  return {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    isLoaded,
  };
}