// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { ProductVariant } from '@/types/product';
import { deleteImage, extractPublicIdFromUrl } from '@/lib/cloudinary'
import mongoose from 'mongoose';

type Variant = {
  price?: number;
  inventory?: number;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid product ID'
      }, { status: 400 });
    }
    
    const product = await Product.findById(id)
      .populate('brandId')
      .populate('categoryId')
      .lean();
    
    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }

    /* ===============================
       CALCULATIONS
    =============================== */
    let totalInventory = 0;
    let lowestPrice = 0;
    let highestPrice = 0;

    if (product.variants && product.variants.length > 0) {
      const variants = product.variants as Variant[];

      totalInventory = variants.reduce(
        (sum: number, variant) => sum + (variant.inventory ?? 0),
        0
      );

      const prices = variants.map(v => v.price ?? 0);

      lowestPrice = Math.min(...prices);
      highestPrice = Math.max(...prices);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...product,
        totalInventory,
        lowestPrice,
        highestPrice,
      }
    });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch product'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid product ID'
      }, { status: 400 });
    }
    
    const product = await Product.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update product'
    }, { status: 500 });
  }
}

// Helper function to delete all images from Cloudinary
async function deleteProductImages(product: any): Promise<{ success: number; failed: number }> {
  const imagesToDelete: string[] = [];
  
  // Add thumbnail
  if (product.thumbnail) {
    imagesToDelete.push(product.thumbnail);
  }
  
  // Add all product images
  if (product.images && product.images.length > 0) {
    imagesToDelete.push(...product.images);
  }
  
  // Add all variant images
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach((variant: ProductVariant) => {
      if (variant.images && variant.images.length > 0) {
        imagesToDelete.push(...variant.images);
      }
    });
  }
  
  // Remove duplicates
  const uniqueImages = [...new Set(imagesToDelete)];
  
  let successCount = 0;
  let failedCount = 0;
  
  // Delete each image from Cloudinary
  for (const imageUrl of uniqueImages) {
    const publicId = extractPublicIdFromUrl(imageUrl);
    if (publicId) {
      try {
        await deleteImage(publicId);
        successCount++;
        console.log(`[Delete] Deleted image: ${publicId}`);
      } catch (error) {
        failedCount++;
        console.error(`[Delete] Failed to delete image ${publicId}:`, error);
      }
    }
  }
  
  return { success: successCount, failed: failedCount };
}



export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid product ID'
      }, { status: 400 });
    }
    
    // Find the product first to get all image URLs
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }
    
    // Delete all associated images from Cloudinary
    // console.log(`[Delete] Deleting images for product: ${product.name} (ID: ${id})`);
    const { success: deletedCount, failed: failedCount } = await deleteProductImages(product);
    
    // console.log(`[Delete] Images deleted: ${deletedCount} successful, ${failedCount} failed`);
    
    // Delete the product from database
    await Product.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      deletedImages: {
        success: deletedCount,
        failed: failedCount
      }
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete product'
    }, { status: 500 });
  }
}