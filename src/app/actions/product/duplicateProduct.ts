// src/actions/product/duplicateProduct.ts
'use server';

import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { Types } from 'mongoose';
import { revalidatePath } from 'next/cache';
import { generateSKU } from '@/lib/utils';
import { IProductVariant } from '@/types/product';

export async function duplicateProduct(productId: string, resetInventory: boolean = false) {
  try {
    await connectDB();

    if (!Types.ObjectId.isValid(productId)) {
      return { success: false, error: 'Invalid product ID' };
    }

    const originalProduct = await Product.findById(productId);

    if (!originalProduct) {
      return { success: false, error: 'Product not found' };
    }

    // Create duplicate
    const productData = originalProduct.toObject();
    delete productData._id;
    delete productData.createdAt;
    delete productData.updatedAt;
    delete productData.slug;
    delete productData.deletedAt;

    // Modify for duplicate
    productData.name = `${productData.name} (Copy)`;
    productData.status = 'draft';
    
    // Reset inventory if requested
    if (resetInventory) {
      productData.variants = productData.variants.map((v: IProductVariant) => ({
        ...v,
        sku: generateSKU(),
        inventory: 0,
        reserved: 0,
      }));
    }

    const newProduct = new Product(productData);
    await newProduct.save();

    revalidatePath('/admin/products');

    return {
      success: true,
      product: {
        _id: newProduct._id.toString(),
        name: newProduct.name,
        slug: newProduct.slug,
      },
    };
  } catch (error) {
    console.error('Duplicate product error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to duplicate product',
    };
  }
}