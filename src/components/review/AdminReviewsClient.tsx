'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Eye,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUpload from '@/components/admin/ImageUploader';

type ReviewStatus = 'pending' | 'approved' | 'rejected';
type ModalMode = 'create' | 'edit' | 'view';

interface ProductOption {
  _id: string;
  name: string;
  slug?: string;
  thumbnail?: string;
}

interface ProductApiItem {
  _id?: string;
  name?: string;
  slug?: string;
  thumbnail?: string;
}

interface AdminReview {
  _id: string;
  productId: string;
  product: ProductOption | null;
  name: string;
  email: string;
  rating: number;
  image: string;
  imagePublicId?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  status: ReviewStatus;
  source: 'customer' | 'admin';
  createdAt: string | null;
  updatedAt: string | null;
}

interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ReviewFormState {
  productId: string;
  name: string;
  email: string;
  rating: number;
  image: string;
  imagePublicId: string;
  comment: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
}

const emptyStats: ReviewStats = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
};

const emptyPagination: PaginationState = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

const emptyForm: ReviewFormState = {
  productId: '',
  name: '',
  email: '',
  rating: 5,
  image: '',
  imagePublicId: '',
  comment: '',
  status: 'approved',
  isVerifiedPurchase: false,
};

const statusStyles: Record<ReviewStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const statusLabels: Record<ReviewStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

function formatDate(value: string | null) {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getProductName(review: AdminReview) {
  return review.product?.name || 'Product not found';
}

function normalizeProducts(productList: ProductApiItem[]) {
  return productList
    .filter((product): product is ProductOption => Boolean(product._id && product.name))
    .map((product) => ({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      thumbnail: product.thumbnail,
    }));
}

function mergeProductOptions(...productGroups: Array<Array<ProductOption | null | undefined>>) {
  const map = new Map<string, ProductOption>();

  productGroups.flat().forEach((product) => {
    if (product?._id) {
      map.set(product._id, product);
    }
  });

  return Array.from(map.values()).sort((first, second) => first.name.localeCompare(second.name));
}

export default function AdminReviewsClient() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [formProducts, setFormProducts] = useState<ProductOption[]>([]);
  const [stats, setStats] = useState<ReviewStats>(emptyStats);
  const [pagination, setPagination] = useState<PaginationState>(emptyPagination);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [formProductsLoading, setFormProductsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | ReviewStatus>('pending');
  const [productFilter, setProductFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const [formProductSearch, setFormProductSearch] = useState('');
  const [productResultsOpen, setProductResultsOpen] = useState(false);
  const [formProductResultsOpen, setFormProductResultsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [form, setForm] = useState<ReviewFormState>(emptyForm);
  const [useImageLink, setUseImageLink] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [currentPublicId, setCurrentPublicId] = useState('');

  const totalPages = Math.max(pagination.totalPages || 1, 1);

  const selectedProductName = mergeProductOptions(
    products,
    formProducts,
    selectedReview?.product ? [selectedReview.product] : []
  ).find((item) => item._id === form.productId)?.name || '';

  const selectedFilterProductName = products.find((product) => product._id === productFilter)?.name || '';

  const fetchProductOptions = useCallback(async (query = '', limit = 50) => {
    const params = new URLSearchParams({
      limit: String(limit),
    });

    if (query.trim()) {
      params.set('search', query.trim());
    }

    const response = await fetch(`/api/products?${params.toString()}`);
    const data = await response.json() as { products?: ProductApiItem[]; data?: ProductApiItem[] };

    if (!response.ok || data === null) {
      throw new Error('Failed to load products');
    }

    return normalizeProducts(data.products || data.data || []);
  }, []);

  const fetchReviews = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        admin: 'true',
        page: String(page),
        limit: String(pagination.limit),
        status: statusFilter,
      });

      if (productFilter !== 'all') params.set('productId', productFilter);
      if (search.trim()) params.set('search', search.trim());

      const response = await fetch(`/api/reviews?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch reviews');
      }

      setReviews(data.reviews || []);
      setStats(data.stats || emptyStats);
      setPagination(data.pagination || emptyPagination);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, productFilter, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProductsLoading(true);
      fetchProductOptions(productSearch, 50)
        .then((items) => {
          setProducts((current) => mergeProductOptions(
            productFilter !== 'all' ? current.filter((product) => product._id === productFilter) : [],
            items
          ));
        })
        .catch((error) => {
          console.error('Failed to fetch products:', error);
          toast.error('Failed to load products');
        })
        .finally(() => setProductsLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProductOptions, productFilter, productSearch]);

  useEffect(() => {
    if (!modalMode || modalMode === 'view') return;

    const timer = setTimeout(() => {
      setFormProductsLoading(true);
      fetchProductOptions(formProductSearch, 30)
        .then((items) => {
          const selectedProduct = form.productId
            ? formProducts.find(p => p._id === form.productId)
            : null;

          const reviewProduct = selectedReview?.product ? [selectedReview.product] : [];

          setFormProducts(mergeProductOptions(
            selectedProduct ? [selectedProduct] : [],
            reviewProduct,
            items
          ));
        })
        .catch((error) => {
          console.error('Failed to fetch form products:', error);
          toast.error('Failed to load product search results');
        })
        .finally(() => setFormProductsLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchProductOptions, form.productId, formProductSearch, modalMode, selectedReview?.product]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReviews(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchReviews]);

  const openCreateModal = () => {
    setSelectedReview(null);
    const selectedFilterProduct = productFilter !== 'all'
      ? products.find((product) => product._id === productFilter)
      : null;

    setFormProductSearch(selectedFilterProduct?.name || '');
    setFormProductResultsOpen(false);
    const initialProducts = selectedFilterProduct
      ? [selectedFilterProduct]
      : products.length > 0 ? products : [];
    setFormProducts(initialProducts);
    setForm({
      ...emptyForm,
      productId: productFilter !== 'all' ? productFilter : (products[0]?._id || ''),
    });
    setCurrentImageUrl('');
    setCurrentPublicId('');
    setUseImageLink(false);
    setModalMode('create');
  };

  const openEditModal = (review: AdminReview) => {
    setSelectedReview(review);
    setFormProductSearch(review.product?.name || '');
    setFormProductResultsOpen(false);
    setFormProducts(mergeProductOptions(
      review.product ? [review.product] : [],
      products
    ));
    setForm({
      productId: review.productId,
      name: review.name,
      email: review.email,
      rating: review.rating,
      image: review.image || '',
      imagePublicId: review.imagePublicId || '',
      comment: review.comment,
      status: review.status,
      isVerifiedPurchase: review.isVerifiedPurchase,
    });
    setCurrentImageUrl(review.image || '');
    setCurrentPublicId(review.imagePublicId || '');
    setUseImageLink(!!review.image && review.image.startsWith('http') && !review.imagePublicId);
    setModalMode('edit');
  };

  const openViewModal = (review: AdminReview) => {
    setSelectedReview(review);
    setModalMode('view');
  };

  const closeModal = () => {
    if (saving) return;
    setModalMode(null);
    setSelectedReview(null);
    setFormProductSearch('');
    setFormProductResultsOpen(false);
    setFormProducts([]);
    setForm(emptyForm);
    setCurrentImageUrl('');
    setCurrentPublicId('');
    setUseImageLink(false);
  };

  const handleImageUpload = (url: string, publicId?: string) => {
    setForm(prev => ({
      ...prev,
      image: url,
      imagePublicId: publicId || ''
    }));
    setCurrentImageUrl(url);
    setCurrentPublicId(publicId || '');
  };

  const handleImageLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setCurrentImageUrl(url);
    setForm(prev => ({
      ...prev,
      image: url,
      imagePublicId: '' // Clear publicId when using external link
    }));
  };

  const saveReview = async () => {
    if (!form.productId) {
      toast.error('Select a product');
      return;
    }
    if (!form.name.trim() || !form.comment.trim()) {
      toast.error('Name and comment are required');
      return;
    }

    setSaving(true);
    try {
      const isEdit = modalMode === 'edit' && selectedReview;
      const response = await fetch(isEdit ? `/api/reviews/${selectedReview._id}` : '/api/reviews', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source: isEdit ? selectedReview.source : 'admin',
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save review');
      }

      toast.success(isEdit ? 'Review updated' : 'Review created');
      closeModal();
      fetchReviews(pagination.page);
    } catch (error) {
      console.error('Failed to save review:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  const updateReviewStatus = async (review: AdminReview, status: ReviewStatus) => {
    try {
      const response = await fetch(`/api/reviews/${review._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update review');
      }

      toast.success(`Review ${statusLabels[status].toLowerCase()}`);
      fetchReviews(pagination.page);
    } catch (error) {
      console.error('Failed to update review:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update review');
    }
  };

  const deleteReview = async (review: AdminReview) => {
    if (!confirm(`Delete review by "${review.name}"?`)) return;

    try {
      // Delete image if it has a publicId
      if (review.imagePublicId) {
        try {
          const imageRes = await fetch(
            `/api/upload?publicId=${review.imagePublicId}`,
            { method: "DELETE" }
          );
          if (!imageRes.ok) {
            console.warn('Failed to delete review image');
          }
        } catch (error) {
          console.warn('Error deleting review image:', error);
        }
      }

      const response = await fetch(`/api/reviews/${review._id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete review');
      }

      toast.success('Review deleted');
      fetchReviews(pagination.page);
    } catch (error) {
      console.error('Failed to delete review:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete review');
    }
  };

  const setPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setPagination((current) => ({ ...current, page: nextPage }));
    fetchReviews(nextPage);
  };

  const selectFilterProduct = (product: ProductOption) => {
    setProductFilter(product._id);
    setProductSearch(product.name);
    setProductResultsOpen(false);
    setProducts((current) => mergeProductOptions([product], current));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const clearFilterProduct = () => {
    setProductFilter('all');
    setProductSearch('');
    setProductResultsOpen(false);
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const selectFormProduct = (product: ProductOption) => {
    setForm((current) => ({ ...current, productId: product._id }));
    setFormProductSearch(product.name);
    setFormProductResultsOpen(false);
    setFormProducts((current) => mergeProductOptions([product], current));
  };

  const clearFormProduct = () => {
    setForm((current) => ({ ...current, productId: '' }));
    setFormProductSearch('');
    setFormProductResultsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="mt-1 text-sm text-gray-500">
            Moderate customer reviews and create product reviews from the admin panel.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchReviews(pagination.page)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-600"
          >
            <Plus className="h-4 w-4" />
            Create Review
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Reviews', value: stats.total, icon: Star, tone: 'bg-gray-100 text-gray-700' },
          { label: 'Pending Approval', value: stats.pending, icon: Clock, tone: 'bg-amber-100 text-amber-700' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle2, tone: 'bg-emerald-100 text-emerald-700' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, tone: 'bg-red-100 text-red-700' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
              </div>
              <div className={`rounded-lg p-2 ${tone}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* //search bar */}
      <div className="rounded-lg border border-gray-100 bg-white p-3 sm:p-4 shadow-sm">
        <div className="grid gap-3">
          {/* First row - Search and Status Filter */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reviewer, email, or comment"
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as 'all' | ReviewStatus);
                setPagination((current) => ({ ...current, page: 1 }));
              }}
              className="w-full sm:w-auto rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Second row - Product Search */}
          <div className="relative">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={productSearch}
                onBlur={() => window.setTimeout(() => setProductResultsOpen(false), 150)}
                onChange={(event) => {
                  setProductSearch(event.target.value);
                  setProductResultsOpen(true);
                }}
                onFocus={() => setProductResultsOpen(true)}
                placeholder="Search and select product"
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
              />
              {productFilter !== 'all' && (
                <button
                  type="button"
                  onClick={clearFilterProduct}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  title="Clear product filter"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Product Results Dropdown */}
            {productResultsOpen && (
              <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 sm:max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    clearFilterProduct();
                  }}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-amber-50"
                >
                  <span className="font-medium">All products</span>
                  {productFilter === 'all' && <span className="text-xs text-amber-600">Selected</span>}
                </button>
                {productsLoading ? (
                  <div className="flex items-center gap-2 px-3 py-3 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                    Searching products
                  </div>
                ) : products.length > 0 ? (
                  products.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        selectFilterProduct(product);
                      }}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-amber-50"
                    >
                      <span className="line-clamp-1 font-medium">{product.name}</span>
                      {productFilter === product._id && <span className="shrink-0 text-xs text-amber-600">Selected</span>}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-3 text-sm text-gray-500">No matching products found.</div>
                )}
              </div>
            )}

            {/* Selected Product Display */}
            <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600 break-all sm:break-normal">
              Selected product: <span className="font-semibold text-gray-900">{productFilter === 'all' ? 'All products' : selectedFilterProductName || 'Product selected'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* //review table */}
      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <p className="text-sm text-gray-500">
            {loading ? 'Loading reviews...' : `${pagination.total.toLocaleString()} reviews found`}
          </p>
          <div className='flex flex-row gap-2'>
            <p className="text-sm text-gray-500">Rows per page:</p>
            <select
              value={pagination.limit}
              onChange={(event) => {
                setPagination((current) => ({
                  ...current,
                  page: 1,
                  limit: Number(event.target.value),
                }));
              }}
              className="rounded-lg border border-gray-200 bg-white py-1 text-sm text-gray-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            >
              {[10, 20, 30, 50, 100].map((limit) => (
                <option key={limit} value={limit}>
                  {limit} rows
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Review</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-amber-500" />
                    Loading reviews
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    No reviews match the current filters.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review._id} className="hover:bg-gray-50/70">
                    <td className="max-w-md px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                          {review.name.charAt(0).toUpperCase() || 'R'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-gray-900">{review.name}</p>
                            {review.source === 'admin' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                <ShieldCheck className="h-3 w-3" />
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{review.comment}</p>
                          {review.email && <p className="mt-1 text-xs text-gray-400">{review.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">{getProductName(review)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={`h-4 w-4 ${index < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[review.status]}`}>
                        {statusLabels[review.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">{formatDate(review.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {review.status !== 'approved' && (
                          <button
                            onClick={() => updateReviewStatus(review, 'approved')}
                            className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50"
                            title="Approve"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        {review.status !== 'rejected' && (
                          <button
                            onClick={() => updateReviewStatus(review, 'rejected')}
                            className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openViewModal(review)}
                          className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(review)}
                          className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteReview(review)}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(pagination.page + 1)}
              disabled={pagination.page >= totalPages || loading}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {modalMode === 'create' ? 'Create Review' : modalMode === 'edit' ? 'Edit Review' : 'Review Details'}
                </h2>
                {modalMode !== 'view' && selectedProductName && (
                  <p className="mt-0.5 text-sm text-gray-500">{selectedProductName}</p>
                )}
              </div>
              <button onClick={closeModal} className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-5">
              {modalMode === 'view' && selectedReview ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Product</p>
                    <p className="mt-1 font-medium text-gray-900">{getProductName(selectedReview)}</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Reviewer</p>
                      <p className="mt-1 font-medium text-gray-900">{selectedReview.name}</p>
                      {selectedReview.email && <p className="text-sm text-gray-500">{selectedReview.email}</p>}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Status</p>
                      <span className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[selectedReview.status]}`}>
                        {statusLabels[selectedReview.status]}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Rating</p>
                    <div className="mt-1 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-5 w-5 ${index < selectedReview.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Comment</p>
                    <p className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                      {selectedReview.comment}
                    </p>
                  </div>
                  {selectedReview.image && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Image</p>
                      <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedReview.image}
                          alt={`Review by ${selectedReview.name}`}
                          className="max-h-72 w-full object-contain"
                        />
                      </div>
                      <p className="mt-1.5 break-all text-xs text-gray-500">{selectedReview.image}</p>
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Created</p>
                      <p className="mt-1 text-sm text-gray-600">{formatDate(selectedReview.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Updated</p>
                      <p className="mt-1 text-sm text-gray-600">{formatDate(selectedReview.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Product</label>
                    <div className="relative mb-2">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        value={formProductSearch}
                        onChange={(event) => {
                          setFormProductSearch(event.target.value);
                          setFormProductResultsOpen(true);
                        }}
                        onFocus={() => setFormProductResultsOpen(true)}
                        placeholder="Search products by name"
                        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      />
                    </div>

                    {formProductResultsOpen && (
                      <div className="relative z-10">
                        <div className="absolute left-0 right-0 top-0 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                          {formProductsLoading ? (
                            <div className="flex items-center gap-2 px-3 py-3 text-sm text-gray-500">
                              <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                              Searching products...
                            </div>
                          ) : formProducts.length > 0 ? (
                            formProducts.map((product) => (
                              <button
                                key={product._id}
                                type="button"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  selectFormProduct(product);
                                  setFormProductResultsOpen(false);
                                }}
                                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-amber-50"
                              >
                                <span className="line-clamp-1">{product.name}</span>
                                {form.productId === product._id && (
                                  <span className="shrink-0 text-xs text-amber-600">Selected</span>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-3 text-sm text-gray-500">
                              {formProductSearch.trim() ? 'No products found' : 'Start typing to search products'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <select
                      value={form.productId}
                      onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    >
                      <option value="">{formProductsLoading ? 'Searching products...' : 'Select product'}</option>
                      {formProducts.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    {!formProductsLoading && formProducts.length === 0 && (
                      <p className="mt-1.5 text-xs text-gray-500">No products found for this search.</p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">Reviewer name</label>
                      <input
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">Rating</label>
                      <select
                        value={form.rating}
                        onChange={(event) => setForm((current) => ({ ...current, rating: Number(event.target.value) }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      >
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <option key={rating} value={rating}>
                            {rating} star{rating === 1 ? '' : 's'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={form.status}
                        onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ReviewStatus }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.isVerifiedPurchase}
                        onChange={(event) => setForm((current) => ({ ...current, isVerifiedPurchase: event.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                      />
                      Verified
                    </label>
                  </div>

                  {/* Image Upload with Toggle - Exactly like CategoriesManager */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium text-gray-700">
                        Review Image
                      </label>
                      <button
                        type="button"
                        onClick={() => setUseImageLink(!useImageLink)}
                        className="text-xs text-amber-600 hover:text-amber-700 hover:underline"
                      >
                        {useImageLink ? 'Use Upload' : 'Use Image Link'}
                      </button>
                    </div>

                    {useImageLink ? (
                      <div>
                        <input
                          type="url"
                          placeholder="https://example.com/review-image.jpg"
                          onChange={handleImageLinkChange}
                          value={currentImageUrl}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter a URL for the review image
                        </p>
                      </div>
                    ) : (
                      <div>
                        <ImageUpload
                          onUpload={handleImageUpload}
                          defaultValue={currentImageUrl}
                          defaultPublicId={currentPublicId}
                          folder="reviews"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Upload an image or toggle to use an external link
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Comment</label>
                    <textarea
                      value={form.comment}
                      onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
                      rows={5}
                      className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
              <button
                onClick={closeModal}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                {modalMode === 'view' ? 'Close' : 'Cancel'}
              </button>
              {modalMode !== 'view' && (
                <button
                  onClick={saveReview}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Review
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}