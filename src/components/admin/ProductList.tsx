// src/components/admin/ProductList.tsx
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { IProduct } from '@/types/product';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  StarOff,
  X
} from 'lucide-react';
import { cn, formatPrice, formatDate } from '@/lib/utils';

interface EnrichedProduct extends IProduct {
  brandName?: string;
  categoryName?: string;
  featured: boolean;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductListProps {
  initialProducts: EnrichedProduct[];
  initialPagination: PaginationInfo;
  initialFilters?: {
    search?: string;
    status?: string;
    featured?: string;
    minPrice?: string;
    maxPrice?: string;
    brandId?: string;
    categoryId?: string;
  };
}

// Available page limit options
const PAGE_LIMIT_OPTIONS = [5, 10, 15, 20, 25, 30, 50, 100];

export default function ProductList({
  initialProducts,
  initialPagination,
  initialFilters = {}
}: ProductListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [products, setProducts] = useState(initialProducts);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [brands, setBrands] = useState<Array<{ _id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([]);
  const [filters, setFilters] = useState({
    status: initialFilters.status || '',
    featured: initialFilters.featured || '',
    minPrice: initialFilters.minPrice || '',
    maxPrice: initialFilters.maxPrice || '',
    brandId: initialFilters.brandId || '',
    categoryId: initialFilters.categoryId || '',
  });

  // Fetch brands and categories for filters
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [brandsRes, categoriesRes] = await Promise.all([
          fetch('/api/brands?isActive=true'),
          fetch('/api/categories?status=active')
        ]);

        if (!brandsRes.ok) {
          throw new Error(`Brands API failed: ${brandsRes.status}`);
        }
        const brandsData = await brandsRes.json();

        if(!categoriesRes.ok){
          throw new Error(`Categories API failed: ${categoriesRes.status}`);
        }
        const categoriesData = await categoriesRes.json();


        if (brandsData.success) setBrands(brandsData.brands);
        if (categoriesData.success) setCategories(categoriesData.categories);
      } catch (error) {
        console.error('Failed to fetch filter data:', error);
      }
    };

    fetchFilterData();
  }, []);

  // Update URL with current filters
  const updateURL = useCallback((updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change (except when explicitly changing page)
    const hasFilterChange = updates.search !== undefined || updates.status !== undefined ||
      updates.featured !== undefined || updates.minPrice !== undefined ||
      updates.maxPrice !== undefined || updates.limit !== undefined ||
      updates.brandId !== undefined || updates.categoryId !== undefined;

    if (updates.page === undefined && hasFilterChange) {
      params.delete('page');
    }

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;

    startTransition(() => {
      router.push(url, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  // Fetch products when URL params change
  const fetchProducts = useCallback(async () => {
    setLoading(true);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const featured = searchParams.get('featured') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const brandId = searchParams.get('brandId') || '';
    const categoryId = searchParams.get('categoryId') || '';

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) queryParams.append('search', search);
    if (status) queryParams.append('status', status);
    if (featured) queryParams.append('featured', featured);
    if (minPrice) queryParams.append('minPrice', minPrice);
    if (maxPrice) queryParams.append('maxPrice', maxPrice);
    if (brandId) queryParams.append('brandId', brandId);
    if (categoryId) queryParams.append('categoryId', categoryId);

    try {
      const response = await fetch(`/api/products?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // Handle page limit change
  const handleLimitChange = (newLimit: number) => {
    updateURL({ limit: newLimit, page: 1 });
  };

  // Initial load and when URL changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);


  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURL({
        search: searchTerm || undefined,
        page: 1,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      updateURL({ search: searchTerm || undefined, page: 1 });
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateURL({
      [key]: value || undefined,
      page: 1
    });
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      featured: '',
      minPrice: '',
      maxPrice: '',
      brandId: '',
      categoryId: '',
    });
    setSearchTerm('');
    updateURL({
      search: undefined,
      status: undefined,
      featured: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      brandId: undefined,
      categoryId: undefined,
      page: 1
    });
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p._id)));
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedProducts.size} products?`)) return;

    const response = await fetch('/api/products/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds: Array.from(selectedProducts) }),
    });

    if (response.ok) {
      setSelectedProducts(new Set());
      fetchProducts();
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    const response = await fetch('/api/products/bulk-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productIds: Array.from(selectedProducts),
        status
      }),
    });

    if (response.ok) {
      setSelectedProducts(new Set());
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Delete this product?')) return;

    const response = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      fetchProducts();
    }
  };

  const handleToggleFeatured = async (productId: string, currentFeatured: boolean) => {
    const response = await fetch(`/api/products/${productId}/featured`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !currentFeatured }),
    });

    if (response.ok) {
      fetchProducts();
    }
  };

  const handlePageChange = (newPage: number) => {
    updateURL({ page: newPage });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Active</span>;
      case 'draft':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><Clock className="w-3 h-3" /> Draft</span>;
      case 'archived':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3" /> Archived</span>;
      default:
        return null;
    }
  };

  const showBulkActions = selectedProducts.size > 0;

  // Check if any filters are active
  const hasActiveFilters = filters.status || filters.featured || filters.minPrice || filters.maxPrice ||
    filters.brandId || filters.categoryId || searchTerm;

  // Get current limit from URL or default to 20
  const currentLimit = parseInt(searchParams.get('limit') || '20');

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Page Limit Selector - Left side */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">Show per page:</span>
            <select
              value={currentLimit}
              onChange={(e) => handleLimitChange(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white cursor-pointer hover:border-gray-400 transition-colors"
              aria-label="Items per page"
            >
              {PAGE_LIMIT_OPTIONS.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Optional: Show total items count */}
          <div className="hidden sm:block text-sm text-gray-500">
            Total: {pagination.total} items
          </div>
        </div>

        {/* Search and Actions - Right side */}
        <div className="flex gap-2 flex-1 sm:justify-end">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name, SKU, tags, brand, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors",
              showFilters || hasActiveFilters
                ? "bg-amber-50 border-amber-300 text-amber-700"
                : "border-gray-300 hover:bg-gray-50"
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          <Link
            href="/admin/products/create"
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Add Product
          </Link>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={filters.featured}
              onChange={(e) => handleFilterChange('featured', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">All Products</option>
              <option value="true">Featured Only</option>
              <option value="false">Non-Featured Only</option>
            </select>

            <select
              value={filters.brandId}
              onChange={(e) => handleFilterChange('brandId', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">All Brands</option>
              {brands.map(brand => (
                <option key={brand._id} value={brand._id}>{brand.name}</option>
              ))}
            </select>

            <select
              value={filters.categoryId}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />

            <input
              type="number"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-amber-800">
            {selectedProducts.size} product(s) selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkStatusUpdate('active')}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkStatusUpdate('draft')}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Draft
            </button>
            <button
              onClick={() => handleBulkStatusUpdate('archived')}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Archive
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === products.length && products.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Featured</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading || isPending ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                      <span className="ml-2">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product._id)}
                        onChange={() => handleSelectProduct(product._id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 relative flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                          {product.thumbnail && (
                            <Image
                              src={product.thumbnail}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {product.tags && product.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {product.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-xs text-gray-500">#{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.brandName || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.categoryName || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatPrice(product.lowestPrice)}
                      {product.highestPrice && product.highestPrice !== product.lowestPrice && (
                        <span className="text-gray-400 text-xs">
                          {' '}- {formatPrice(product.highestPrice)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-sm font-medium",
                        product.totalInventory === 0 ? "text-red-600" : "text-gray-900"
                      )}>
                        {product.totalInventory}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleFeatured(product._id, product.featured)}
                        className="text-gray-400 hover:text-amber-500 transition-colors"
                      >
                        {product.featured ? (
                          <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                        ) : (
                          <StarOff className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(product.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${product._id}`}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/products/${product._id}/edit`}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500 order-2 sm:order-1">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
            </div>

            <div className="flex gap-2 order-1 sm:order-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={cn(
                        "px-3 py-1 border rounded transition-colors",
                        pagination.page === pageNum
                          ? "bg-amber-600 text-white border-amber-600"
                          : "border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}