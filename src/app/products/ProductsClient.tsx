// app/products/ProductsClient.tsx
"use client";

import { useState, useCallback } from 'react';
import { useSearchParams } from "next/navigation";
import { Package, ChevronLeft, ChevronRight, Home, Grid3X3, List } from 'lucide-react';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import ProductSearchFilter from './ProductSearchFilter';
import { IProduct } from '@/types/product';

interface Brand {
  _id: string;
  name: string;
  slug: string;
}

interface ProductsClientProps {
  initialProducts: IProduct[];
  initialTotal: number;
  brands: Brand[];
}

export default function ProductsClient({
  initialProducts,
  initialTotal,
  brands,
}: ProductsClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const searchParams = useSearchParams();

  const brandSlug = searchParams.get("brand");

  const handleProductsUpdate = useCallback((newProducts: IProduct[], newTotal: number) => {
    setProducts(newProducts);
    setTotal(newTotal);
  }, []);

  const handleLoadingChange = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);


  return (
    <div className="pt-[130px] md:pt-[140px] lg:pt-[150px] pb-12 min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-4">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <Link href="/" className="hover:text-amber-600 transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 dark:text-white font-medium">All Products</span>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            All Products
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover our complete collection of premium mobile photography gear
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8">
          <ProductSearchFilter
            onProductsUpdate={handleProductsUpdate}
            onLoadingChange={handleLoadingChange}
            brands={brands}
            initialSort="newest"
            initialBrandSlug={brandSlug || ""}
          />
        </div>

        {/* View Toggle and Results Count */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-gray-500'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-gray-500'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? 'Loading...' : (
                <>Showing <span className="font-semibold text-gray-900 dark:text-white">{products.length}</span> of{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{total}</span> products</>
              )}
            </p>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-amber-500 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Products Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : !loading && (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6'
              : 'space-y-4'
          }>
            {products.map((product, index) => (
              <ProductCard key={product._id} product={product} priority={index < 8} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}