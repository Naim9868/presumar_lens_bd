// app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect as connectDB } from '@/lib/dbConnect';
import { Category } from '@/models/Category';
import { CreateCategorySchema } from '@/lib/validations/product.validation';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const categories = await Category.find(filter)
      .sort({ name: 1 })
      .lean();
    
    // Build hierarchy
    const buildTree = (items: any[], parentId: string | null = null): any[] => {
      return items
        .filter(item => 
          parentId === null ? !item.parentId : item.parentId?.toString() === parentId
        )
        .map(item => ({
          ...item,
          _id: item._id.toString(),
          parentId: item.parentId?.toString() || null,
          children: buildTree(items, item._id.toString())
        }));
    };
    
    const categoryTree = buildTree(categories);
    
    return NextResponse.json(categoryTree);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    console.log('Received category data:', body);
    
    // Generate slug if not provided
    if (!body.slug && body.name) {
      body.slug = body.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    
    // Handle parentId - convert empty string to null
    if (body.parentId === '' || body.parentId === null || body.parentId === undefined) {
      delete body.parentId;
    }
    
    // Validate parentId exists if provided
    if (body.parentId && !mongoose.Types.ObjectId.isValid(body.parentId)) {
      return NextResponse.json(
        { error: 'Invalid parent category ID format' },
        { status: 400 }
      );
    }
    
    // Check if parent category exists
    if (body.parentId) {
      const parentExists = await Category.findById(body.parentId);
      if (!parentExists) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 404 }
        );
      }
    }
    
    // Check if slug already exists
    const existingCategory = await Category.findOne({ slug: body.slug });
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      );
    }
    
    // Create the category
    const category = new Category(body);
    await category.save();
    
    console.log('Category created:', category);
    
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    // Handle duplicate slug error
    if (error.code === 11000 && error.keyPattern?.slug) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}