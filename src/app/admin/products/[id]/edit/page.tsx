// app/admin/products/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProductForm } from '@/app/admin/components/ProductForm';


interface ProductData {
  formData: {
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    brandId: string;
    categoryId: string;
    subcategoryId: string;
    thumbnail: string;
    images: string[];
    tags: string[];
    status: 'draft' | 'active' | 'archived';
  };
  specs: Array<Record<string, unknown>>;
  variants: Array<Record<string, unknown>>;
}

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${productId}`);
      const product = await res.json();

      const brandId = typeof product.brandId === 'object' && product.brandId !== null
        ? product.brandId._id 
        : product.brandId;
      
      const categoryId = typeof product.categoryId === 'object' && product.categoryId !== null
        ? product.categoryId._id 
        : product.categoryId;
      
      const subcategoryId = typeof product.subcategoryId === 'object' && product.subcategoryId !== null
        ? product.subcategoryId._id 
        : product.subcategoryId;

      setProductData({
        formData: {
          name: product.name || '',
          slug: product.slug || '',
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          brandId: brandId || '',
          categoryId: categoryId || '',
          subcategoryId: subcategoryId || '',
          thumbnail: product.thumbnail || '',
          images: product.images || [],
          tags: product.tags || [],
          status: product.status || 'draft'
        },
        specs: product.specsFlat || [],
        variants: product.variants || []
      });
    } catch (error) {
      console.error('Error fetching product:', error);
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

  if (!productData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Product not found</p>
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