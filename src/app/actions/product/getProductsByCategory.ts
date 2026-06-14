'use server';

import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import {  Types } from 'mongoose';
import { revalidatePath } from 'next/cache';

// ==================================================
// GET PRODUCTS BY CATEGORY
// ==================================================

export interface GetProductsByCategoryParams {
  categoryId: string;
  subcategoryId?: string;
  sort?: 'newest' | 'price_low' | 'price_high' | 'popular' | 'featured';
  minPrice?: number;
  maxPrice?: number;
  brandIds?: string[];
  tags?: string[];
  page?: number;
  limit?: number;
  status?: 'active' | 'draft' | 'archived';
  inStock?: boolean;
}

export interface GetProductsByCategoryResult {
  success: boolean;
  products: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters?: {
    brands: Array<{ _id: string; name: string; count: number }>;
    priceRange: { min: number; max: number };
    tags: Array<{ name: string; count: number }>;
  };
  error?: string;
}

export async function getProductsByCategory(
  params: GetProductsByCategoryParams
): Promise<GetProductsByCategoryResult> {
  try {
    await connectDB();

    const {
      categoryId,
      subcategoryId,
      sort = 'newest',
      minPrice,
      maxPrice,
      brandIds = [],
      tags = [],
      page = 1,
      limit = 20,
      status = 'active',
      inStock = true,
    } = params;

    // Build the query
    const query: any = {};

    // Only show active products by default
    if (status) {
      query.status = status;
    }

    // Exclude deleted products
    query.deletedAt = null;

    // Category filter - either main category or subcategory
    if (subcategoryId && Types.ObjectId.isValid(subcategoryId)) {
      // If subcategory is provided, filter by subcategory
      query.subcategoryId = new Types.ObjectId(subcategoryId);
    } else if (categoryId && Types.ObjectId.isValid(categoryId)) {
      // Otherwise filter by main category
      query.categoryId = new Types.ObjectId(categoryId);
    } else {
      return {
        success: false,
        products: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
        error: 'Invalid category ID provided',
      };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.lowestPrice = {};
      if (minPrice !== undefined) query.lowestPrice.$gte = minPrice;
      if (maxPrice !== undefined) query.lowestPrice.$lte = maxPrice;
    }

    // Brand filter
    if (brandIds.length > 0) {
      const validBrandIds = brandIds
        .filter(id => Types.ObjectId.isValid(id))
        .map(id => new Types.ObjectId(id));
      if (validBrandIds.length > 0) {
        query.brandId = { $in: validBrandIds };
      }
    }

    // Tags filter
    if (tags.length > 0) {
      query.tags = { $in: tags };
    }

    // In stock filter
    if (inStock) {
      query.totalInventory = { $gt: 0 };
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

    // Execute the main query with population
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('brandId', 'name slug')
        .populate('categoryId', 'name slug')
        .populate('subcategoryId', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    // Get filter information (brands, price range, tags) for the category
    const filterAggregation = await Product.aggregate([
      {
        $match: {
          ...query,
          // Remove pagination filters from aggregation
          lowestPrice: { $exists: true },
        },
      },
      {
        $facet: {
          // Get unique brands with counts
          brands: [
            {
              $lookup: {
                from: 'brands',
                localField: 'brandId',
                foreignField: '_id',
                as: 'brandInfo',
              },
            },
            { $unwind: { path: '$brandInfo', preserveNullAndEmptyArrays: true } },
            {
              $group: {
                _id: '$brandId',
                name: { $first: '$brandInfo.name' },
                count: { $sum: 1 },
              },
            },
            { $match: { name: { $ne: null } } },
            { $sort: { name: 1 } },
          ],
          // Get price range
          priceRange: [
            {
              $group: {
                _id: null,
                min: { $min: '$lowestPrice' },
                max: { $max: '$lowestPrice' },
              },
            },
          ],
          // Get tags with counts
          tags: [
            { $unwind: { path: '$tags', preserveNullAndEmptyArrays: true } },
            {
              $group: {
                _id: '$tags',
                count: { $sum: 1 },
              },
            },
            { $match: { _id: { $ne: '' } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
          ],
        },
      },
    ]);

    // Format the products
    const formattedProducts = products.map(product => ({
      ...product,
      _id: product._id.toString(),
      brandId: product.brandId || { _id: '', name: 'Unknown Brand' },
      categoryId: product.categoryId?.toString() || '',
      subcategoryId: product.subcategoryId?.toString() || null,
      // Ensure inventory data is properly formatted
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

    // Extract filter data
    const filterData = filterAggregation[0] || {};
    const brands = (filterData.brands || [])
      .filter((b: any) => b.name)
      .map((b: any) => ({
        _id: b._id.toString(),
        name: b.name,
        count: b.count,
      }));

    const priceRange = filterData.priceRange?.[0] || { min: 0, max: 0 };
    const tagsList = (filterData.tags || [])
      .filter((t: any) => t._id)
      .map((t: any) => ({
        name: t._id,
        count: t.count,
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
      filters: {
        brands,
        priceRange: {
          min: priceRange.min || 0,
          max: priceRange.max || 0,
        },
        tags: tagsList,
      },
    };
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return {
      success: false,
      products: [],
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: 0,
        totalPages: 0,
      },
      error: error instanceof Error ? error.message : 'Failed to fetch products',
    };
  }
}