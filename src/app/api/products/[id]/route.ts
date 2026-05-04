// app/api/products/[id]/route.ts (add GET method)
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect as connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    const product = await Product.findById(id)
      .populate('categoryId', 'name slug specificationTemplate')
      .populate('brandId', 'name')
      .lean();
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    // Calculate total inventory from variants
    let totalInventory = 0;
    let lowestPrice = Infinity;
    let highestPrice = -Infinity;
    
    if (product.variants && product.variants.length > 0) {
      totalInventory = product.variants.reduce((sum, variant) => 
        sum + (variant.inventory || 0), 0
      );
      
      const prices = product.variants.map(v => v.price);
      lowestPrice = Math.min(...prices);
      highestPrice = Math.max(...prices);
    }
    
    return NextResponse.json({
      ...product,
      totalInventory,
      lowestPrice: lowestPrice === Infinity ? 0 : lowestPrice,
      highestPrice: highestPrice === -Infinity ? 0 : highestPrice,
    });
    
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// app/api/products/[id]/route.ts - Update the PUT method

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Clean the body - remove empty subcategoryId
    const cleanBody = { ...body };
    if (cleanBody.subcategoryId === '' || cleanBody.subcategoryId === null || cleanBody.subcategoryId === undefined) {
      delete cleanBody.subcategoryId;
    }
    
    const product = await Product.findByIdAndUpdate(
      id,
      { $set: cleanBody },
      { new: true, runValidators: true, returnDocument: 'after' }
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error updating product:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    // Handle duplicate slug error
    if (error.code === 11000 && error.keyPattern?.slug) {
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}