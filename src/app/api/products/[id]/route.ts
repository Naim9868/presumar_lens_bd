// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { updateProduct } from '@/app/actions/product/updateProduct';
import { deleteProduct } from '@/app/actions/product/deleteProduct';
import { Types } from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const product = await Product.findById(id)
      .populate('brandId', 'name slug logo logoPublicId')
      .populate('categoryId', 'name slug image imagePublicId')
      .populate('subcategoryId', 'name slug')
      .lean();

  
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Transform the response
    const transformedProduct = {
      ...product,
      _id: product._id.toString(),
      brandId: product.brandId?._id?.toString() || product.brandId,
      brand: product.brandId,
      categoryId: product.categoryId?._id?.toString() || product.categoryId,
      category: product.categoryId,
      subcategoryId: product.subcategoryId?._id?.toString() || product.subcategoryId,
      subcategory: product.subcategoryId,
      // Ensure variants have proper structure
      variants: product.variants?.map((variant: any) => ({
        ...variant,
        variantKey: variant.variantKey || 'default',
        sku: variant.sku || '',
        attributes: variant.attributes || [],
      })) || [],
      // Ensure arrays exist
      specificationGroups: product.specificationGroups || [],
      imageGroups: product.imageGroups || [],
      videos: product.videos || [],
      tags: product.tags || [],
      badges: product.badges || [],
      relatedProducts: product.relatedProducts || [],
      seo: product.seo || {},
    };

   
    return NextResponse.json({
      success: true,
      product: transformedProduct,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();

    // Clean up empty strings for ObjectId fields
    if (body.subcategoryId === '' || body.subcategoryId === null || body.subcategoryId === undefined) {
      delete body.subcategoryId;
    }

    // Ensure arrays exist
    if (!body.specificationGroups) body.specificationGroups = [];
    if (!body.imageGroups) body.imageGroups = [];
    if (!body.videos) body.videos = [];
    if (!body.tags) body.tags = [];
    if (!body.badges) body.badges = [];
    if (!body.relatedProducts) body.relatedProducts = [];


    // IMPORTANT: Don't delete pricing fields for non-variant products
    // They need to be passed to updateProduct to update the variant
    // Only remove them if we're explicitly told to (they'll be ignored by the model)

    // console.log('Updating product with data:', JSON.stringify({
    //   hasVariants: body.hasVariants,
    //   price: body.price,
    //   compareAtPrice: body.compareAtPrice,
    //   inventory: body.inventory,
    //   variantsCount: body.variants?.length
    // }, null, 2));
      // Log to debug
    // console.log('Related products being saved:', body.relatedProducts);

    const result = await updateProduct({ id: (await params).id, ...body });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update product' },
      { status: 500 }
    );
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await deleteProduct((await params).id);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}