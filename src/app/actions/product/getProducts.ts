// src/actions/product/getProducts.ts
'use server';

import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { IProductFilters, IProductListResponse, ProductStatus } from '@/types/product';
import { Types } from 'mongoose';

export async function getProducts(
  filters: IProductFilters
): Promise<IProductListResponse> {
  await connectDB();

  const {
    page = 1,
    limit = 20,
    query,
    categoryId,
    brandId,
    minPrice,
    maxPrice,
    tags,
    status,
    specs = {},
  } = filters;

  const skip = (page - 1) * limit;
  const matchStage: any = {
    deletedAt: null,
    status: { $ne: 'archived' },
  };

  // Full-text search on searchKeywords
  if (query && query.trim()) {
    matchStage.$text = { $search: query.trim() };
    matchStage.searchKeywords = { $regex: query.trim(), $options: 'i' };
  }

  // Category filter
  if (categoryId && Types.ObjectId.isValid(categoryId)) {
    matchStage.categoryId = new Types.ObjectId(categoryId);
  }

  // Brand filter
  if (brandId && Types.ObjectId.isValid(brandId)) {
    matchStage.brandId = new Types.ObjectId(brandId);
  }

  // Status filter
  if (status) {
    matchStage.status = status;
  }

  // Tags filter
  if (tags && tags.length > 0) {
    matchStage.tags = { $in: tags };
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    matchStage.lowestPrice = {};
    if (minPrice !== undefined) matchStage.lowestPrice.$gte = minPrice;
    if (maxPrice !== undefined) matchStage.lowestPrice.$lte = maxPrice;
  }

  // Build aggregation pipeline
  const pipeline: any[] = [{ $match: matchStage }];

  // Specs filtering
  if (Object.keys(specs).length > 0) {
    const specConditions = Object.entries(specs).map(([key, value]) => ({
      specsFlat: {
        $elemMatch: {
          key: key,
          value: value,
        },
      },
    }));
    
    if (specConditions.length > 0) {
      pipeline.push({ $match: { $and: specConditions } });
    }
  }


  // Add sorting
  let sortOption: any = { createdAt: -1 }; // default newest
  
  switch (filters.sort) {
    case 'price_low':
      sortOption = { lowestPrice: 1 };
      break;
    case 'price_high':
      sortOption = { lowestPrice: -1 };
      break;
    case 'popular':
      sortOption = { ratingCount: -1 };
      break;
    case 'rating':
      sortOption = { ratingAverage: -1 };
      break;
    case 'newest':
    default:
      sortOption = { createdAt: -1 };
      break;
  }

  // Facet for pagination and data
  pipeline.push(
    { $sort: sortOption },
    {
      $facet: {
      metadata: [{ $count: 'total' }],
      products: [
        { $skip: skip },
        { $limit: limit },
        {
          $sort: {
            featured: -1,
            createdAt: -1,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            slug: 1,
            thumbnail: 1,
            lowestPrice: 1,
            highestPrice: 1,
            status: 1,
            totalInventory: 1,
            tags: 1,
            featured: 1,
            createdAt: 1,
            brandId: 1,
            categoryId: 1,
          },
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brandId',
            foreignField: '_id',
            as: 'brand',
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        {
          $addFields: {
            brand: { $arrayElemAt: ['$brand', 0] },
            category: { $arrayElemAt: ['$category', 0] },
          },
        },
        {
          $project: {
            brandId: 0,
            categoryId: 0,
          },
        },
      ],
    },
  });

  const result = await Product.aggregate(pipeline);
  const { products, metadata } = result[0];
  const total = metadata[0]?.total || 0;

  return {
    products: products.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      brand: p.brand ? { ...p.brand, _id: p.brand._id.toString() } : null,
      category: p.category ? { ...p.category, _id: p.category._id.toString() } : null,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}