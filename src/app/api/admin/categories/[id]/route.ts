// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { Category } from '@/models/Category';
import mongoose from 'mongoose';

// Helper function to update child paths
async function updateChildPaths(categoryId: mongoose.Types.ObjectId, parentPath: string[]) {
  const children = await Category.find({ parentId: categoryId });
  
  for (const child of children) {
    const newPath = [...parentPath, child.slug];
    await Category.findByIdAndUpdate(child._id, { path: newPath });
    await updateChildPaths(child._id, newPath);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Await the params Promise
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid category ID'
      }, { status: 400 });
    }
    
    // Check for duplicate slug
    const existingCategory = await Category.findOne({
      slug: body.slug,
      _id: { $ne: id }
    });
    
    if (existingCategory) {
      return NextResponse.json({
        success: false,
        error: 'Category with this slug already exists'
      }, { status: 409 });
    }
    
    // Get the current category before update
    const currentCategory = await Category.findById(id);
    if (!currentCategory) {
      return NextResponse.json({
        success: false,
        error: 'Category not found'
      }, { status: 404 });
    }
    
    // Calculate level and path based on parent
    let level = 0;
    let path: string[] = [body.slug];
    
    if (body.parentId && body.parentId !== '') {
      const parent = await Category.findById(body.parentId);
      if (parent) {
        level = parent.level + 1;
        path = [...parent.path, body.slug];
      }
    }
    
    // Update category
    const category = await Category.findByIdAndUpdate(
      id,
      { 
        ...body, 
        level, 
        path,
        updatedAt: new Date() 
      },
      { new: true, runValidators: true }
    );
    
    // If parent changed, update all children's paths
    if (body.parentId !== currentCategory.parentId?.toString()) {
      await updateChildPaths(category._id, path);
    }
    
    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update category'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // Await the params Promise
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid category ID'
      }, { status: 400 });
    }
    
    // Check if category has children
    const childCount = await Category.countDocuments({ parentId: id });
    if (childCount > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete category with subcategories. Delete subcategories first.'
      }, { status: 400 });
    }
    
    const category = await Category.findByIdAndDelete(id);
    
    if (!category) {
      return NextResponse.json({
        success: false,
        error: 'Category not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete category'
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // Await the params Promise
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid category ID'
      }, { status: 400 });
    }
    
    const category = await Category.findById(id);
    
    if (!category) {
      return NextResponse.json({
        success: false,
        error: 'Category not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: category
    });
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch category'
    }, { status: 500 });
  }
}