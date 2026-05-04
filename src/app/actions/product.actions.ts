'use server';

import { dbConnect as connectDB } from '@/lib/dbConnect';
import "@/models";
import { Product } from '@/models/Product';
import { Brand } from '@/models/Brand';
import {Category}  from '@/models/Category';
import { FilterOptions, TransformedProduct } from '@/types';

// Helper function to serialize MongoDB documents
function serializeDocument(doc: any): any {
  if (!doc) return null;
  
  // Handle arrays
  if (Array.isArray(doc)) {
    return doc.map(item => serializeDocument(item));
  }
  
  // Handle objects
  if (typeof doc === 'object') {
    const serialized: any = {};
    for (const key in doc) {
      const value = doc[key];
      
      // Convert ObjectId to string
      if (value && typeof value === 'object' && value._bsontype === 'ObjectId') {
        serialized[key] = value.toString();
      }
      // Convert Date to ISO string
      else if (value instanceof Date) {
        serialized[key] = value.toISOString();
      }
      // Recursively serialize nested objects
      else if (value && typeof value === 'object') {
        serialized[key] = serializeDocument(value);
      }
      else {
        serialized[key] = value;
      }
    }
    return serialized;
  }
  
  return doc;
}

// Get all products with filters
export async function getAllProducts(filters?: FilterOptions) {
  try {
    await connectDB();
    
    const query: any = { 
      status: 'active',
      deletedAt: null 
    };
    
    // Apply filters
    if (filters) {
      if (filters.minPrice || filters.maxPrice) {
        query.lowestPrice = {};
        if (filters.minPrice) query.lowestPrice.$gte = filters.minPrice;
        if (filters.maxPrice) query.lowestPrice.$lte = filters.maxPrice;
      }
      
      if (filters.brands && filters.brands.length > 0) {
        query.brandId = { $in: filters.brands };
      }
      
      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }
      
      if (filters.inStock) {
        query.totalInventory = { $gt: 0 };
      }
    }
    
    let productsQuery = Product.find(query)
      .select('_id name slug thumbnail brandId categoryId lowestPrice highestPrice status tags variants images createdAt')
      .populate('brandId', 'name slug')
      .populate('categoryId', 'name slug')
      .lean();
    
    // Apply sorting
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          productsQuery = productsQuery.sort({ lowestPrice: 1 });
          break;
        case 'price_desc':
          productsQuery = productsQuery.sort({ lowestPrice: -1 });
          break;
        case 'newest':
          productsQuery = productsQuery.sort({ createdAt: -1 });
          break;
        case 'rating_desc':
          productsQuery = productsQuery.sort({ rating: -1 });
          break;
        default:
          productsQuery = productsQuery.sort({ createdAt: -1 });
      }
    } else {
      productsQuery = productsQuery.sort({ createdAt: -1 });
    }
    
    const products = await productsQuery;
    
    // Serialize and transform products
    const transformedProducts = products.map((product: any) => {
      const serializedProduct = serializeDocument(product);
      return transformProduct(serializedProduct);
    });
    
    return { success: true, products: transformedProducts };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { success: false, products: [] };
  }
}

// Get single product by slug
export async function getProductBySlug(slug: string) {
  try {
    await connectDB();
    
    const product = await Product.findOne({ 
      slug, 
      status: 'active',
      deletedAt: null 
    })
      .populate('brandId', 'name slug description')
      .populate('categoryId', 'name slug')
      .populate('subcategoryId', 'name slug')
      .lean();
    
    if (!product) {
      return { success: false, product: null };
    }
    
    const serializedProduct = serializeDocument(product);
    const transformedProduct = transformProduct(serializedProduct);
    
    return { success: true, product: transformedProduct };
  } catch (error) {
    console.error('Error fetching product:', error);
    return { success: false, product: null };
  }
}

// Get products by category
export async function getProductsByCategory(categoryId: string, limit?: number) {
  try {
    await connectDB();
    
    const query = { 
      categoryId,
      status: 'active',
      deletedAt: null 
    };
    
    let productsQuery = Product.find(query)
      .select('_id name slug thumbnail brandId lowestPrice highestPrice status variants images')
      .populate('brandId', 'name slug')
      .sort({ createdAt: -1 });
    
    if (limit) {
      productsQuery = productsQuery.limit(limit);
    }
    
    const products = await productsQuery.lean();
    const transformedProducts = products.map((product: any) => {
      const serializedProduct = serializeDocument(product);
      return transformProduct(serializedProduct);
    });
    
    return { success: true, products: transformedProducts };
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return { success: false, products: [] };
  }
}

// Get all brands for filtering
export async function getAllBrands() {
  try {
    await connectDB();
    const brands = await Brand.find({ isActive: true })
      .select('_id name slug')
      .lean();
    
    const serializedBrands = brands.map(brand => ({
      _id: brand._id.toString(),
      name: brand.name,
      slug: brand.slug
    }));
    
    return { success: true, brands: serializedBrands };
  } catch (error) {
    console.error('Error fetching brands:', error);
    return { success: false, brands: [] };
  }
}

// Transform product helper function
function transformProduct(product: any): TransformedProduct {
  const defaultVariant = product.variants?.find((v: any) => v.isDefault) || product.variants?.[0];
  const totalStock = product.variants?.reduce((sum: number, v: any) => sum + (v.inventory || 0), 0) || 0;
  
  const hasDiscount = defaultVariant?.compareAtPrice && defaultVariant.compareAtPrice > defaultVariant?.price;
  const originalPrice = hasDiscount ? defaultVariant?.compareAtPrice : product.lowestPrice || defaultVariant?.price || 0;
  const discountPrice = defaultVariant?.price || product.lowestPrice || 0;
  
  // Calculate rating (from reviews if available, otherwise default)
  const rating = product.averageRating || 4.5;
  const reviewCount = product.reviewCount || Math.floor(Math.random() * 200) + 10;
  const soldCount = product.soldCount || Math.floor(Math.random() * 500) + 50;
  
  const badges: any = {};
  
  if (soldCount > 300) badges.isBestSeller = true;
  if (discountPrice > 50000) badges.isPremium = true;
  if (totalStock <= 5 && totalStock > 0) badges.isLimitedStock = true;
  
  const createdAt = product.createdAt ? new Date(product.createdAt) : new Date();
  const daysOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysOld <= 30) badges.isNewArrival = true;
  
  return {
    _id: product._id?.toString() || product.id,
    id: product._id?.toString() || product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brandId?.name || 'Unknown',
    brandId: product.brandId ? {
      _id: product.brandId._id?.toString(),
      name: product.brandId.name,
      slug: product.brandId.slug
    } : null,
    categoryId: product.categoryId ? {
      _id: product.categoryId._id?.toString(),
      name: product.categoryId.name,
      slug: product.categoryId.slug
    } : null,
    rating,
    reviewCount,
    soldCount,
    originalPrice,
    discountPrice,
    imageUrl: product.thumbnail || product.images?.[0] || '/placeholder-image.jpg',
    thumbnail: product.thumbnail || product.images?.[0] || '/placeholder-image.jpg',
    images: product.images || [],
    isAvailable: product.status === 'active' && totalStock > 0,
    stock: totalStock,
    freeShipping: discountPrice > 5000,
    emiAvailable: discountPrice > 10000,
    warranty: discountPrice > 30000 ? '2 Years' : '1 Year',
    badges,
    variants: product.variants?.map((v: any) => ({
      ...v,
      _id: v._id?.toString()
    })) || [],
    specs: product.specsFlat || [],
    description: product.description,
    shortDescription: product.shortDescription,
    tags: product.tags || [],
    status: product.status,
    fullProductData: product,
  };
}