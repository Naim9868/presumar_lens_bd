// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { createProduct } from '@/app/actions/product/createProduct';
import { getProducts } from '@/app/actions/product/getProducts';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const query = searchParams.get('search') || undefined;
    const status = searchParams.get('status') as any;
    const featured = searchParams.get('featured');
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    
    const result = await getProducts({
      page,
      limit,
      query,
      status,
      minPrice,
      maxPrice,
    });
    
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Clean up empty strings for ObjectId fields
    if (body.subcategoryId === '' || body.subcategoryId === null || body.subcategoryId === undefined) {
      delete body.subcategoryId;
    }
    
    // Ensure variants array exists
    if (!body.variants || body.variants.length === 0) {
      // Create default variant from simple product data
      body.variants = [];
      body.hasVariants = body.hasVariants || false;
    }
    
    // Ensure imageGroups array exists
    if (!body.imageGroups) {
      body.imageGroups = [];
    }
    
    // Ensure videos array exists
    if (!body.videos) {
      body.videos = [];
    }
    
    // Ensure tags array exists
    if (!body.tags) {
      body.tags = [];
    }
    
    // Ensure badges array exists
    if (!body.badges) {
      body.badges = [];
    }
    
    // Ensure specificationGroups array exists
    if (!body.specificationGroups) {
      body.specificationGroups = [];
    }
    
     console.log('BODY BADGES:', body.badges);
    // console.log('Creating product with data:', JSON.stringify(body, null, 2));
    
    const result = await createProduct(body);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
}