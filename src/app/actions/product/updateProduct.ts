// src/actions/product/updateProduct.ts
'use server';

import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { Types } from 'mongoose';
import { revalidatePath } from 'next/cache';
import { generateSKU } from '@/lib/utils';

export interface UpdateProductData {
  id: string;
  name?: string;
  description?: string;
  shortDescription?: string;
  brandId?: string;
  categoryId?: string;
  subcategoryId?: string | null;
  specificationGroups?: any[];
  variants?: any[];
  imageGroups?: any[];
  thumbnail?: string;
  thumbnailPublicId?: string;
  videos?: any[];
  tags?: string[];
  badges?: string[];
  featured?: boolean;
  relatedProducts?: string[];
  searchBoost?: number;
  seo?: any;
  status?: 'draft' | 'active' | 'archived';
  hasVariants?: boolean;
  price?: number;
  compareAtPrice?: number;
  inventory?: number;
}

export async function updateProduct(data: UpdateProductData) {
  try {
    await connectDB();

    const { id, ...updateData } = data;

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, error: 'Invalid product ID' };
    }

    const product = await Product.findById(id);

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    // Handle subcategoryId - convert empty string to null
    let subcategoryId = null;
    if (updateData.subcategoryId && Types.ObjectId.isValid(updateData.subcategoryId)) {
      subcategoryId = new Types.ObjectId(updateData.subcategoryId);
    } else if (updateData.subcategoryId === '' || updateData.subcategoryId === null) {
      subcategoryId = null;
    }

    // Handle brandId
    let brandId = product.brandId;
    if (updateData.brandId && Types.ObjectId.isValid(updateData.brandId)) {
      brandId = new Types.ObjectId(updateData.brandId);
    }

    // Handle categoryId
    let categoryId = product.categoryId;
    if (updateData.categoryId && Types.ObjectId.isValid(updateData.categoryId)) {
      categoryId = new Types.ObjectId(updateData.categoryId);
    }

    // Handle variants - IMPORTANT: Update existing variant for non-variant products
    let variants = [...(product.variants || [])];

    if (updateData.variants !== undefined) {
      // If variants are provided in the update, use them
      variants = [...updateData.variants];
    } else if (updateData.hasVariants === false) {
      // For non-variant products, update the first variant with pricing data
      if (variants.length > 0) {
        // Update existing variant with new pricing
        variants[0] = {
          ...variants[0],
          price: updateData.price !== undefined ? updateData.price : variants[0].price,
          compareAtPrice: updateData.compareAtPrice !== undefined ? updateData.compareAtPrice : variants[0].compareAtPrice,
          inventory: updateData.inventory !== undefined ? updateData.inventory : variants[0].inventory,
        };
      } else {
        // Create a new default variant if none exists
        variants = [{
          sku: generateSKU(),
          variantKey: 'default',
          attributes: [],
          price: updateData.price || 0,
          compareAtPrice: updateData.compareAtPrice || 0,
          inventory: updateData.inventory || 0,
          reserved: 0,
          images: [],
          isDefault: true,
          status: 'in_stock' as const,
        }];
      }
    }

    // Ensure all variants have required fields
    variants = variants.map((variant: any, index: number) => ({
      ...variant,
      sku: variant.sku || generateSKU(),
      variantKey: variant.variantKey || `variant_${index}`,
      attributes: variant.attributes || [],
      price: variant.price || 0,
      compareAtPrice: variant.compareAtPrice || 0,
      inventory: variant.inventory || 0,
      reserved: variant.reserved || 0,
      images: variant.images || [],
      isDefault: variant.isDefault || index === 0,
      status: variant.status || 'in_stock',
    }));

    // Prepare update object
    const updateFields: any = {};

    // Basic fields
    if (updateData.name !== undefined) updateFields.name = updateData.name;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.shortDescription !== undefined) updateFields.shortDescription = updateData.shortDescription;
    if (updateData.status !== undefined) updateFields.status = updateData.status;
    if (updateData.featured !== undefined) updateFields.featured = updateData.featured;
    if (updateData.searchBoost !== undefined) updateFields.searchBoost = updateData.searchBoost;
    if (updateData.thumbnail !== undefined) updateFields.thumbnail = updateData.thumbnail;
    if (updateData.thumbnailPublicId !== undefined) updateFields.thumbnailPublicId = updateData.thumbnailPublicId;

    // ObjectId fields
    updateFields.brandId = brandId;
    updateFields.categoryId = categoryId;
    updateFields.subcategoryId = subcategoryId;

    // Arrays
    if (updateData.specificationGroups !== undefined) updateFields.specificationGroups = updateData.specificationGroups;
    if (variants !== undefined) updateFields.variants = variants;
    if (updateData.imageGroups !== undefined) updateFields.imageGroups = updateData.imageGroups;
    if (updateData.videos !== undefined) updateFields.videos = updateData.videos;
    if (updateData.tags !== undefined) updateFields.tags = updateData.tags;
    if (updateData.badges !== undefined) updateFields.badges = updateData.badges;

    // SEO
    if (updateData.seo !== undefined) {
      updateFields.seo = {
        ...product.seo,
        ...updateData.seo,
        metaKeywords: updateData.seo?.metaKeywords || [],
      };
    }

    //  relatedProducts - convert to ObjectId array
    if (updateData.relatedProducts !== undefined) {
      updateFields.relatedProducts = updateData.relatedProducts
        .filter((id: string) => Types.ObjectId.isValid(id))
        .map((id: string) => new Types.ObjectId(id));
    }

    // Apply updates
    Object.assign(product, updateFields);

    // Save will trigger pre-save middleware
    await product.save();

    // Revalidate paths
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${id}`);
    revalidatePath(`/admin/products/${id}/edit`);
    if (product.slug) {
      revalidatePath(`/product/${product.slug}`);
    }

    return {
      success: true,
      product: {
        _id: product._id.toString(),
        name: product.name,
        slug: product.slug,
      },
    };
  } catch (error) {
    console.error('Update product error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update product',
    };
  }
}