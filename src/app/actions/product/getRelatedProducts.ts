// src/actions/product/getRelatedProducts.ts
'use server';

import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { Types } from 'mongoose';

interface GetRelatedProductsParams {
  categoryId: string;
  excludeId: string;
  limit?: number;
}

export async function getRelatedProducts({ categoryId, excludeId, limit = 4 }: GetRelatedProductsParams) {
  try {
    await connectDB();

    if (!Types.ObjectId.isValid(categoryId)) {
      return { success: false, error: 'Invalid category ID', products: [] };
    }

    const products = await Product.find({
      categoryId: new Types.ObjectId(categoryId),
      _id: { $ne: new Types.ObjectId(excludeId) },
      status: 'active',
      deletedAt: null,
    })
      .select('_id name slug thumbnail lowestPrice highestPrice')
      .limit(limit)
      .lean();

    return {
      success: true,
      products: products.map(product => ({
        _id: product._id.toString(),
        name: product.name,
        slug: product.slug,
        thumbnail: product.thumbnail,
        lowestPrice: product.lowestPrice,
        highestPrice: product.highestPrice,
      })),
    };
  } catch (error) {
    console.error('Get related products error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch related products',
      products: [],
    };
  }
}