import { NextRequest, NextResponse } from 'next/server';
import { dbConnect as connectDB } from '@/lib/dbConnect';
import  { Product } from '@/models/Product';
import { generateVariantKey } from '@/utils/variant';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const attributesParam = searchParams.get('attributes');
    
    if (!attributesParam) {
      return NextResponse.json(
        { error: 'Attributes parameter required' },
        { status: 400 }
      );
    }
    
    const attributes = JSON.parse(attributesParam);
    const variantKey = generateVariantKey(
      Object.entries(attributes).map(([key, value]) => ({ key, value: String(value) }))
    );
    
    const product = await Product.findOne(
      { _id: params.id, 'variants.variantKey': variantKey },
      { 'variants.$': 1 }
    ).lean();
    
    const variant = product?.variants?.[0] || null;
    
    return NextResponse.json({ variant });
  } catch (error: any) {
    console.error('Error finding variant:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { variantSku, inventory, price } = body;
    
    const updateFields: any = {};
    if (inventory !== undefined) updateFields['variants.$.inventory'] = inventory;
    if (price !== undefined) updateFields['variants.$.price'] = price;
    
    const product = await Product.findOneAndUpdate(
      { _id: params.id, 'variants.sku': variantSku },
      { $set: updateFields },
      { new: true }
    );
    
    if (!product) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      );
    }
    
    // Recalculate aggregates
    const prices = product.variants.map((v: any) => v.price);
    product.lowestPrice = Math.min(...prices);
    product.highestPrice = Math.max(...prices);
    product.totalInventory = product.variants.reduce((sum: number, v: any) => sum + v.inventory, 0);
    await product.save();
    
    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Error updating variant:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}