'use server';

import { Product } from '@/models/Product';
import { dbConnect as connectDB } from '@/lib/dbConnect';

export async function verifyProductAvailability(productId: string, variantKey?: string) {
  try {
    await connectDB();
    
    const product = await Product.findById(productId).lean();
    if (!product) {
      return { available: false, stock: 0, price: 0 };
    }
    
    let variant = product.variants?.find((v: any) => v.isDefault);
    if (variantKey) {
      variant = product.variants?.find((v: any) => v.variantKey === variantKey);
    }
    
    if (!variant) {
      return { available: false, stock: 0, price: 0 };
    }
    
    const availableStock = variant.inventory - (variant.reserved || 0);
    
    return {
      available: availableStock > 0 && product.status === 'active',
      stock: availableStock,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      sku: variant.sku,
    };
  } catch (error) {
    console.error('Error verifying product:', error);
    return { available: false, stock: 0, price: 0 };
  }
}