'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProductForm } from '@/app/admin/components/ProductForm';
import type { ProductSpec, ProductVariant, ProductFormData } from '@/app/admin/components/ProductForm';

interface ApiResponse {
  success: boolean;
  data?: {
    _id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    brandId: string | { _id: string; name: string; slug: string };
    categoryId: string | { _id: string; name: string; slug: string };
    subcategoryId?: string | { _id: string; name: string; slug: string };
    thumbnail: string;
    images: string[];
    tags: string[];
    status: 'draft' | 'active' | 'archived';
    specsFlat: ProductSpec[];
    variants: ProductVariant[];
    lowestPrice?: number;
    highestPrice?: number;
    totalInventory?: number;
  };
  error?: string;
}

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const [productData, setProductData] = useState<{
    formData: ProductFormData;
    specs: ProductSpec[];
    variants: ProductVariant[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/products/${productId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch product');
      }

      const result: ApiResponse = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('Product not found');
      }

      const product = result.data;
      
      console.log('Product data from API:', product);
      
      // Extract IDs from populated fields
      const brandId = typeof product.brandId === 'object' && product.brandId !== null
        ? product.brandId._id
        : product.brandId;

      const categoryId = typeof product.categoryId === 'object' && product.categoryId !== null
        ? product.categoryId._id
        : product.categoryId;

      const subcategoryId = product.subcategoryId && typeof product.subcategoryId === 'object'
        ? product.subcategoryId._id
        : product.subcategoryId;

      // Prepare form data
      const formData: ProductFormData = {
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        brandId: brandId as string || '',
        categoryId: categoryId as string || '',
        subcategoryId: subcategoryId as string || '',
        thumbnail: product.thumbnail || '',
        images: product.images || [],
        tags: product.tags || [],
        status: product.status || 'draft'
      };
      
      
      setProductData({
        formData,
        specs: product.specsFlat || [],
        variants: product.variants || []
      });
      
    } catch (error) {
      console.error('Error fetching product:', error);
      setError(error instanceof Error ? error.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchProduct}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <ProductForm
      initialData={productData}
      productId={productId}
      isEditing={true}
    />
  );
}