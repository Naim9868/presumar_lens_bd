// src/app/api/brands/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { Brand } from '@/models/Brand';
import { createBrand, getBrands } from '@/app/actions/brand/getBrands';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search') || undefined;
    
    const brands = await getBrands({
      isActive: isActive ? isActive === 'true' : undefined,
      search,
    });
    
    return NextResponse.json({ success: true, brands });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}

//  (updated POST method)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Brand name is required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Check if brand already exists
    const existingBrand = await Brand.findOne({ 
      name: { $regex: new RegExp(`^${body.name}$`, 'i') } 
    });
    
    if (existingBrand) {
      return NextResponse.json(
        { success: false, error: 'Brand with this name already exists' },
        { status: 400 }
      );
    }
    
    // Generate slug
    const slug = body.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const brand = new Brand({
      name: body.name,
      slug,
      logo: body.logo,
      logoPublicId: body.logoPublicId,
      description: body.description,
      website: body.website,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });
    
    await brand.save();
    
    return NextResponse.json({
      success: true,
      brand: {
        _id: brand._id.toString(),
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
        logoPublicId: brand.logoPublicId,
        description: brand.description,
        website: brand.website,
        isActive: brand.isActive,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create brand' },
      { status: 500 }
    );
  }
}