// src/actions/product/bulkUpdateStatus.ts
'use server';

import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { ProductStatus } from '@/types/product';
import { Types } from 'mongoose';
import { revalidatePath } from 'next/cache';

export async function bulkUpdateStatus(productIds: string[], status: ProductStatus) {
  try {
    await connectDB();

    const validIds = productIds.filter(id => Types.ObjectId.isValid(id));
    
    if (validIds.length === 0) {
      return { success: false, error: 'No valid product IDs provided' };
    }

    const objectIds = validIds.map(id => new Types.ObjectId(id));

    await Product.updateMany(
      { _id: { $in: objectIds } },
      { status }
    );

    revalidatePath('/admin/products');

    return { 
      success: true, 
      updatedCount: validIds.length 
    };
  } catch (error) {
    console.error('Bulk update status error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update product status',
    };
  }
}