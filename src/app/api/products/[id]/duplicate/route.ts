// src/app/api/products/[id]/duplicate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { Types } from 'mongoose';
import { generateSKU } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    const originalProduct = await Product.findById(id);
    
    if (!originalProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Create duplicate product data
    const productData = originalProduct.toObject();
    delete productData._id;
    delete productData.createdAt;
    delete productData.updatedAt;
    delete productData.__v;
    delete productData.slug;
    delete productData.searchKeywords;
    delete productData.specsFlat;
    delete productData.lowestPrice;
    delete productData.highestPrice;
    delete productData.totalInventory;
    
    // Modify for duplicate
    productData.name = `${productData.name} (Copy)`;
    productData.status = 'draft';
    productData.featured = false;
    
    // Update variants with new SKUs
    if (productData.variants && productData.variants.length > 0) {
      productData.variants = productData.variants.map((variant: any) => ({
        ...variant,
        sku: generateSKU(),
        variantKey: `variant_${Date.now()}`,
        inventory: 0,
        reserved: 0,
      }));
    }
    
    const newProduct = new Product(productData);
    await newProduct.save();
    
    revalidatePath('/admin/products');
    
    return NextResponse.json({
      success: true,
      product: {
        _id: newProduct._id.toString(),
        name: newProduct.name,
        slug: newProduct.slug,
      },
    });
  } catch (error) {
    console.error('Error duplicating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to duplicate product' },
      { status: 500 }
    );
  }
}