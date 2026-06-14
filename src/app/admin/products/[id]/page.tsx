// src/app/admin/products/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Package,
  DollarSign,
  Boxes,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  StarOff,
  Tag,
  Award,
  Building2,
  FolderTree,
  Layers,
  Video,
  Image as ImageIcon,
  ExternalLink,
  TrendingUp,
  Eye,
  Shield,
  Zap,
  Sparkles,
  Loader2,
  Trash2,
  Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice, formatDate, cn } from '@/lib/utils';

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  thumbnailPublicId?: string;
  status: 'draft' | 'active' | 'archived';
  featured: boolean;
  searchBoost: number;
  lowestPrice: number;
  highestPrice?: number;
  totalInventory: number;
  tags: string[];
  badges: Array<{
    id: string;
    label: string;
    color?: string;
    icon?: string;
    type?: 'default' | 'custom';
  }>;
  specificationGroups: any[];
  variants: any[];
  imageGroups: any[];
  videos: any[];
  relatedProducts: any[];
  seo: any;
  createdAt: string;
  updatedAt: string;
  brand?: {
    _id: string;
    name: string;
    slug: string;
    logo?: string;
  };
  category?: {
    _id: string;
    name: string;
    slug: string;
    image?: string;
  };
  subcategory?: {
    _id: string;
    name: string;
    slug: string;
  };
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [activeImageTab, setActiveImageTab] = useState<string>('all');

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();
      console.log('Fetched product data:', data);
      if (data.success) {
        setProduct(data.product);
      } else {
        toast.error('Failed to load product');
        router.push('/admin/products');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async () => {
    if (!product) return;

    try {
      const response = await fetch(`/api/products/${productId}/featured`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !product.featured }),
      });

      const data = await response.json();

      if (data.success) {
        setProduct({ ...product, featured: !product.featured });
        toast.success(product.featured ? 'Removed from featured' : 'Added to featured');
      } else {
        toast.error(data.error || 'Failed to update featured status');
      }
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Failed to update featured status');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Product deleted successfully');
        router.push('/admin/products');
      } else {
        toast.error(data.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const response = await fetch(`/api/products/${productId}/duplicate`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Product duplicated successfully');
        router.push(`/admin/products/${data.product._id}/edit`);
      } else {
        toast.error(data.error || 'Failed to duplicate product');
      }
    } catch (error) {
      console.error('Error duplicating product:', error);
      toast.error('Failed to duplicate product');
    } finally {
      setDuplicating(false);
    }
  };

  const getStatusBadge = () => {
    if (!product) return null;

    switch (product.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3.5 h-3.5" />
            Active
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="w-3.5 h-3.5" />
            Draft
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3.5 h-3.5" />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  const getVariantStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <span className="text-xs text-green-600 font-medium">In Stock</span>;
      case 'out_of_stock':
        return <span className="text-xs text-red-600 font-medium">Out of Stock</span>;
      case 'discontinued':
        return <span className="text-xs text-gray-500 font-medium">Discontinued</span>;
      default:
        return null;
    }
  };

  const getAllImages = () => {
    const images: { url: string; alt: string; group: string }[] = [];

    // Add thumbnail
    if (product?.thumbnail) {
      images.push({ url: product.thumbnail, alt: product.name, group: 'thumbnail' });
    }

    // Add images from groups
    product?.imageGroups?.forEach((group) => {
      group.images?.forEach((img: any) => {
        images.push({ url: img.url, alt: img.alt || group.title, group: group.title });
      });
    });

    return images;
  };

  const getFilteredImages = () => {
    const allImages = getAllImages();
    if (activeImageTab === 'all') {
      return allImages;
    }
    return allImages.filter(img => img.group === activeImageTab);
  };

  const imageTabs = () => {
    const tabs = [{ id: 'all', label: 'All Images', count: getAllImages().length }];

    product?.imageGroups?.forEach((group) => {
      tabs.push({
        id: group.title,
        label: group.title,
        count: group.images?.length || 0,
      });
    });

    return tabs;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
            <Package className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-4">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="group p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                  {getStatusBadge()}
                  {product.featured && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  Product ID: {product._id} • Slug: {product.slug}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleFeatured}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                {product.featured ? (
                  <>
                    <StarOff className="w-4 h-4" />
                    Remove Featured
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4" />
                    Mark Featured
                  </>
                )}
              </button>
              <button
                onClick={handleDuplicate}
                disabled={duplicating}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Copy className="w-4 h-4" />
                {duplicating ? 'Duplicating...' : 'Duplicate'}
              </button>
              <Link
                href={`/admin/products/${product._id}/edit`}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Product
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Price Range</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatPrice(product.lowestPrice)}
                      {product.highestPrice && product.highestPrice !== product.lowestPrice && (
                        <span className="text-gray-400 text-sm"> - {formatPrice(product.highestPrice)}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-xl">
                    <Boxes className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Inventory</p>
                    <p className="text-lg font-bold text-gray-900">{product.totalInventory} units</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Variants</p>
                    <p className="text-lg font-bold text-gray-900">{product.variants?.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Search Boost</p>
                    <p className="text-lg font-bold text-gray-900">{product.searchBoost}/10</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <h3 className="text-lg font-semibold text-gray-900">Description</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Short Description</h4>
                  <p className="text-gray-600">{product.shortDescription}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Full Description</h4>
                  <div className="text-gray-600 whitespace-pre-wrap">{product.description}</div>
                </div>
              </div>
            </div>

            {/* Specifications */}
            {product.specificationGroups && product.specificationGroups.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Specifications</h3>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {product.specificationGroups.map((group, idx) => (
                    <div key={idx}>
                      <h4 className="text-md font-semibold text-gray-900 mb-3">{group.groupName}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {group.specifications?.map((spec: any, specIdx: number) => (
                          <div key={specIdx} className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">{spec.label}</span>
                            <span className="text-sm font-medium text-gray-900">
                              {spec.value}
                              {spec.unit && ` ${spec.unit}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Variants Table */}
            {product.variants && product.variants.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Variants</h3>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attributes</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compare At</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inventory</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {product.variants.map((variant, idx) => (
                        <tr key={idx} className={variant.isDefault ? 'bg-amber-50/50' : ''}>
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">{variant.sku}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {variant.attributes?.map((attr: any, attrIdx: number) => (
                                <span key={attrIdx} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                                  {attr.key}: {attr.value}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">${variant.price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {variant.compareAtPrice ? `$${variant.compareAtPrice.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{variant.inventory}</td>
                          <td className="px-4 py-3">{getVariantStatusBadge(variant.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Thumbnail */}
            {product.thumbnail && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-rose-50 to-white">
                  <h3 className="text-lg font-semibold text-gray-900">Thumbnail</h3>
                </div>
                <div className="p-6">
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={product.thumbnail}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Organization */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white">
                <h3 className="text-lg font-semibold text-gray-900">Organization</h3>
              </div>
              <div className="p-6 space-y-4">
                {product.brand && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Brand</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.brand.logo && (
                        <div className="w-6 h-6 relative rounded overflow-hidden">
                          <Image src={product.brand.logo} alt={product.brand.name} fill className="object-contain" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900">{product.brand.name}</span>
                    </div>
                  </div>
                )}
                {product.category && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Category</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{product.category.name}</span>
                  </div>
                )}
                {product.subcategory && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Subcategory</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{product.subcategory.name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Created</span>
                  </div>
                  <span className="text-sm text-gray-900">{formatDate(product.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Last Updated</span>
                  </div>
                  <span className="text-sm text-gray-900">{formatDate(product.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Tags & Badges */}
            {(product.tags?.length > 0 || product.badges?.length > 0) && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-white">
                  <h3 className="text-lg font-semibold text-gray-900">Tags & Badges</h3>
                </div>
                <div className="p-6 space-y-4">
                  {product.tags?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-cyan-600" />
                        <span className="text-sm font-medium text-gray-700">Tags</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {product.tags.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-1 bg-cyan-50 text-cyan-700 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.badges?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-gray-700">Badges</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {product.badges.map((badge, idx) => {
                          // Handle both string and object badges for backward compatibility
                          const badgeLabel = typeof badge === 'string' ? badge : badge.label;
                          const badgeId = typeof badge === 'string' ? badge : badge.id;
                          const badgeColor = typeof badge === 'string'
                            ? 'bg-amber-50 text-amber-700'
                            : badge.color || 'bg-amber-50 text-amber-700';

                          return (
                            <span
                              key={badgeId || idx}
                              className={cn(
                                "text-xs px-2 py-1 rounded-full capitalize",
                                badgeColor
                              )}
                            >
                              {badgeLabel}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SEO Preview */}
            {product.seo?.metaTitle && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-white">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-semibold text-gray-900">SEO Preview</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-1">
                    <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                      {product.seo.metaTitle || product.name}
                    </div>
                    <div className="text-xs text-green-600">
                      {process.env.NEXT_PUBLIC_APP_URL}/product/{product.slug}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {product.seo.metaDescription || product.shortDescription}
                    </div>
                  </div>
                  {product.seo.noIndex && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                      <Shield className="w-3 h-3" />
                      Hidden from search engines
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Media Section - Images */}
        {getAllImages().length > 0 && (
          <div className="mt-6">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-white">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-pink-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Media Gallery</h3>
                </div>
              </div>
              <div className="p-6">
                {/* Image Tabs */}
                <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-3">
                  {imageTabs().map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveImageTab(tab.id)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        activeImageTab === tab.id
                          ? "bg-pink-100 text-pink-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                {/* Images Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {getFilteredImages().map((image, idx) => (
                    <div key={idx} className="group relative">
                      <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                        <Image
                          src={image.url}
                          alt={image.alt}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={image.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      {image.group !== 'thumbnail' && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{image.group}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Videos Section */}
        {product.videos && product.videos.length > 0 && (
          <div className="mt-6">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Videos</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {product.videos.map((video, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="aspect-video bg-gray-100 relative">
                        {video.thumbnail && (
                          <Image
                            src={video.thumbnail}
                            alt={video.title || 'Video thumbnail'}
                            fill
                            className="object-cover"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Video className="w-10 h-10 text-white" />
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900 truncate">{video.title}</p>
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                        >
                          Watch Video <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}