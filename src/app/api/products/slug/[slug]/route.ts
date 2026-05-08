import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();

    const { slug } = await params;

    const product = await Product.findOne({
      slug,
      status: 'active',
      deletedAt: null
    }).lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Optional populate
    let category = null;
    if (product.categoryId) {
      category = await Category.findById(product.categoryId)
        .select('name slug')
        .lean();
    }

    const variants = product.variants || [];

    const defaultVariant =
      variants.find((v: any) => v.isDefault) || variants[0] || null;

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        categoryId: category,
        specifications: product.specsFlat,
        variants,
        minPrice: product.lowestPrice,
        maxPrice: product.highestPrice,
        defaultVariant
      }
    });

  } catch (error: any) {
    console.error('Error fetching product:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch product'
      },
      { status: 500 }
    );
  }
}