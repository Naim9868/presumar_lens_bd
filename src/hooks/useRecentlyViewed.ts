// hooks/useRecentlyViewed.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { IProduct } from '@/types/product';

export interface RecentlyViewedItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  thumbnail: string;
  viewedAt: number;
}

const RECENTLY_VIEWED_KEY = 'recently_viewed';
const MAX_ITEMS = 10;
const EXPIRY_HOURS = 1;
const RECENTLY_VIEWED_UPDATE_EVENT = 'recentlyViewedUpdated';

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Helper function to load items from localStorage - NOT a state setter directly
  const loadFromStorage = useCallback((): RecentlyViewedItem[] => {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      
      if (stored) {
        const items: RecentlyViewedItem[] = JSON.parse(stored);
        const now = Date.now();
        const expiryMs = EXPIRY_HOURS * 60 * 60 * 1000;
        
        const validItems = items.filter(item => now - item.viewedAt < expiryMs);
        
        if (validItems.length !== items.length) {
          localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(validItems));
        }
        
        return validItems;
      }
      return [];
    } catch (error) {
      console.error('Failed to parse recently viewed:', error);
      return [];
    }
  }, []);

  // Load on mount - using useEffect, not during render
  useEffect(() => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    
    const items = loadFromStorage();
    if (isMountedRef.current) {
      setRecentlyViewed(items);
      setIsLoaded(true);
    }
    isLoadingRef.current = false;
    
    return () => {
      isMountedRef.current = false;
    };
  }, [loadFromStorage]);

  // Listen for storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === RECENTLY_VIEWED_KEY) {
        const items = loadFromStorage();
        setRecentlyViewed(items);
      }
    };
    
    const handleCustomEvent = () => {
      const items = loadFromStorage();
      setRecentlyViewed(items);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(RECENTLY_VIEWED_UPDATE_EVENT, handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(RECENTLY_VIEWED_UPDATE_EVENT, handleCustomEvent);
    };
  }, [loadFromStorage]);

  // Add product to recently viewed
 const addToRecentlyViewed = useCallback((product: IProduct) => {
  if (!product || !product._id) return;

  const newItem: RecentlyViewedItem = {
    productId: product._id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    thumbnail:
      product.thumbnail ||
      product.images?.[0] ||
      '/images/placeholder.jpg',
    viewedAt: Date.now(),
  };

  setRecentlyViewed((prev) => {
    const filtered = prev.filter(
      (item) => item.productId !== product._id
    );

    const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);

    localStorage.setItem(
      RECENTLY_VIEWED_KEY,
      JSON.stringify(updated)
    );

    return updated;
  });

  // ✅ Dispatch AFTER render cycle
  setTimeout(() => {
    window.dispatchEvent(
      new Event(RECENTLY_VIEWED_UPDATE_EVENT)
    );
  }, 0);
}, []);

  // Clear all
  const clearRecentlyViewed = useCallback(() => {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
    setRecentlyViewed([]);
    window.dispatchEvent(new Event(RECENTLY_VIEWED_UPDATE_EVENT));
  }, []);

  // Remove specific item
  const removeFromRecentlyViewed = useCallback((productId: string) => {
    setRecentlyViewed(prev => {
      const updated = prev.filter(item => item.productId !== productId);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(RECENTLY_VIEWED_UPDATE_EVENT));
      return updated;
    });
  }, []);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
    removeFromRecentlyViewed,
    count: recentlyViewed.length,
    isLoaded,
  };
}