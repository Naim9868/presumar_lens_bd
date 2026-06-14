// src/app/products/ProductsClient.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Star, 
  ShoppingCart,
  Heart,
  Eye,
  CheckCircle,
  X,
  SlidersHorizontal,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { IProduct, IProductVariant } from '@/types/product';

// Types for the component
interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductsClientProps {
  initialProducts: IProduct[];
  initialPagination: Pagination;
  categories: Category[];
  brands: Brand[];
  initialFilters: {
    categoryId?: string;
    brandId?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    search?: string;
  };
}

// Sort options
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Best Rating' },
];

// Helper to get brand name from brandId (which is a string)
const getBrandName = (brandId: string, brands: Brand[]): string | null => {
  const brand = brands.find(b => b._id === brandId);
  return brand?.name || null;
};

// Helper to get discount percentage
const getDiscountPercentage = (variant: IProductVariant | undefined, lowestPrice: number): number => {
  if (variant?.compareAtPrice && variant.compareAtPrice > variant.price) {
    return Math.round(((variant.compareAtPrice - variant.price) / variant.compareAtPrice) * 100);
  }
  return 0;
};

// Helper to get current price
const getCurrentPrice = (variant: IProductVariant | undefined, lowestPrice: number): number => {
  return variant?.price || lowestPrice;
};

// Helper to get compare price
const getComparePrice = (variant: IProductVariant | undefined): number | null => {
  return variant?.compareAtPrice || null;
};

// Product Card Component
const ProductCard = ({ product, brands }: { product: IProduct; brands: Brand[] }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Get brand name
  const brandName = getBrandName(product.brandId, brands);
  
  // Get default variant
  const defaultVariant = product.variants?.find(v => v.isDefault) || product.variants?.[0];
  
  const currentPrice = getCurrentPrice(defaultVariant, product.lowestPrice);
  const comparePrice = getComparePrice(defaultVariant);
  const discount = getDiscountPercentage(defaultVariant, product.lowestPrice);
  
  const isInStock = product.totalInventory > 0 && product.status === 'active';

  // Get badge labels
  const badgeLabels = product.badges?.map(b => b.label) || [];

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isInStock) {
      toast.error('Product is out of stock');
      return;
    }
    
    setIsAddingToCart(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success('Added to cart');
    setIsAddingToCart(false);
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success('Added to wishlist');
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast('Quick view coming soon');
  };

  return (
    <div 
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex gap-2">
        {badgeLabels.includes('new') && (
          <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
            New
          </span>
        )}
        {discount > 0 && (
          <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
            -{discount}%
          </span>
        )}
        {badgeLabels.includes('bestseller') && (
          <span className="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
            Bestseller
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button 
        onClick={handleAddToWishlist}
        className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
      >
        <Heart className="w-4 h-4 text-gray-600 hover:text-red-500 transition-colors" />
      </button>

      {/* Product Image */}
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Quick View Overlay */}
          <div className={`absolute inset-0 bg-black/50 flex items-center justify-center gap-3 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <button 
              onClick={handleAddToCart}
              disabled={isAddingToCart || !isInStock}
              className="p-2 bg-white rounded-full hover:bg-amber-500 hover:text-white transition-colors disabled:opacity-50"
            >
              {isAddingToCart ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )}
            </button>
            <button 
              onClick={handleQuickView}
              className="p-2 bg-white rounded-full hover:bg-amber-500 hover:text-white transition-colors"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4">
        {/* Brand */}
        {brandName && (
          <p className="text-xs text-gray-500 mb-1">{brandName}</p>
        )}

        {/* Title */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-amber-600 transition-colors text-sm">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.ratingAverage > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(product.ratingAverage)
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.ratingCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg font-bold text-gray-900">
            ${currentPrice.toFixed(2)}
          </span>
          {product.highestPrice && product.highestPrice !== product.lowestPrice && (
            <span className="text-sm text-gray-400">
              - ${product.highestPrice.toFixed(2)}
            </span>
          )}
          {comparePrice && comparePrice > currentPrice && (
            <span className="text-sm text-gray-400 line-through">
              ${comparePrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="mt-2 flex items-center gap-1">
          {isInStock ? (
            <>
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600">In Stock</span>
            </>
          ) : (
            <>
              <X className="w-3 h-3 text-red-500" />
              <span className="text-xs text-red-600">Out of Stock</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Category Filter Component
const CategoryFilter = ({ 
  categories, 
  selectedCategory, 
  onSelect 
}: { 
  categories: Category[]; 
  selectedCategory?: string; 
  onSelect: (categoryId: string) => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Categories</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-1 hover:bg-gray-100 rounded"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <div className={`space-y-2 ${isOpen ? 'block' : 'hidden lg:block'}`}>
        <button
          onClick={() => onSelect('')}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            !selectedCategory ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          All Categories
        </button>
        {categories.map((category) => (
          <button
            key={category._id}
            onClick={() => onSelect(category._id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedCategory === category._id ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// Brand Filter Component
const BrandFilter = ({ 
  brands, 
  selectedBrand, 
  onSelect 
}: { 
  brands: Brand[]; 
  selectedBrand?: string; 
  onSelect: (brandId: string) => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Brands</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-1 hover:bg-gray-100 rounded"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <div className={`space-y-2 ${isOpen ? 'block' : 'hidden lg:block'}`}>
        <button
          onClick={() => onSelect('')}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            !selectedBrand ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          All Brands
        </button>
        {brands.map((brand) => (
          <button
            key={brand._id}
            onClick={() => onSelect(brand._id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedBrand === brand._id ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {brand.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// Price Range Filter Component
const PriceRangeFilter = ({ 
  minPrice, 
  maxPrice, 
  onApply 
}: { 
  minPrice?: string; 
  maxPrice?: string; 
  onApply: (min: string, max: string) => void 
}) => {
  const [min, setMin] = useState(minPrice || '');
  const [max, setMax] = useState(maxPrice || '');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Min Price</label>
          <input
            type="number"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder="$0"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Max Price</label>
          <input
            type="number"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder="$1000"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>
      <button
        onClick={() => onApply(min, max)}
        className="w-full py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
      >
        Apply Price Range
      </button>
    </div>
  );
};

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="aspect-square bg-gray-200 animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
          <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

// Main Client Component
export default function ProductsClient({ 
  initialProducts, 
  initialPagination,
  categories,
  brands,
  initialFilters
}: ProductsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<IProduct[]>(initialProducts);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Current filters
  const [categoryId, setCategoryId] = useState(initialFilters.categoryId || '');
  const [brandId, setBrandId] = useState(initialFilters.brandId || '');
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice || '');
  const [sort, setSort] = useState(initialFilters.sort || 'newest');
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [currentPage, setCurrentPage] = useState(initialPagination.page);

  // Build URL with current filters
  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (categoryId) params.set('category', categoryId);
    if (brandId) params.set('brand', brandId);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sort && sort !== 'newest') params.set('sort', sort);
    if (searchQuery) params.set('search', searchQuery);
    if (currentPage > 1) params.set('page', currentPage.toString());
    return `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
  }, [pathname, categoryId, brandId, minPrice, maxPrice, sort, searchQuery, currentPage]);

  // Navigate with filters
  const navigateWithFilters = useCallback(() => {
    router.push(buildUrl());
  }, [router, buildUrl]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setCategoryId('');
    setBrandId('');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setSearchQuery('');
    setCurrentPage(1);
    router.push(pathname);
  }, [router, pathname]);

  // Handle search submit
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    navigateWithFilters();
  }, [navigateWithFilters]);

  // Handle sort change
  const handleSortChange = useCallback((newSort: string) => {
    setSort(newSort);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [router, pathname, searchParams]);

  // Update products when URL changes (via navigation)
  useEffect(() => {
    setProducts(initialProducts);
    setPagination(initialPagination);
    setLoading(false);
  }, [initialProducts, initialPagination]);

  // Get page numbers for pagination
  const pageNumbers = useMemo(() => {
    const { page, totalPages } = pagination;
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 3) {
      for (let i = 1; i <= maxVisible; i++) pages.push(i);
    } else if (page >= totalPages - 2) {
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = page - 2; i <= page + 2; i++) pages.push(i);
    }
    return pages;
  }, [pagination]);

  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Bar */}
      <div className="mb-8">
        <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full px-5 py-3 pl-12 border border-gray-200 rounded-full focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-amber-500 text-white rounded-full text-sm hover:bg-amber-600 transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters - Desktop */}
        <div className="hidden lg:block lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Filters</h2>
              </div>
              <button 
                onClick={resetFilters}
                className="text-sm text-amber-600 hover:text-amber-700"
              >
                Reset All
              </button>
            </div>

            <CategoryFilter
              categories={categories}
              selectedCategory={categoryId}
              onSelect={(id) => {
                setCategoryId(id);
                setCurrentPage(1);
                navigateWithFilters();
              }}
            />

            <BrandFilter
              brands={brands}
              selectedBrand={brandId}
              onSelect={(id) => {
                setBrandId(id);
                setCurrentPage(1);
                navigateWithFilters();
              }}
            />

            <div className="pt-4 border-t border-gray-200">
              <PriceRangeFilter
                minPrice={minPrice}
                maxPrice={maxPrice}
                onApply={(min, max) => {
                  setMinPrice(min);
                  setMaxPrice(max);
                  setCurrentPage(1);
                  navigateWithFilters();
                }}
              />
            </div>
          </div>
        </div>

        {/* Mobile Filter Button */}
        <div className="lg:hidden sticky top-20 z-20 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-sm">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 bg-gray-100 rounded-lg"
          >
            <Filter className="w-4 h-4" />
            Filters
            {(categoryId || brandId || minPrice || maxPrice) && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                Active
              </span>
            )}
          </button>
        </div>

        {/* Products Section */}
        <div className="flex-1">
          {/* Sort and Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <p className="text-gray-600 text-sm">
              Showing <span className="font-semibold text-gray-900">{startItem}</span> to{' '}
              <span className="font-semibold text-gray-900">{endItem}</span>{' '}
              of <span className="font-semibold text-gray-900">{pagination.total}</span> products
            </p>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <LoadingSkeleton />
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or search criteria.</p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} brands={brands} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {pageNumbers.map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-10 h-10 rounded-lg transition-colors ${
                      pagination.page === pageNum
                        ? 'bg-amber-500 text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isFilterOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-50 shadow-xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Filters</h2>
              </div>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              <CategoryFilter
                categories={categories}
                selectedCategory={categoryId}
                onSelect={(id) => {
                  setCategoryId(id);
                  setCurrentPage(1);
                }}
              />
              
              <BrandFilter
                brands={brands}
                selectedBrand={brandId}
                onSelect={(id) => {
                  setBrandId(id);
                  setCurrentPage(1);
                }}
              />
              
              <PriceRangeFilter
                minPrice={minPrice}
                maxPrice={maxPrice}
                onApply={(min, max) => {
                  setMinPrice(min);
                  setMaxPrice(max);
                  setCurrentPage(1);
                }}
              />
            </div>
            
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Reset All
              </button>
              <button
                onClick={() => {
                  navigateWithFilters();
                  setIsFilterOpen(false);
                }}
                className="flex-1 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}