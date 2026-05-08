import { NextRequest, NextResponse } from 'next/server';
import { dbConnect as connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { generateVariantKey } from '@/utils/variant';

// ================= GET =================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const attributesParam = searchParams.get('attributes');

    if (!attributesParam) {
      return NextResponse.json(
        { success: false, error: 'Attributes parameter required' },
        { status: 400 }
      );
    }

    let attributes: Record<string, any>;
    try {
      attributes = JSON.parse(attributesParam);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid attributes JSON' },
        { status: 400 }
      );
    }

    const variantKey = generateVariantKey(
      Object.entries(attributes).map(([key, value]) => ({
        key,
        value: String(value)
      }))
    );

    const product = await Product.findOne(
      { _id: id, 'variants.variantKey': variantKey },
      { 'variants.$': 1 }
    ).lean();

    const variant = product?.variants?.[0] || null;

    return NextResponse.json({
      success: true,
      data: variant
    });

  } catch (error: any) {
    console.error('Error finding variant:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}


// ================= PUT =================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const body = await request.json();
    const { variantSku, inventory, price } = body;

    if (!variantSku) {
      return NextResponse.json(
        { success: false, error: 'variantSku is required' },
        { status: 400 }
      );
    }

    const updateFields: any = {};

    if (inventory !== undefined) {
      updateFields['variants.$.inventory'] = inventory;
    }

    if (price !== undefined) {
      updateFields['variants.$.price'] = price;
    }

    // ✅ Update specific variant
    const product = await Product.findOneAndUpdate(
      { _id: id, 'variants.sku': variantSku },
      { $set: updateFields },
      { new: true }
    );

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      );
    }

    // ✅ Recalculate aggregates safely
    const prices = product.variants.map((v: any) => v.price || 0);

    product.lowestPrice = prices.length ? Math.min(...prices) : 0;
    product.highestPrice = prices.length ? Math.max(...prices) : 0;

    product.totalInventory = product.variants.reduce(
      (sum: number, v: any) => sum + (v.inventory || 0),
      0
    );

    await product.save();

    return NextResponse.json({
      success: true,
      data: product
    });

  } catch (error: any) {
    console.error('Error updating variant:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}