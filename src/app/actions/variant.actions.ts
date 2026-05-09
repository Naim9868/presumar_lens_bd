// app/actions/variant.actions.ts
'use server';

// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
import { dbConnect as connectToDatabase } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { ProductVariant } from '@/types/product';
import { revalidatePath } from 'next/cache';

export async function deleteVariant(productId: string, variantSku: string) {
  try {
    // const session = await getServerSession(authOptions);
    
    // if (!session || session.user.role !== 'admin') {
    //   return { success: false, message: 'Unauthorized' };
    // }
    
    await connectToDatabase();
    
    // Find the product
    const product = await Product.findById(productId);
    
    if (!product) {
      return { success: false, message: 'Product not found' };
    }
    
    // Check if variant exists
    const variantExists = product.variants.some((v: ProductVariant) => v.sku === variantSku);
    if (!variantExists) {
      return { success: false, message: 'Variant not found' };
    }

    // console.log("Existing Variant:", variantExists);
    
    // Check if it's the only variant
    // if (product.variants.length === 1) {
    //   return { 
    //     success: false, 
    //     message: 'Cannot delete the only variant. Please delete the product instead.' 
    //   };
    // }
    
    // Remove the variant
    product.variants = product.variants.filter((v: ProductVariant) => v.sku !== variantSku);
    
    // Recalculate aggregates
    const prices = product.variants.map((v: ProductVariant) => v.price);
    product.lowestPrice = Math.min(...prices);
    product.highestPrice = Math.max(...prices);
    product.totalInventory = product.variants.reduce((sum: number, v: ProductVariant) => sum + v.inventory, 0);
    
    // Ensure there's a default variant
    // if (!product.variants.some((v: any) => v.isDefault)) {
    //   product.variants[0].isDefault = true;
    // }
    
    // Save the product
    await product.save();
    
    // Prepare clean response data (no circular references)
    const cleanVariants = product.variants.map((v: ProductVariant) => ({
      sku: v.sku,
      variantKey: v.variantKey,
      attributes: v.attributes,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      inventory: v.inventory,
      reserved: v.reserved,
    //   weight: v.weight,
      images: v.images,
      isDefault: v.isDefault,
      status: v.status,
    }));
    
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath('/admin/products');
    
    return {
      success: true,
      message: 'Variant deleted successfully',
      updatedProduct: {
        variants: cleanVariants,
        totalInventory: product.totalInventory,
        lowestPrice: product.lowestPrice,
        highestPrice: product.highestPrice,
      },
    };
  } catch (error: any) {
    console.error('Error deleting variant:', error);
    return { success: false, message: error.message || 'Internal server error' };
  }
}