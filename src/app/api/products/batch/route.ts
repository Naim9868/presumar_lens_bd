// src/app/api/products/batch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { Types } from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const ids = searchParams.get('ids');
    
    if (!ids) {
      return NextResponse.json(
        { success: false, error: 'No IDs provided' },
        { status: 400 }
      );
    }
    
    const productIds = ids.split(',').filter(id => Types.ObjectId.isValid(id));
    const objectIds = productIds.map(id => new Types.ObjectId(id));
    
    const products = await Product.find({ _id: { $in: objectIds } })
      .select('_id name slug thumbnail lowestPrice highestPrice')
      .lean();
    
    return NextResponse.json({
      success: true,
      products: products.map(p => ({
        _id: p._id.toString(),
        name: p.name,
        slug: p.slug,
        thumbnail: p.thumbnail,
        lowestPrice: p.lowestPrice,
        highestPrice: p.highestPrice,
      })),
    });
  } catch (error) {
    console.error('Batch fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}