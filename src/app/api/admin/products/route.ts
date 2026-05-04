// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
// import { Product } from '@/models/Product';
// import { ProductVariant } from '@/models/ProductVariant';
// import { ProductSpecification } from '@/models/ProductSpecification';
// import mongoose from 'mongoose';

// Import models to ensure they are registered
import '@/models/Brand';
import '@/models/Category';

// Helper function to clean ObjectId fields
function cleanObjectId(value: any): mongoose.Types.ObjectId | null {
  if (!value || value === '' || value === 'null' || value === 'undefined') {
    return null;
  }
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Clean the data - remove subcategoryId if it's empty
    const cleanData = {
      name: body.name?.trim(),
      slug: body.slug?.trim().toLowerCase(),
      shortDescription: body.shortDescription?.trim(),
      description: body.description?.trim(),
      brandId: cleanObjectId(body.brandId),
      categoryId: cleanObjectId(body.categoryId),
      images: body.images || [],
      thumbnail: body.thumbnail || (body.images && body.images[0]) || '',
      tags: Array.isArray(body.tags) ? body.tags : (body.tags ? body.tags.split(',').map((t: string) => t.trim()) : []),
      status: body.status || 'draft',
    };
    
    // Only add subcategoryId if it's a valid ObjectId
    const subcategoryId = cleanObjectId(body.subcategoryId);
    if (subcategoryId) {
      (cleanData as any).subcategoryId = subcategoryId;
    }
    
    // Validate required fields
    if (!cleanData.name) {
      return NextResponse.json({
        success: false,
        error: 'Product name is required'
      }, { status: 400 });
    }
    
    if (!cleanData.slug) {
      return NextResponse.json({
        success: false,
        error: 'Product slug is required'
      }, { status: 400 });
    }
    
    if (!cleanData.brandId) {
      return NextResponse.json({
        success: false,
        error: 'Brand is required'
      }, { status: 400 });
    }
    
    if (!cleanData.categoryId) {
      return NextResponse.json({
        success: false,
        error: 'Category is required'
      }, { status: 400 });
    }
    
    // Check for duplicate slug
    const existingProduct = await Product.findOne({ slug: cleanData.slug });
    if (existingProduct) {
      return NextResponse.json({
        success: false,
        error: 'Product with this slug already exists'
      }, { status: 409 });
    }
    
    // Create product
    const product = await Product.create(cleanData);
    
    // Create variants if provided
    if (body.variants && body.variants.length > 0) {
      const variants = body.variants.map((variant: any) => ({
        ...variant,
        productId: product._id,
        price: variant.price || 0,
        stock: variant.stock || 0,
      }));
      await ProductVariant.create(variants);
    }
    
    // Create specifications if provided
    if (body.specifications && Object.keys(body.specifications).length > 0) {
      await ProductSpecification.create({
        ...body.specifications,
        productId: product._id
      });
    }
    
    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({
        success: false,
        error: errors.join(', ')
      }, { status: 400 });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json({
        success: false,
        error: `Duplicate ${field} value. Please use a unique ${field}.`
      }, { status: 409 });
    }
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create product'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    
    const query: any = {};
    if (status && status !== 'all') query.status = status;
    
    const skip = (page - 1) * limit;
    
    // Get products without population first to avoid model errors
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Product.countDocuments(query);
    
    // Manually fetch brand and category names if needed
    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        let brand = null;
        let category = null;
        let subcategory = null;
        
        // Fetch brand if brandId exists
        if (product.brandId) {
          try {
            const Brand = mongoose.model('Brand');
            brand = await Brand.findById(product.brandId).select('name slug').lean();
          } catch (err) {
            console.error('Error fetching brand:', err);
          }
        }
        
        // Fetch category if categoryId exists
        if (product.categoryId) {
          try {
            const Category = mongoose.model('Category');
            category = await Category.findById(product.categoryId).select('name slug').lean();
          } catch (err) {
            console.error('Error fetching category:', err);
          }
        }
        
        // Fetch subcategory if subcategoryId exists
        if (product.subcategoryId) {
          try {
            const Category = mongoose.model('Category');
            subcategory = await Category.findById(product.subcategoryId).select('name slug').lean();
          } catch (err) {
            console.error('Error fetching subcategory:', err);
          }
        }
        
        // Get variants for this product
        const variants = await ProductVariant.find({ productId: product._id });
        const prices = variants.map(v => v.price);
        
        return {
          ...product,
          minPrice: prices.length > 0 ? Math.min(...prices) : 0,
          maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
          variantCount: variants.length,
          brand: brand,
          category: category,
          subcategory: subcategory
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      data: {
        products: productsWithDetails,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch products'
    }, { status: 500 });
  }
}