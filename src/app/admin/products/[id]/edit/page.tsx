'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ProductForm } from '@/app/admin/components/ProductForm';
import type {
  ProductSpec,
  ProductVariant,
  ProductFormData,
} from '@/app/admin/components/ProductForm';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export default function EditProductPage() {
  const { id: productId } = useParams<{ id: string }>();

  const [initialData, setInitialData] = useState<{
    formData: ProductFormData;
    specs: ProductSpec[];
    variants: ProductVariant[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/admin/products/${productId}`);
      const result: ApiResponse = await res.json();

      if (!res.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch product');
      }

      const p = result.data;
      // console.log('Fetched product:', p);

      const extractId = (field: any) =>
        typeof field === 'object' && field !== null ? field._id : field;

      setInitialData({
        formData: {
          name: p.name || '',
          slug: p.slug || '',
          description: p.description || '',
          shortDescription: p.shortDescription || '',
          brandId: extractId(p.brandId) || '',
          categoryId: extractId(p.categoryId) || '',
          subcategoryId: extractId(p.subcategoryId) || '',
          thumbnail: p.thumbnail || '',
          images: p.images || [],
          tags: p.tags || [],
          status: p.status || 'draft',
        },
        specs: p.specsFlat || [],
        variants: p.variants || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Loading UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  // Error UI
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchProduct}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Not found
  if (!initialData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Product not found</p>
      </div>
    );
  }

  // Main form
  return (
    <ProductForm
      initialData={initialData}
      productId={productId}
      isEditing={true}
      onSuccess={() => {
        // optional: toast or analytics hook
        console.log('Product updated successfully');
      }}
    />
  );
}