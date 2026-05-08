// app/api/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/dbConnect';
import { Product } from '@/models/Product';

/* ===============================
   TYPES
=============================== */
type Variant = {
  price?: number;
  inventory?: number;
};

/* ===============================
   GET PRODUCT
=============================== */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const product = await Product.findById(id)
      .populate('categoryId', 'name slug specificationTemplate')
      .populate('brandId', 'name')
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    /* ===============================
       CALCULATIONS
    =============================== */
    let totalInventory = 0;
    let lowestPrice = 0;
    let highestPrice = 0;

    if (product.variants && product.variants.length > 0) {
      const variants = product.variants as Variant[];

      totalInventory = variants.reduce(
        (sum: number, variant) => sum + (variant.inventory ?? 0),
        0
      );

      const prices = variants.map(v => v.price ?? 0);

      lowestPrice = Math.min(...prices);
      highestPrice = Math.max(...prices);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        totalInventory,
        lowestPrice,
        highestPrice,
      },
    });

  } catch (error: any) {
    console.error('GET product error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/* ===============================
   UPDATE PRODUCT
=============================== */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // ✅ Clean subcategory
    const cleanBody = { ...body };
    if (
      cleanBody.subcategoryId === '' ||
      cleanBody.subcategoryId === null ||
      cleanBody.subcategoryId === undefined
    ) {
      delete cleanBody.subcategoryId;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: cleanBody },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });

  } catch (error: any) {
    console.error('PUT product error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 11000 && error.keyPattern?.slug) {
      return NextResponse.json(
        { success: false, error: 'Product slug already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/* ===============================
   DELETE PRODUCT
=============================== */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });

  } catch (error: any) {
    console.error('DELETE product error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}