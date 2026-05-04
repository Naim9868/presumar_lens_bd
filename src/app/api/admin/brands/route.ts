// app/api/admin/brand/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { Brand } from '@/models/Brand';

export async function GET() {
  try {
    await dbConnect();
    const brands = await Brand.find({}).sort({ name: 1 }).lean();
    
    return NextResponse.json({
      success: true,
      data: brands
    });
  } catch (error: any) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch brands'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Check if brand with same slug exists
    const existingBrand = await Brand.findOne({ slug: body.slug });
    if (existingBrand) {
      return NextResponse.json({
        success: false,
        error: 'Brand with this slug already exists'
      }, { status: 409 });
    }
    
    const brand = await Brand.create({
      name: body.name,
      slug: body.slug,
      description: body.description || '',
      website: body.website || '',
      logo: body.logo || '',
      isActive: body.isActive !== undefined ? body.isActive : true
    });
    
    return NextResponse.json({
      success: true,
      data: brand,
      message: 'Brand created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating brand:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create brand'
    }, { status: 500 });
  }
}