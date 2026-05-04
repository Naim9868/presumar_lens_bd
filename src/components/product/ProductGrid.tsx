'use client';

import { useState, useEffect, useCallback } from 'react';
import ProductCard from './ProductCard';
import { ProductFilters } from './ProductFilters';
import { ProductSort } from './ProductSort';
import LoadingSpinner  from '@/components/admin/ui/LoadingSpinner';
import { getAllProducts, getAllBrands } from '@/app/actions/product.actions';
import { TransformedProduct, FilterOptions } from '@/types';
import { Filter } from 'lucide-react';

interface ProductGridProps {
  initialProducts?: TransformedProduct[];
  categoryId?: string;
}

export function ProductGrid({ initialProducts = [], categoryId }: ProductGridProps) {
  const [products, setProducts] = useState<TransformedProduct[]>(initialProducts);
  const [brands, setBrands] = useState<Array<{ _id: string; name: string; slug: string }>>([]);
  const [loading, setLoading] = useState(!initialProducts.length);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sortBy, setSortBy] = useState('newest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const result = await getAllProducts({ ...filters, sortBy, categoryId });
    if (result.success) {
      setProducts(result.products);
      setTotalCount(result.products.length);
    }
    setLoading(false);
  }, [filters, sortBy, categoryId]);

  const fetchBrands = useCallback(async () => {
    const result = await getAllBrands();
    if (result.success) {
      setBrands(result.brands);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Desktop Filters Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <ProductFilters brands={brands} onFilterChange={handleFilterChange} initialFilters={filters} />
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span> products
          </p>
          <div className="flex gap-3">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
            >
              <Filter size={16} />
              Filters
            </button>
            <ProductSort onSortChange={handleSortChange} currentSort={sortBy} />
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/30 rounded-2xl">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No products found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowMobileFilters(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-gray-900 z-50 shadow-xl overflow-y-auto animate-in slide-in-from-right">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <Filter size={20} />
              </button>
            </div>
            <div className="p-4">
              <ProductFilters 
                brands={brands} 
                onFilterChange={handleFilterChange} 
                initialFilters={filters}
                onClose={() => setShowMobileFilters(false)}
                isMobile
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}