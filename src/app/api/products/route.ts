// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect as connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { Brand } from '@/models/Brand';
import { CreateProductSchema } from '@/lib/validations/product.validation';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const query = searchParams.get('query') || '';
    const categoryId = searchParams.get('categoryId');
    const brandId = searchParams.get('brandId');
    const status = searchParams.get('status');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const specsParam = searchParams.get('specs');
    const tags = searchParams.get('tags');
    const sortBy = searchParams.get('sortBy') || 'newest';
    
    const filter: any = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      filter.categoryId = categoryId;
    }
    
    if (brandId && mongoose.Types.ObjectId.isValid(brandId)) {
      filter.brandId = brandId;
    }
    
    if (minPrice || maxPrice) {
      filter.lowestPrice = {};
      if (minPrice) filter.lowestPrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.lowestPrice.$lte = parseFloat(maxPrice);
    }
    
    // Text search
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { shortDescription: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ];
    }
    
    // Spec filters
    if (specsParam) {
      try {
        const specs = JSON.parse(specsParam);
        const specFilters = Object.entries(specs).map(([key, value]) => ({
          $elemMatch: { key, value, filterable: true }
        }));
        
        if (specFilters.length > 0) {
          filter.specsFlat = { $all: specFilters };
        }
      } catch (e) {
        console.error('Error parsing specs:', e);
        return NextResponse.json(
          { error: 'Invalid specs format' },
          { status: 400 }
        );
      }
    }
    
    // Tags filter
    if (tags) {
      const tagArray = tags.split(',');
      filter.tags = { $in: tagArray };
    }
    
    // Sorting
    let sort: any = { createdAt: -1 };
    switch (sortBy) {
      case 'price_asc':
        sort = { lowestPrice: 1 };
        break;
      case 'price_desc':
        sort = { lowestPrice: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'name_asc':
        sort = { name: 1 };
        break;
      case 'name_desc':
        sort = { name: -1 };
        break;
    }
    
    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('categoryId', 'name slug')
        .populate('brandId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);
    
    return NextResponse.json({
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// app/api/products/route.ts (update the POST method)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Helper function to validate ObjectId
    const isValidObjectId = (id: any) => {
      if (!id) return false;
      if (typeof id !== 'string') return false;
      return mongoose.Types.ObjectId.isValid(id);
    };
    
    // Validate required IDs
    if (!isValidObjectId(body.brandId)) {
      return NextResponse.json(
        { error: 'Invalid or missing brand ID. Please select a valid brand.' },
        { status: 400 }
      );
    }
    
    if (!isValidObjectId(body.categoryId)) {
      return NextResponse.json(
        { error: 'Invalid or missing category ID. Please select a valid category.' },
        { status: 400 }
      );
    }
    
    // Handle subcategoryId - can be optional
    let cleanBody = { ...body };
    if (body.subcategoryId === '' || body.subcategoryId === null || body.subcategoryId === undefined) {
      delete cleanBody.subcategoryId;
    } else if (!isValidObjectId(body.subcategoryId)) {
      return NextResponse.json(
        { error: 'Invalid subcategory ID format' },
        { status: 400 }
      );
    }
    
    // Verify brand exists
    const brand = await Brand.findById(body.brandId);
    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found. Please select a valid brand.' },
        { status: 404 }
      );
    }
    
    // Verify category exists
    const category = await Category.findById(body.categoryId);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found. Please select a valid category.' },
        { status: 404 }
      );
    }
    
    // Generate variantKey for each variant BEFORE validation
    if (cleanBody.variants && cleanBody.variants.length > 0) {
      cleanBody.variants = cleanBody.variants.map((variant: any, index: number) => {
        // Generate variantKey if not provided
        if (!variant.variantKey || variant.variantKey === '') {
          const attributes = variant.attributes || [];
          // Sort attributes by key for consistent key generation
          const sorted = [...attributes].sort((a: any, b: any) => a.key.localeCompare(b.key));
          const keyString = sorted.map((attr: any) => `${attr.key}:${attr.value}`).join('|');
          variant.variantKey = keyString || `variant-${index}`;
        }
        return variant;
      });
    }
    
    // Validate with Zod schema
    const validated = CreateProductSchema.parse(cleanBody);
    
    // Validate required specs from category template
    const requiredSpecs = category.specificationTemplate?.flatMap((g: any) => 
      g.fields?.filter((f: any) => f.required).map((f: any) => f.key)
    ) || [];
    
    const missingSpecs = requiredSpecs.filter(
      (required: string) => !validated.specsFlat?.some((s: any) => s.key === required && s.value && s.value !== '')
    );
    
    if (missingSpecs.length > 0) {
      return NextResponse.json(
        { error: `Missing required specifications: ${missingSpecs.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Double-check variants have variantKey before saving
    if (validated.variants) {
      validated.variants = validated.variants.map((variant: any, idx: number) => {
        if (!variant.variantKey) {
          const attributes = variant.attributes || [];
          const sorted = [...attributes].sort((a: any, b: any) => a.key.localeCompare(b.key));
          variant.variantKey = sorted.map((attr: any) => `${attr.key}:${attr.value}`).join('|') || `variant-${idx}`;
        }
        return variant;
      });
    }
    
    const product = new Product(validated);
    await product.save();
    
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      const errorMessages = error.errors.map((e: any) => {
        const path = e.path.join('.');
        return `${path}: ${e.message}`;
      }).join(', ');
      
      return NextResponse.json(
        { error: `Validation failed: ${errorMessages}` },
        { status: 400 }
      );
    }
    
    // Handle duplicate slug error
    if (error.code === 11000 && error.keyPattern?.slug) {
      return NextResponse.json(
        { error: 'Product with this slug already exists. Please use a different name or slug.' },
        { status: 400 }
      );
    }
    
    // Handle validation errors from mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message).join(', ');
      return NextResponse.json(
        { error: messages },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}