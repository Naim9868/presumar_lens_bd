// src/actions/product/bulkDeleteProducts.ts
'use server';

import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { Types } from 'mongoose';
import { revalidatePath } from 'next/cache';

export async function bulkDeleteProducts(productIds: string[]) {
  try {
    await connectDB();

    const validIds = productIds.filter(id => Types.ObjectId.isValid(id));
    
    if (validIds.length === 0) {
      return { success: false, error: 'No valid product IDs provided' };
    }

    const objectIds = validIds.map(id => new Types.ObjectId(id));

    await Product.updateMany(
      { _id: { $in: objectIds } },
      { deletedAt: new Date() }
    );

    revalidatePath('/admin/products');

    return { 
      success: true, 
      deletedCount: validIds.length 
    };
  } catch (error) {
    console.error('Bulk delete products error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete products',
    };
  }
}