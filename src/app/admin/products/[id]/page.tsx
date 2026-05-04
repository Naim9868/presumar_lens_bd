// app/admin/products/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Package, Tag, DollarSign, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  brandId: { name: string; _id: string };
  categoryId: { name: string; _id: string };
  thumbnail: string;
  images: string[];
  tags: string[];
  status: string;
  lowestPrice: number;
  highestPrice: number;
  totalInventory?: number;
  specsFlat: Array<{
    key: string;
    label: string;
    value: any;
    group: string;
    unit?: string;
  }>;
  variants: Array<{
    sku: string;
    attributes: Array<{ key: string; value: string }>;
    price: number;
    compareAtPrice?: number;
    inventory: number;
    isDefault: boolean;
    status: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'variants'>('details');

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      
      // Calculate total inventory from variants if not provided by API
      if (data.variants && data.variants.length > 0) {
        data.totalInventory = data.variants.reduce((sum: number, variant: any) => 
          sum + (variant.inventory || 0), 0
        );
      } else {
        data.totalInventory = 0;
      }
      
      // Calculate price range if not provided
      if (data.variants && data.variants.length > 0) {
        const prices = data.variants.map((v: any) => v.price);
        data.lowestPrice = Math.min(...prices);
        data.highestPrice = Math.max(...prices);
      }
      
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/products');
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getVariantStatusBadge = (status: string) => {
    const colors = {
      in_stock: 'bg-green-100 text-green-800',
      out_of_stock: 'bg-red-100 text-red-800',
      discontinued: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Calculate real-time total inventory
  const getTotalInventory = () => {
    if (!product?.variants) return 0;
    return product.variants.reduce((sum, variant) => sum + (variant.inventory || 0), 0);
  };

  // Calculate real-time price range
  const getPriceRange = () => {
    if (!product?.variants || product.variants.length === 0) {
      return { min: 0, max: 0 };
    }
    const prices = product.variants.map(v => v.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Product not found</p>
          <Link href="/admin/products" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const totalInventory = getTotalInventory();
  const priceRange = getPriceRange();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <Link href="/admin/products" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Products
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-sm text-gray-500 mt-1">Slug: {product.slug}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/admin/products/${productId}/edit`)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'specs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab('variants')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'variants'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Variants ({product.variants?.length || 0})
            </button>
          </nav>
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-gray-400" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Price Range</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${priceRange.min.toFixed(2)} - ${priceRange.max.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-gray-400" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Total Inventory</p>
                    <p className="text-lg font-semibold text-gray-900">{totalInventory} units</p>
                    {product.variants && product.variants.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Across {product.variants.length} variant(s)
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center">
                  <Tag className="h-8 w-8 text-gray-400" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${getStatusBadge(product.status)}`}>
                      {product.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Images</p>
                    <p className="text-lg font-semibold text-gray-900">{product.images?.length || 0} + thumbnail</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Product Information</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Category</h3>
                  <p className="mt-1 text-sm text-gray-900">{product.categoryId?.name || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Brand</h3>
                  <p className="mt-1 text-sm text-gray-900">{product.brandId?.name || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Short Description</h3>
                  <p className="mt-1 text-sm text-gray-900">{product.shortDescription}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Full Description</h3>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{product.description}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {product.tags?.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Images</h2>
              <div className="flex flex-wrap gap-4">
                {product.thumbnail && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Thumbnail</p>
                    <div className="relative h-32 w-32">
                      <Image
                        src={product.thumbnail}
                        alt="Thumbnail"
                        fill
                        className="object-cover rounded border"
                      />
                    </div>
                  </div>
                )}
                {product.images?.map((img, idx) => (
                  <div key={idx}>
                    <p className="text-xs text-gray-500 mb-1">Image {idx + 1}</p>
                    <div className="relative h-32 w-32">
                      <Image
                        src={img}
                        alt={`Product ${idx + 1}`}
                        fill
                        className="object-cover rounded border"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Meta Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                  <p className="mt-1 text-sm text-gray-900">{new Date(product.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <p className="mt-1 text-sm text-gray-900">{new Date(product.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Specifications Tab */}
        {activeTab === 'specs' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Product Specifications</h2>
            {product.specsFlat && product.specsFlat.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(
                  product.specsFlat.reduce((groups, spec) => {
                    if (!groups[spec.group]) groups[spec.group] = [];
                    groups[spec.group].push(spec);
                    return groups;
                  }, {} as Record<string, typeof product.specsFlat>)
                ).map(([groupName, specs]) => (
                  <div key={groupName}>
                    <h3 className="text-md font-medium text-gray-900 mb-3">{groupName}</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="bg-white divide-y divide-gray-200">
                          {specs.map((spec, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 w-1/3 bg-gray-50">
                                {spec.label}
                                {spec.unit && <span className="text-gray-500 text-xs ml-1">({spec.unit})</span>}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {Array.isArray(spec.value) 
                                  ? spec.value.join(', ') 
                                  : spec.value?.toString() || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No specifications defined for this product.</p>
            )}
          </div>
        )}

        {/* Variants Tab */}
        {activeTab === 'variants' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Product Variants</h2>
            {product.variants && product.variants.length > 0 ? (
              <>
                {/* Variants Summary */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Variants</p>
                      <p className="text-xl font-semibold text-gray-900">{product.variants.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Inventory</p>
                      <p className="text-xl font-semibold text-gray-900">{totalInventory}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Price Range</p>
                      <p className="text-xl font-semibold text-gray-900">
                        ${priceRange.min.toFixed(2)} - ${priceRange.max.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Default Variant</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {product.variants.find(v => v.isDefault)?.sku || 'None'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Variants Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attributes</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compare At</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {product.variants.map((variant, idx) => (
                        <tr key={idx} className={variant.isDefault ? 'bg-blue-50' : ''}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {variant.isDefault && <span className="text-blue-600 text-xs font-medium">Default</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                            {variant.sku}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {variant.attributes.map(attr => `${attr.key}: ${attr.value}`).join(', ')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            ${variant.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {variant.compareAtPrice ? `$${variant.compareAtPrice.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {variant.inventory}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getVariantStatusBadge(variant.status)}`}>
                              {variant.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-gray-500">No variants defined for this product.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}