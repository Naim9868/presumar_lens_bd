
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { Brand } from '@/models/Brand';
import mongoose from 'mongoose';

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
        error: 'Invalid brand ID'
      }, { status: 400 });
    }
    
    const brand = await Brand.findById(id).lean();
    
    if (!brand) {
      return NextResponse.json({
        success: false,
        error: 'Brand not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: brand
    });
  } catch (error: any) {
    console.error('Error fetching brand:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch brand'
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
        error: 'Invalid brand ID'
      }, { status: 400 });
    }
    
    // Check for duplicate slug
    const existingBrand = await Brand.findOne({
      slug: body.slug,
      _id: { $ne: id }
    });
    
    if (existingBrand) {
      return NextResponse.json({
        success: false,
        error: 'Brand with this slug already exists'
      }, { status: 409 });
    }
    
    const brand = await Brand.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!brand) {
      return NextResponse.json({
        success: false,
        error: 'Brand not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: brand,
      message: 'Brand updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating brand:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update brand'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid brand ID'
      }, { status: 400 });
    }
    
    // Check if brand has products (optional)
    // const productCount = await Product.countDocuments({ brandId: id });
    // if (productCount > 0) {
    //   return NextResponse.json({
    //     success: false,
    //     error: `Cannot delete brand with ${productCount} products. Reassign products first.`
    //   }, { status: 400 });
    // }
    
    const brand = await Brand.findByIdAndDelete(id);
    
    if (!brand) {
      return NextResponse.json({
        success: false,
        error: 'Brand not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Brand deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting brand:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete brand'
    }, { status: 500 });
  }
}