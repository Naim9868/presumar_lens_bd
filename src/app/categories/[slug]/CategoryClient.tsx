// app/category/[slug]/CategoryClient.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, Filter, Grid3X3, List, ChevronDown, 
  X, Sparkles, Package, ChevronRight, Home, Loader2
} from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { ProductDrawer } from '@/components/product/ProductDrawer';
import { Category } from '@/types';
import { IProduct } from '@/types/product';
import { getProductsByCategory } from '@/app/actions/product/getProductsByCategory';

interface CategoryClientProps {
  category: Category;
  initialProducts: IProduct[];
  initialTotal: number;
  initialTotalPages: number;
  currentSort: string;
  currentPage: number;
}

interface ExtendedCategory extends Category {
  children?: Category[];
}

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
];

// Map sort values from UI to API expected values
function mapSortToApiParam(sort: string): 'newest' | 'price_low' | 'price_high' | 'popular' | 'featured' {
  switch (sort) {
    case 'price_asc':
      return 'price_low';
    case 'price_desc':
      return 'price_high';
    case 'rating':
      return 'popular';
    case 'newest':
      return 'newest';
    case 'popular':
      return 'popular';
    case 'featured':
      return 'featured';
    default:
      return 'newest';
  }
}

const CategoryClient = ({
  category,
  initialProducts,
  initialTotal,
  initialTotalPages,
  currentSort,
  currentPage,
}: CategoryClientProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<IProduct[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState(currentSort);
  const [isClient, setIsClient] = useState(false);

  // Handle mounting to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []); 

  // Update products when category changes (for client-side navigation)
  useEffect(() => {
    setProducts(initialProducts);
    setTotal(initialTotal);
    setTotalPages(initialTotalPages);
    setSelectedSort(currentSort);
  }, [initialProducts, initialTotal, initialTotalPages, currentSort]);

  // Update URL parameters
  const updateUrlParams = useCallback((params: { sort?: string; page?: string }) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    if (params.sort) {
      newParams.set('sort', params.sort);
    }
    if (params.page) {
      newParams.set('page', params.page);
    }
    
    router.push(`${pathname}?${newParams.toString()}`);
  }, [router, pathname, searchParams]);

  // Handle sort change
  const handleSortChange = useCallback((sortValue: string) => {
    setSelectedSort(sortValue);
    setSortOpen(false);
    updateUrlParams({ sort: sortValue, page: '1' });
  }, [updateUrlParams]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    updateUrlParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [updateUrlParams]);

  // Get sort label
  const currentSortLabel = useMemo(() => {
    return sortOptions.find(opt => opt.value === selectedSort)?.label || 'Newest First';
  }, [selectedSort]);

  // Fetch products on filter/sort/page change
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const apiSort = mapSortToApiParam(selectedSort);
      
      const result = await getProductsByCategory({
        categoryId: category._id,
        sort: apiSort,
        page: currentPage,
        limit: 20,
        status: 'active',
        inStock: true,
      });

      if (result.success) {
        setProducts(result.products);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [category._id, selectedSort, currentPage]);

  // Fetch products when sort or page changes (client-side)
  useEffect(() => {
    // Skip if it's the initial load (already have initial products)
    const isInitialLoad = currentPage === 1 && selectedSort === currentSort && products.length === initialProducts.length;
    if (!isInitialLoad) {
      fetchProducts();
    }
  }, [selectedSort, currentPage, fetchProducts, currentSort, initialProducts.length, products.length]);

  // Get current page for pagination display
  const getPageNumbers = useCallback(() => {
    const pageNumbers: number[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxVisible; i++) {
        pageNumbers.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  }, [totalPages, currentPage]);

  // Cast category to extended type for children
  const extendedCategory = category as ExtendedCategory;
  const hasChildren = extendedCategory.children && extendedCategory.children.length > 0;

  return (
    <div className="pt-[130px] md:pt-[140px] lg:pt-[150px] pb-12 min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-4">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 overflow-x-auto">
          <Link href="/" className="hover:text-amber-600 transition-colors flex items-center gap-1 whitespace-nowrap">
            <Home className="w-3.5 h-3.5" />
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <Link href="/categories" className="hover:text-amber-600 transition-colors whitespace-nowrap">
            Categories
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-gray-900 dark:text-white font-medium truncate">
            {category.name}
          </span>
        </nav>

        {/* Category Header */}
        <div className="mb-8 md:mb-12">
          {/* Category Image & Info */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {category.image && (
              <div className="relative w-full md:w-48 h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 flex-shrink-0">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 192px"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <div className="flex-1">
              {/* Subcategory Badge */}
              {category.parentId && (
                <div className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  <Package className="w-3 h-3" />
                  Subcategory
                </div>
              )}
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {category.name}
              </h1>
              
              {category.description && (
                <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg max-w-3xl leading-relaxed">
                  {category.description}
                </p>
              )}
              
              {/* Category Stats */}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Package className="w-4 h-4" />
                  <span>{total} {total === 1 ? 'Product' : 'Products'}</span>
                </div>
                
                {hasChildren && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Sparkles className="w-4 h-4" />
                    <span>{extendedCategory.children!.length} Subcategories</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Subcategories Section */}
          {hasChildren && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Explore Subcategories
              </h2>
              <div className="flex flex-wrap gap-3">
                {extendedCategory.children!.map((subcat) => (
                  <Link
                    key={subcat._id}
                    href={`/categories/${subcat.slug}`}
                    className="group flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-full hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-300 hover:shadow-md"
                  >
                    {subcat.image ? (
                      <div className="relative w-6 h-6 rounded-full overflow-hidden">
                        <Image
                          src={subcat.image}
                          alt={subcat.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <Package className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-amber-600 transition-colors">
                      {subcat.name}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Products Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-semibold text-gray-900 dark:text-white">{products.length}</span> of{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{total}</span> products
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-[#191970] dark:text-amber-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
                aria-label="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-[#191970] dark:text-amber-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-amber-400 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Sort: </span>
                {currentSortLabel}
                <ChevronDown className={`w-4 h-4 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {sortOpen && isClient && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-20">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${
                          selectedSort === option.value
                            ? 'text-amber-600 font-semibold bg-amber-50 dark:bg-amber-900/20'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && products.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full mb-4">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Products Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Products in this category will appear here soon.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-6 text-amber-600 hover:text-amber-700 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        ) : (
          // Products Grid/List
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'
              : 'space-y-4'
          }>
            {products.map((product, index) => (
              <ProductCard
                key={product._id}
                product={product}
                priority={index < 4}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-[#191970] text-white'
                        : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-amber-400'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Drawer - Rendered once at grid level */}
      <ProductDrawer />
    </div>
  );
};

export default CategoryClient;