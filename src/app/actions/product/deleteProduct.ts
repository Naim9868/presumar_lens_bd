// src/actions/product/deleteProduct.ts
'use server';

import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { Types } from 'mongoose';
import { revalidatePath } from 'next/cache';

export async function deleteProduct(productId: string) {
  try {
    await connectDB();

    if (!Types.ObjectId.isValid(productId)) {
      return { success: false, error: 'Invalid product ID' };
    }

    const product = await Product.findById(productId);

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    // Soft delete
    product.deletedAt = new Date();
    await product.save();

    revalidatePath('/admin/products');

    return { success: true };
  } catch (error) {
    console.error('Delete product error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete product',
    };
  }
}