import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { Product }from '@/models/Product';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const variantKey = searchParams.get('variantKey');

    // Find the product
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // If no variant key provided, check overall availability
    if (!variantKey) {
      const available = product.totalInventory > 0;
      return NextResponse.json({
        available,
        stock: product.totalInventory || 0,
      });
    }

    // Find the specific variant
    const variant = product.variants?.find(
      (v: any) => v.variantKey === variantKey
    );

    if (!variant) {
      return NextResponse.json({
        available: false,
        stock: 0,
        message: 'Variant not found',
      });
    }

    // Calculate available stock (inventory - reserved)
    const availableStock = (variant.inventory || 0) - (variant.reserved || 0);

    return NextResponse.json({
      available: availableStock > 0,
      stock: availableStock,
      inventory: variant.inventory,
      reserved: variant.reserved || 0,
    });
  } catch (error: any) {
    console.error('Availability check error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to check availability',
        available: false,
        stock: 0
      },
      { status: 500 }
    );
  }
}