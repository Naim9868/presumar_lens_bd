// src/app/api/products/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const excludeId = searchParams.get('exclude');
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        success: true, 
        products: [],
        total: 0,
        page: 1,
        totalPages: 0
      });
    }
    
    const skip = (page - 1) * limit;
    
    const searchQuery: any = {
      status: 'active',
      deletedAt: null,
    };
    
    if (excludeId) {
      searchQuery._id = { $ne: excludeId };
    }
    
    // Search in name, searchKeywords, and tags
    searchQuery.$or = [
      { name: { $regex: query, $options: 'i' } },
      { searchKeywords: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } },
    ];
    
    const [products, total] = await Promise.all([
      Product.find(searchQuery)
        .select('_id name slug thumbnail lowestPrice highestPrice')
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(searchQuery)
    ]);
    
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
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search products' },
      { status: 500 }
    );
  }
}