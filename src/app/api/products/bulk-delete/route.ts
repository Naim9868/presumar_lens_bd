// src/app/api/products/bulk-delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { bulkDeleteProducts } from '@/app/actions/product/bulkDeleteProducts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds } = body;
    
    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const result = await bulkDeleteProducts(productIds);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete products' },
      { status: 500 }
    );
  }
}