// components/Header/RecentlyViewedModal.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Eye, Clock, Trash2, ShoppingBag, ChevronRight } from 'lucide-react';
import { useRecentlyViewed, RecentlyViewedItem } from '@/hooks/useRecentlyViewed';

interface RecentlyViewedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImageObject {
  url: string;
  alt?: string;
}

export default function RecentlyViewedModal({ isOpen, onClose }: RecentlyViewedModalProps) {
  const { recentlyViewed, removeFromRecentlyViewed, clearRecentlyViewed, count, isLoaded } = useRecentlyViewed();
  const [mounted, setMounted] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Handle mounting to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleRemoveItem = useCallback((productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromRecentlyViewed(productId);
  }, [removeFromRecentlyViewed]);

  const handleClearAll = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all recently viewed items?')) {
      clearRecentlyViewed();
    }
  }, [clearRecentlyViewed]);

  const handleLinkClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleImageError = useCallback((productId: string) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }));
  }, []);

  // Helper function to extract URL from image (handles both string and object)
  const extractImageUrl = useCallback((image: string | ImageObject | undefined): string => {
    if (!image) return '';
    if (typeof image === 'string') return image;
    if (typeof image === 'object' && 'url' in image) return image.url;
    return '';
  }, []);

  // Get product price with fallback
  const getProductPrice = useCallback((item: RecentlyViewedItem): number => {
    // Try to get price from various possible locations
    if (typeof item.price === 'number' && !isNaN(item.price)) {
      return item.price;
    }
    if (typeof item.lowestPrice === 'number' && !isNaN(item.lowestPrice)) {
      return item.lowestPrice;
    }
    if (item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
      const firstVariant = item.variants[0];
      if (firstVariant && typeof firstVariant.price === 'number') {
        return firstVariant.price;
      }
    }
    // Default fallback
    return 0;
  }, []);

  // Get product thumbnail with fallback
  const getProductThumbnail = useCallback((item: RecentlyViewedItem): string => {
    if (imageErrors[item.productId]) {
      return '/images/placeholder.jpg';
    }
    
    // Check for direct thumbnail
    if (item.thumbnail) {
      return extractImageUrl(item.thumbnail);
    }
    
    // Check for images array
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      const firstImage = item.images[0];
      const extractedUrl = extractImageUrl(firstImage);
      if (extractedUrl) return extractedUrl;
    }
    
    // Check for imageGroups
    if (item.imageGroups && Array.isArray(item.imageGroups) && item.imageGroups.length > 0) {
      const firstGroup = item.imageGroups[0];
      if (firstGroup && firstGroup.images && Array.isArray(firstGroup.images) && firstGroup.images.length > 0) {
        const firstImage = firstGroup.images[0];
        // Check if firstImage is an object with url property or a string
        if (typeof firstImage === 'object' && 'url' in firstImage) {
          return firstImage.url;
        }
        if (typeof firstImage === 'string') {
          return firstImage;
        }
      }
    }
    
    return '/images/placeholder.jpg';
  }, [imageErrors, extractImageUrl]);

  // Format date
  const formatDate = useCallback((dateString: string | Date): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 transition-all duration-300 z-[1000] ${
          isOpen
            ? 'bg-black/20 backdrop-blur-sm visible'
            : 'bg-black/0 backdrop-blur-none invisible'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl transition-transform duration-300 ease-in-out z-[1001] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Recently Viewed
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Products you've browsed
              </p>
            </div>
            {count > 0 && (
              <span className="ml-2 px-2.5 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                {count}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4" style={{ height: 'calc(100% - 140px)' }}>
          {!isLoaded ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">Loading...</p>
            </div>
          ) : count === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                <Eye className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">No recently viewed items</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Products you view will appear here
              </p>
              <Link
                href="/products"
                onClick={handleLinkClick}
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                Start Shopping
              </Link>
            </div>
          ) : (
            <>
              {/* Clear All Button */}
              {count > 1 && (
                <div className="flex justify-end mb-3">
                  <button
                    onClick={handleClearAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All
                  </button>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3">
                {recentlyViewed.map((item: RecentlyViewedItem) => {
                  const price = getProductPrice(item);
                  const thumbnail = getProductThumbnail(item);
                  const viewedDate = formatDate(item.viewedAt);
                  
                  return (
                    <Link
                      key={item.productId}
                      href={`/products/${item.slug}`}
                      onClick={handleLinkClick}
                      className="block group"
                    >
                      <div className="flex gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800">
                        {/* Product Image */}
                        <div className="relative w-16 h-16 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg overflow-hidden">
                          {thumbnail && thumbnail !== '/images/placeholder.jpg' ? (
                            <Image
                              src={thumbnail}
                              alt={item.name}
                              fill
                              sizes="64px"
                              className="object-cover transition-transform duration-300 group-hover:scale-110"
                              onError={() => handleImageError(item.productId)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Eye className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                            {item.name}
                          </h3>
                          <p className="text-base font-bold text-blue-600 dark:text-blue-400 mt-1">
                            {price > 0 ? `$${price.toFixed(2)}` : 'Price on request'}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">
                              {viewedDate}
                            </span>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={(e) => handleRemoveItem(item.productId, e)}
                          className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 opacity-0 group-hover:opacity-100"
                          aria-label="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {count > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <Link
              href="/recently-viewed"
              onClick={handleLinkClick}
              className="flex items-center justify-between w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all duration-200 group"
            >
              <span>View All Recently Viewed</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}