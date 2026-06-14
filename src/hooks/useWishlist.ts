// hooks/useWishlist.tsx
'use client';

import { useLocalStorage } from './useLocalStorage';
import { WishlistItem } from '@/types';
import { toast } from 'react-hot-toast';
import { IProduct } from '@/types/product';
import { ProductVariant } from '@/types';
import { useCallback, useMemo } from 'react';

// Define image types
interface ImageObject {
  url: string;
  alt?: string;
  sortOrder?: number;
}

interface ImageGroup {
  type: string;
  title: string;
  description?: string;
  images: (string | ImageObject)[];
}

// Helper function to get product price
const getProductPrice = (product: IProduct, selectedVariant?: ProductVariant): number => {
  // Priority 1: Selected variant price
  if (selectedVariant && typeof selectedVariant.price === 'number') {
    return selectedVariant.price;
  }
  
  // Priority 2: Default variant price
  const defaultVariant = product.variants?.find(v => v.isDefault) || product.variants?.[0];
  if (defaultVariant && typeof defaultVariant.price === 'number') {
    return defaultVariant.price;
  }
  
  // Priority 3: Product lowest price
  if (typeof product.lowestPrice === 'number') {
    return product.lowestPrice;
  }
  
  // Fallback
  return 0;
};

// Helper function to extract URL from image (handles both string and object)
const extractImageUrl = (image: string | ImageObject | undefined): string => {
  if (!image) return '';
  if (typeof image === 'string') return image;
  if (typeof image === 'object' && 'url' in image) return image.url;
  return '';
};

// Helper function to get product image
const getProductImage = (product: IProduct, selectedVariant?: ProductVariant): string => {
  // Priority 1: Selected variant image
  if (selectedVariant?.images && selectedVariant.images.length > 0) {
    const firstImage = selectedVariant.images[0];
    const extractedUrl = extractImageUrl(firstImage);
    if (extractedUrl) return extractedUrl;
  }
  
  // Priority 2: Product thumbnail
  if (product.thumbnail) {
    return product.thumbnail;
  }
  
  // Priority 3: First image from imageGroups
  if (product.imageGroups && Array.isArray(product.imageGroups) && product.imageGroups.length > 0) {
    const firstGroup = product.imageGroups[0] as ImageGroup;
    if (firstGroup && firstGroup.images && Array.isArray(firstGroup.images) && firstGroup.images.length > 0) {
      const firstImage = firstGroup.images[0];
      const extractedUrl = extractImageUrl(firstImage);
      if (extractedUrl) return extractedUrl;
    }
  }
  
  // Priority 4: Default placeholder
  return '/images/placeholder.jpg';
};

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

    const productPrice = getProductPrice(product, selectedVariant);
    const productImage = getProductImage(product, selectedVariant);
    
    // Get variant details from selected variant or find default
    const variantToUse = selectedVariant || product.variants?.find(v => v.isDefault) || product.variants?.[0];
    
    const newItem: WishlistItem = {
      id: `${product._id}${variantId ? `_${variantId}` : ''}`,
      productId: product._id,
      variantId: variantId || variantToUse?.variantKey,
      slug: product.slug,
      name: product.name,
      price: productPrice,
      quantity: 1,
      image: productImage,
      sku: variantToUse?.sku,
      variantKey: variantToUse?.variantKey,
      attributes: variantToUse?.attributes || selectedVariant?.attributes,
      selectedVariant: variantToUse || selectedVariant,
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