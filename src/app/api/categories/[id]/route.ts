// app/api/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect as connectDB } from '@/lib/dbConnect';
import { Category } from '@/models/Category';

// ==================== GET ====================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const category = await Category.findById(id).lean();

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== PUT ====================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Create update object with proper handling of parentId
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.specificationTemplate !== undefined) updateData.specificationTemplate = body.specificationTemplate;
    
    // Handle parentId specially - convert empty string to null
    if (body.parentId !== undefined) {
      // If parentId is empty string or null or undefined, set to null
      if (!body.parentId || body.parentId === '') {
        updateData.parentId = null;
      } 
      // If it's a valid ObjectId, use it
      else if (mongoose.Types.ObjectId.isValid(body.parentId)) {
        updateData.parentId = body.parentId;
      }
      // Otherwise, it's invalid
      else {
        return NextResponse.json(
          { error: 'Invalid parentId format' },
          { status: 400 }
        );
      }
    }
    
    // Update the category
    const category = await Category.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true, returnDocument: 'after' }
    );

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Error updating category:', error);
    
    // Handle duplicate slug error
    if (error.code === 11000 && error.keyPattern?.slug) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== DELETE ====================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Check if category has children
    const hasChildren = await Category.findOne({ parentId: id });
    if (hasChildren) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories. Please delete or reassign subcategories first.' },
        { status: 400 }
      );
    }

    const deleted = await Category.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}