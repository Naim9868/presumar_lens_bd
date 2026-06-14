// src/app/api/categories/route.ts (updated POST method)
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { Category } from '@/models/Category';
import { Types } from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const parentId = searchParams.get('parentId');
    
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (parentId) {
      query.parentId = parentId === 'null' ? null : new Types.ObjectId(parentId);
    }
    
    const categories = await Category.find(query)
      .sort({ name: 1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      categories: categories.map(cat => ({
        ...cat,
        _id: cat._id.toString(),
        parentId: cat.parentId?.toString() || null,
      })),
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Generate slug
    const slug = body.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Check for duplicate slug
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category with similar name already exists' },
        { status: 400 }
      );
    }
    
    const category = new Category({
      name: body.name,
      slug,
      image: body.image,
      imagePublicId: body.imagePublicId,
      description: body.description,
      parentId: body.parentId ? new Types.ObjectId(body.parentId) : null,
      status: body.status || 'active',
    });
    
    await category.save();
    
    return NextResponse.json({
      success: true,
      category: {
        _id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        image: category.image,
        imagePublicId: category.imagePublicId,
        description: category.description,
        parentId: category.parentId?.toString() || null,
        status: category.status,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}