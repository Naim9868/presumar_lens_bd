// src/app/api/products/[id]/featured/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { Types } from 'mongoose';
import { revalidatePath } from 'next/cache';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    const { featured } = body;
    
    if (typeof featured !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Featured status must be a boolean' },
        { status: 400 }
      );
    }
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    product.featured = featured;
    await product.save();
    
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${id}`);
    revalidatePath(`/admin/products/${id}/edit`);
    
    return NextResponse.json({
      success: true,
      product: {
        _id: product._id.toString(),
        name: product.name,
        featured: product.featured,
      },
    });
  } catch (error) {
    console.error('Error updating featured status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update featured status' },
      { status: 500 }
    );
  }
}

export async function GET(
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
    
    const product = await Product.findById(id).select('featured name');
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      product: {
        _id: product._id.toString(),
        name: product.name,
        featured: product.featured,
      },
    });
  } catch (error) {
    console.error('Error fetching featured status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured status' },
      { status: 500 }
    );
  }
}