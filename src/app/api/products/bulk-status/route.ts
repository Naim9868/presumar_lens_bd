// src/app/api/products/bulk-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { bulkUpdateStatus } from '@/app/actions/product/bulkUpdateStatus';
import { ProductStatus } from '@/types/product';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds, status } = body;
    
    if (!productIds || !Array.isArray(productIds) || !status) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    if (!['draft', 'active', 'archived'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    const result = await bulkUpdateStatus(productIds, status as ProductStatus);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product statuses' },
      { status: 500 }
    );
  }
}