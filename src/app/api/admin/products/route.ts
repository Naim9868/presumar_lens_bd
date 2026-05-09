import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import { dbConnect } from '@/lib/dbConnect';
import { Product, ProductVariant, ProductSpecification } from '@/models/Product';


// Ensure models are registered
import '@/models/Brand';
import '@/models/Category';

/* ================================
   🔧 UTIL: Safe ObjectId parser
================================ */
function cleanObjectId(value: unknown): Types.ObjectId | null {
  if (!value || typeof value !== 'string') return null;
  if (!Types.ObjectId.isValid(value)) return null;
  return new Types.ObjectId(value);
}

/* ================================
   🚀 CREATE PRODUCT (POST)
================================ */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    /* ---------- Clean Input ---------- */
    const cleanData = {
      name: body.name?.trim(),
      slug: body.slug?.trim().toLowerCase(),
      shortDescription: body.shortDescription?.trim(),
      description: body.description?.trim(),
      brandId: cleanObjectId(body.brandId),
      categoryId: cleanObjectId(body.categoryId),
      images: Array.isArray(body.images) ? body.images : [],
      thumbnail:
        body.thumbnail ||
        (Array.isArray(body.images) ? body.images[0] : '') ||
        '',
      tags: Array.isArray(body.tags)
        ? body.tags
        : typeof body.tags === 'string'
        ? body.tags.split(',').map((t: string) => t.trim())
        : [],
      status: body.status || 'draft',
    };

    const subcategoryId = cleanObjectId(body.subcategoryId);
    if (subcategoryId) {
      (cleanData as any).subcategoryId = subcategoryId;
    }

    /* ---------- Validation ---------- */
    if (!cleanData.name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    if (!cleanData.slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    if (!cleanData.brandId) {
      return NextResponse.json({ error: 'Brand is required' }, { status: 400 });
    }

    if (!cleanData.categoryId) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    /* ---------- Duplicate Check ---------- */
    const exists = await Product.findOne({ slug: cleanData.slug });
    if (exists) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 409 }
      );
    }

    /* ---------- Create Product ---------- */
    const product = await Product.create(cleanData);

    /* ---------- Create Variants ---------- */
    if (Array.isArray(body.variants) && body.variants.length > 0) {
      const variants = body.variants.map((v: any) => ({
        productId: product._id,
        attributes: v.attributes || [],
        price: Number(v.price) || 0,
        stock: Number(v.stock) || 0,
        sku: v.sku || '',
      }));

      await ProductVariant.insertMany(variants);
    }

    /* ---------- Create Specifications ---------- */
    if (body.specifications && typeof body.specifications === 'object') {
      await ProductSpecification.create({
        ...body.specifications,
        productId: product._id,
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: product,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST ERROR:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate field value' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

/* ================================
   📦 GET PRODUCTS
================================ */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const params = request.nextUrl.searchParams;

    const page = Number(params.get('page') || 1);
    const limit = Number(params.get('limit') || 10);
    const status = params.get('status');

    const query: Record<string, any> = {};
    if (status && status !== 'all') query.status = status;

    const skip = (page - 1) * limit;

    /* ---------- Fetch Products ---------- */
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);


    /* ---------- Batch Fetch Relations ---------- */
    const productIds = products.map((p) => p._id);

    const variants = await ProductVariant.find({
      productId: { $in: productIds },
    }).lean();


    const variantsMap = new Map<string, any[]>();

    variants.forEach((v) => {
      const key = v.productId.toString();
      if (!variantsMap.has(key)) variantsMap.set(key, []);
      variantsMap.get(key)?.push(v);
    });

    /* ---------- Attach Computed Fields ---------- */
    const finalProducts = products.map((product) => {
      const productVariants = variantsMap.get(product._id.toString()) || [];

      const prices = productVariants.map((v) => v.price);

      return {
        ...product,
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0,
        variantCount: productVariants.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        products: finalProducts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('GET ERROR:', error);

    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}