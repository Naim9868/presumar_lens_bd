// components/products/NewArrivalsClient.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Clock } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { IProduct } from '@/types/product';
import Link from 'next/link';

interface NewArrivalsClientProps {
  products: IProduct[];
  title: string;
  subtitle: string;
}

export default function NewArrivalsClient({ products, title, subtitle }: NewArrivalsClientProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScrollMetrics = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const maxScrollable = container.scrollWidth - container.clientWidth;
        setMaxScroll(maxScrollable);
        setScrollPosition(container.scrollLeft);
      }
    };

    updateScrollMetrics();
    window.addEventListener('resize', updateScrollMetrics);
    
    return () => window.removeEventListener('resize', updateScrollMetrics);
  }, [products]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollPosition(scrollContainerRef.current.scrollLeft);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      const newPosition = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:to-slate-950">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              <Sparkles className="w-4 h-4" />
              Just Landed
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
              {subtitle}
            </p>
          </div>
          
          {/* Navigation Arrows */}
          {products.length > 4 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll('left')}
                disabled={scrollPosition <= 0}
                className="p-2 rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-amber-400 hover:text-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={scrollPosition >= maxScroll - 10}
                className="p-2 rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-amber-400 hover:text-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                aria-label="Next products"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Products Carousel */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex gap-4 md:gap-6 pb-4 min-w-max">
            {products.map((product, index) => (
              <div key={product._id} className="w-[280px] sm:w-[300px] md:w-[320px] flex-shrink-0">
                <div className="relative">
                  {/* New Arrival Badge with Days */}
                  {product.createdAt && (
                    <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      New
                    </div>
                  )}
                  <ProductCard product={product} priority={index < 4} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View All Link */}
        <div className="text-center mt-8">
          <Link
            href="/products?sort=newest"
            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold group"
          >
            View All New Arrivals
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}