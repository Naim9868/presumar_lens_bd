// app/admin/products/[id]/ProductDetailClient.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Package, Tag, DollarSign, Image as ImageIcon, Eye, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { IProduct, VariantAttribute, ProductVariant } from '@/types/product';
import { deleteVariant } from '@/app/actions/variant.actions';

interface ProductDetailClientProps {
  initialProduct: IProduct;
  productId: string;
}

export default function ProductDetailClient({ initialProduct, productId }: ProductDetailClientProps) {
  const router = useRouter();
  const [product, setProduct] = useState<IProduct>(initialProduct);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'variants'>('details');
  const [deleting, setDeleting] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [deletingVariant, setDeletingVariant] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/products');
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product');
    } finally {
      setDeleting(false);
    }
  };

  const handleVariantClick = (variant: ProductVariant) => {
    // console.log('Clicked variant:', variant);
    setSelectedVariant(variant);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedVariant(null);
  };

 

const handleDeleteVariant = async () => {
  if (!selectedVariant) return;
  
  const confirmDelete = confirm(`Are you sure you want to delete variant "${selectedVariant.sku}"? This action cannot be undone.`);
  if (!confirmDelete) return;
  
  setDeletingVariant(true);
  try {
    const result = await deleteVariant(productId, selectedVariant.sku);
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    // Update the product state
    if (result.updatedProduct) {
      const updatedProduct = {
        ...product,
        variants: result.updatedProduct.variants,
        totalInventory: result.updatedProduct.totalInventory,
        lowestPrice: result.updatedProduct.lowestPrice,
        highestPrice: result.updatedProduct.highestPrice,
      };
      setProduct(updatedProduct);
    } else {
      // Manual update if no updatedProduct from server
      const updatedVariants = product.variants.filter(v => v.sku !== selectedVariant.sku);
    //   let finalVariants = updatedVariants;
      
    //   if (result.wasDefault && updatedVariants.length > 0 && !updatedVariants.some(v => v.isDefault)) {
    //     finalVariants = updatedVariants.map((v, idx) => ({
    //       ...v,
    //       isDefault: idx === 0
    //     }));
    //   }
      
      setProduct({
        ...product,
        variants: updatedVariants,
        totalInventory: updatedVariants.reduce((sum, v) => sum + (v.inventory || 0), 0),
      });
    }
    
    closePreview();
    alert('Variant deleted successfully!');
    
    if (product.variants.length === 1) {
      setActiveTab('details');
    }
    
  } catch (error) {
    console.error('Error deleting variant:', error);
    alert(error instanceof Error ? error.message : 'Failed to delete variant');
  } finally {
    setDeletingVariant(false);
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
                disabled={deleting}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {deleting ? 'Deleting...' : 'Delete'}
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
                      ${product.price?.toFixed(2)} - ${product.maxPrice?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-gray-400" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Total Inventory</p>
                    <p className="text-lg font-semibold text-gray-900">{product.totalInventory || 0} units</p>
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
                  <p className="mt-1 text-sm text-gray-900">{product.category?.name || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Brand</h3>
                  <p className="mt-1 text-sm text-gray-900">{product.brand?.name || 'N/A'}</p>
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
                      <p className="text-xl font-semibold text-gray-900">{product.totalInventory || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Price Range</p>
                      <p className="text-xl font-semibold text-gray-900">
                        ${product.price?.toFixed(2)} - ${product.maxPrice?.toFixed(2)}
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</th>
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
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handleVariantClick(variant)}
                              className="text-blue-600 hover:text-blue-800 focus:outline-none"
                              title="Preview Variant"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
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

      {/* Variant Preview Modal */}
      {showPreview && selectedVariant && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={closePreview}>
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            {/* <div className="fixed  inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={closePreview}>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            </div> */}

            {/* Modal panel - stop propagation to prevent closing when clicking inside modal */}
            <div 
              className="inline-block  overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Variant Preview
                  </h3>
                  <button
                    onClick={closePreview}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Variant Images */}
                  {selectedVariant.images && selectedVariant.images.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Images</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedVariant.images.map((img: string, idx: number) => (
                          <div key={idx} className="relative h-24 w-24">
                            <Image
                              src={img}
                              alt={`Variant ${idx + 1}`}
                              fill
                              className="object-cover rounded border"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500">No variant-specific images</p>
                    </div>
                  )}

                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">SKU</h4>
                      <p className="text-sm text-gray-900 font-mono">{selectedVariant.sku}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Status</h4>
                      <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${getVariantStatusBadge(selectedVariant.status)}`}>
                        {selectedVariant.status?.replace('_', ' ') || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Price</h4>
                      <p className="text-lg font-semibold text-gray-900">
                        ${selectedVariant.price?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Compare at Price</h4>
                      <p className="text-sm text-gray-600">
                        {selectedVariant.compareAtPrice ? `$${selectedVariant.compareAtPrice.toFixed(2)}` : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Inventory */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Available Stock</h4>
                      <p className="text-sm text-gray-900">{selectedVariant.inventory || 0} units</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Reserved Stock</h4>
                      <p className="text-sm text-gray-900">{selectedVariant.reserved || 0} units</p>
                    </div>
                  </div>

                  {/* Attributes */}
                  {selectedVariant.attributes && selectedVariant.attributes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Attributes</h4>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                        {selectedVariant.attributes.map((attr: VariantAttribute, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="font-medium text-gray-600">{attr.key}:</span>
                            <span className="text-gray-900">{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Default Badge */}
                  {selectedVariant.isDefault && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Default Variant
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteVariant}
                  disabled={deletingVariant}
                  className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingVariant ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Variant
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/admin/products/${productId}/edit?variant=${selectedVariant.sku}`)}
                  className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Variant
                </button>
                <button
                  type="button"
                  onClick={closePreview}
                  className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}