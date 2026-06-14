// app/actions/product/getProductBySlug.ts
'use server';

import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { Brand } from '@/models/Brand';

export async function getProductBySlug(slug: string) {
  try {
    await connectDB();

    const product = await Product.findOne({ slug, status: 'active', deletedAt: null })
      .populate('brandId', 'name slug')
      .populate('categoryId', 'name slug')
      .populate('subcategoryId', 'name slug')
      .lean();

    if (!product) {
      return {
        success: false,
        product: null,
        error: 'Product not found',
      };
    }

    // Transform the product to have brand and category objects instead of IDs
    const transformedProduct = {
      ...product,
      _id: product._id.toString(),
      brandId: product.brandId?._id?.toString() || '',
      categoryId: product.categoryId?._id?.toString() || '',
      subcategoryId: product.subcategoryId?._id?.toString() || null,
      // Add populated brand and category for easy access
      brand: product.brandId ? {
        _id: product.brandId._id.toString(),
        name: product.brandId.name,
        slug: product.brandId.slug,
      } : null,
      category: product.categoryId ? {
        _id: product.categoryId._id.toString(),
        name: product.categoryId.name,
        slug: product.categoryId.slug,
      } : null,
      subcategory: product.subcategoryId ? {
        _id: product.subcategoryId._id.toString(),
        name: product.subcategoryId.name,
        slug: product.subcategoryId.slug,
      } : null,
      // Convert dates to ISO strings
      createdAt: product.createdAt?.toISOString(),
      updatedAt: product.updatedAt?.toISOString(),
    };

    return {
      success: true,
      product: transformedProduct,
    };
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return {
      success: false,
      product: null,
      error: error instanceof Error ? error.message : 'Failed to fetch product',
    };
  }
}