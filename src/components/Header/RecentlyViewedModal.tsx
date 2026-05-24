// components/RecentlyViewed/RecentlyViewedModal.tsx
"use client";
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Eye, Clock, Trash2 } from 'lucide-react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

interface RecentlyViewedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RecentlyViewedModal = ({ isOpen, onClose }: RecentlyViewedModalProps) => {
  const { recentlyViewed, clearRecentlyViewed, removeFromRecentlyViewed, isLoaded } = useRecentlyViewed();
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // Handle mounting
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle animation - NO state updates during render!
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Use requestAnimationFrame to ensure state update happens after render
      requestAnimationFrame(() => {
        setAnimateIn(true);
      });
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target as Element).closest('.recently-viewed-content')) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!mounted || !shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[99999] transition-all duration-300 ease-in-out ${
          animateIn ? 'bg-black/70' : 'bg-black/0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="fixed inset-0 z-[99999] overflow-hidden pointer-events-none">
        <div className="flex items-center justify-end min-h-screen">
          <div 
            className={`recently-viewed-content w-full max-w-[500px] bg-white h-screen flex flex-col shadow-2xl transition-all duration-300 ease-in-out transform pointer-events-auto ${
              animateIn ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white flex items-center justify-between pb-4 pt-6 px-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-xl">Recently Viewed</h2>
                {recentlyViewed.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({recentlyViewed.length})
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {!isLoaded ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : recentlyViewed.length === 0 ? (
                <div className="text-center py-12">
                  <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recently viewed items</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Products you view will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500">
                      Showing {recentlyViewed.length} items
                    </span>
                    <button
                      onClick={clearRecentlyViewed}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear all
                    </button>
                  </div>
                  
                  {recentlyViewed.map((item) => (
                    <div
                      key={item.productId}
                      className="flex gap-4 p-3 border border-gray-100 rounded-lg hover:shadow-md transition-shadow group"
                    >
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={onClose}
                        className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden"
                      >
                        <Image
                          src={item.thumbnail}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/placeholder.jpg';
                          }}
                        />
                      </Link>
                      
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={onClose}
                          className="font-medium text-gray-800 hover:text-blue-600 line-clamp-2 transition-colors"
                        >
                          {item.name}
                        </Link>
                        <p className="text-blue-600 font-semibold mt-1">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => removeFromRecentlyViewed(item.productId)}
                        className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecentlyViewedModal;