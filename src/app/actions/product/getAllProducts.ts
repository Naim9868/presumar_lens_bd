// app/actions/product/getProducts.ts
'use server';

import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { Types } from 'mongoose';

export async function getAllProducts(filters: any = {}) {
  try {
    await connectDB();

    const {
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      tags,
      search,
      sort = 'newest',
      page = 1,
      limit = 20,
      status = 'active',
    } = filters;

    // Build query
    const query: any = {};

    // Only show active products
    if (status) {
      query.status = status;
    }

    // Exclude deleted products
    query.deletedAt = null;

    // Category filter
    if (categoryId && Types.ObjectId.isValid(categoryId)) {
      query.categoryId = new Types.ObjectId(categoryId);
    }

    // Brand filter
    if (brandId && Types.ObjectId.isValid(brandId)) {
      query.brandId = new Types.ObjectId(brandId);
    }

    // Price filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.lowestPrice = {};
      if (minPrice !== undefined) query.lowestPrice.$gte = minPrice;
      if (maxPrice !== undefined) query.lowestPrice.$lte = maxPrice;
    }

    // Tags filter
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort options
    let sortOptions: any = {};
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'price_low':
        sortOptions = { lowestPrice: 1 };
        break;
      case 'price_high':
        sortOptions = { lowestPrice: -1 };
        break;
      case 'popular':
        sortOptions = { ratingAverage: -1, ratingCount: -1 };
        break;
      case 'featured':
        sortOptions = { featured: -1, searchBoost: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query WITHOUT population to avoid model registration issues
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    // Format products - keep IDs as strings, no population
    const formattedProducts = products.map(product => ({
      ...product,
      _id: product._id.toString(),
      brandId: product.brandId?.toString() || '',
      categoryId: product.categoryId?.toString() || '',
      subcategoryId: product.subcategoryId?.toString() || null,
      // Ensure inventorySummary exists
      inventorySummary: product.inventorySummary || {
        available: 0,
        reserved: 0,
        incoming: 0,
        lowStockThreshold: 5,
      },
      // Ensure variants have proper inventory
      variants: (product.variants || []).map((variant: any) => ({
        ...variant,
        inventory: variant.inventory || 0,
      })),
      // Ensure lowestPrice exists
      lowestPrice: product.lowestPrice || 0,
      // Ensure totalInventory exists
      totalInventory: product.totalInventory || 0,
      // Convert dates to strings
      createdAt: product.createdAt?.toString() || new Date().toISOString(),
      updatedAt: product.updatedAt?.toString() || new Date().toISOString(),
    }));

    return {
      success: true,
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      success: false,
      products: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
      error: error instanceof Error ? error.message : 'Failed to fetch products',
    };
  }
}

// Function to get a single product with populated data (use a separate function for this)
export async function getProductById(productId: string) {
  try {
    await connectDB();
    
    // Import models dynamically to avoid circular dependencies
    const { Category } = await import('@/models/Category');
    const { Brand } = await import('@/models/Brand');
    
    if (!Types.ObjectId.isValid(productId)) {
      return { success: false, product: null, error: 'Invalid product ID' };
    }
    
    const product = await Product.findById(productId)
      .populate('brandId', 'name slug')
      .populate('categoryId', 'name slug')
      .populate('subcategoryId', 'name slug')
      .lean();
    
    if (!product) {
      return { success: false, product: null, error: 'Product not found' };
    }
    
    const formattedProduct = {
      ...product,
      _id: product._id.toString(),
      brandId: product.brandId || { _id: '', name: 'Unknown Brand' },
      categoryId: product.categoryId || { _id: '', name: 'Unknown Category' },
      subcategoryId: product.subcategoryId || null,
      createdAt: product.createdAt?.toString(),
      updatedAt: product.updatedAt?.toString(),
    };
    
    return { success: true, product: formattedProduct };
  } catch (error) {
    console.error('Error fetching product:', error);
    return { success: false, product: null, error: 'Failed to fetch product' };
  }
}

// Helper functions
export async function getProductsByCategory(categoryId: string, filters: any = {}) {
  return getAllProducts({ ...filters, categoryId });
}

export async function getProductsByBrand(brandId: string, filters: any = {}) {
  return getAllProducts({ ...filters, brandId });
}

export async function getFeaturedProducts(limit: number = 8) {
  return getAllProducts({
    featured: true,
    sort: 'featured',
    limit,
    status: 'active',
  });
}

export async function getRelatedProducts(productId: string, categoryId: string, limit: number = 4) {
  try {
    await connectDB();
    
    const products = await Product.find({
      categoryId: new Types.ObjectId(categoryId),
      _id: { $ne: new Types.ObjectId(productId) },
      status: 'active',
      deletedAt: null,
      totalInventory: { $gt: 0 },
    })
      .sort({ ratingAverage: -1, searchBoost: -1 })
      .limit(limit)
      .lean();
    
    const formattedProducts = products.map(product => ({
      ...product,
      _id: product._id.toString(),
      brandId: product.brandId?.toString() || '',
      categoryId: product.categoryId?.toString() || '',
      subcategoryId: product.subcategoryId?.toString() || null,
      inventorySummary: product.inventorySummary || {
        available: 0,
        reserved: 0,
        incoming: 0,
        lowStockThreshold: 5,
      },
      variants: (product.variants || []).map((variant: any) => ({
        ...variant,
        inventory: variant.inventory || 0,
      })),
    }));
    
    return { success: true, products: formattedProducts };
  } catch (error) {
    console.error('Error fetching related products:', error);
    return { success: false, products: [], error: 'Failed to fetch related products' };
  }
}