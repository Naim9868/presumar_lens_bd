// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { Category } from '@/models/Category';
import { deleteImage, extractPublicIdFromUrl } from '@/lib/cloudinary';
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
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name: body.name,
        slug: body.slug,
        image: body.image,
        description: body.description,
        parentId: body.parentId,
        status: body.status,
        specificationTemplate: body.specificationTemplate,
        level,
        path 
      },
      { returnDocument: 'after', runValidators: true }
    );
    
    if (!updatedCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    // If parent changed, update all children's paths
    if (body.parentId !== currentCategory.parentId?.toString()) {
      await updateChildPaths(updatedCategory._id, path);
    }
    
    return NextResponse.json({
      success: true,
      data: updatedCategory,
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
     // Find category first to get image URL
    const category = await Category.findById(id);

    // Check if category has children
    const childCount = await Category.countDocuments({ parentId: id });
    if (childCount > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete category with subcategories. Delete subcategories first.'
      }, { status: 400 });
    }

   
    
    if (!category) {
      return NextResponse.json({
        success: false,
        error: 'Category not found'
      }, { status: 404 });
    }
    
    // Delete category image from Cloudinary if exists
    if (category.image) {
      const publicId = extractPublicIdFromUrl(category.image);
      if (publicId) {
        try {
          await deleteImage(publicId);
          console.log(`Deleted category image: ${publicId}`);
        } catch (error) {
          console.error('Failed to delete category image:', error);
        }
      }
    }
    
   await Category.findByIdAndDelete(id);
    
    
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