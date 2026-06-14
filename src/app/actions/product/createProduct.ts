// src/actions/product/createProduct.ts
'use server';

import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { ICreateProduct } from '@/types/product';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Types } from 'mongoose';
import { generateSKU } from '@/lib/utils';

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  shortDescription: z.string().min(1, 'Short description is required'),
  brandId: z.string(),
  categoryId: z.string(),
  subcategoryId: z.string().optional().nullable(),
  specificationGroups: z.array(z.any()).default([]),
  variants: z.array(z.any()).default([]),
  imageGroups: z.array(z.any()).default([]),
  thumbnail: z.string().optional(),
  videos: z.array(z.any()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  badges: z.array(
    z.object({
      id: z.string().optional(),
      label: z.string(),
      color: z.string().optional(),
      icon: z.string().optional(),
      type: z.enum(['default', 'custom']).optional(),
    })
  ).optional().default([]),
  featured: z.boolean().optional().default(false),
  searchBoost: z.number().optional().default(1),
  seo: z.any().optional(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  hasVariants: z.boolean().optional().default(false),
  price: z.number().optional(),
  compareAtPrice: z.number().optional(),
  inventory: z.number().optional(),
});

export async function createProduct(data: ICreateProduct & {
  hasVariants?: boolean;
  price?: number;
  compareAtPrice?: number;
  inventory?: number;
}) {
  try {
    await connectDB();

    const validated = createProductSchema.parse(data);

    // Handle subcategoryId - convert empty string to null
    let subcategoryId = null;
    if (validated.subcategoryId && Types.ObjectId.isValid(validated.subcategoryId)) {
      subcategoryId = new Types.ObjectId(validated.subcategoryId);
    }

    // Clean up specification groups - remove groups with empty groupName and empty specifications
    let cleanedSpecGroups = (validated.specificationGroups || [])
      .filter((group: any) => group.groupName && group.groupName.trim() !== '')
      .map((group: any) => ({
        groupName: group.groupName.trim(),
        displayOrder: group.displayOrder || 0,
        specifications: (group.specifications || [])
          .filter((spec: any) => spec.label && spec.label.trim() !== '')
          .map((spec: any) => ({
            label: spec.label.trim(),
            value: spec.value || '',
            unit: spec.unit || '',
            type: spec.type || 'text',
            filterable: spec.filterable || false,
            key: spec.key || spec.label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
          }))
      }));

    // Handle variants
    let variants = [...validated.variants];

    // If product doesn't have variants, create a default variant
    if (!data.hasVariants || variants.length === 0) {
      const defaultVariant = {
        sku: generateSKU(),
        variantKey: 'default',
        attributes: [],
        price: data.price || 0,
        compareAtPrice: data.compareAtPrice || 0,
        inventory: data.inventory || 0,
        reserved: 0,
        images: [],
        isDefault: true,
        status: 'in_stock' as const,
      };
      variants = [defaultVariant];
    } else {
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
    }

    const badges = (validated.badges || []).map((badge: any) => {
      // backward compatibility
      if (typeof badge === 'string') {
        return {
          id: badge.toLowerCase(),
          label: badge,
          color: '',
          icon: '',
          type: 'custom',
        };
      }

      return {
        id:
          badge.id ||
          badge.label.toLowerCase().replace(/\s+/g, '-'),

        label: badge.label,

        color: badge.color || '',

        icon: badge.icon || '',

        type: badge.type || 'custom',
      };
    });

  

    // Create product data
    const productData = {
      name: validated.name,
      description: validated.description,
      shortDescription: validated.shortDescription,
      brandId: new Types.ObjectId(validated.brandId),
      categoryId: new Types.ObjectId(validated.categoryId),
      subcategoryId: subcategoryId,
      specificationGroups: cleanedSpecGroups,
      variants: variants,
      imageGroups: validated.imageGroups || [],
      thumbnail: validated.thumbnail || '',
      videos: validated.videos || [],
      tags: validated.tags || [],
      badges: badges,
      featured: validated.featured || false,
      searchBoost: validated.searchBoost || 1,
      seo: validated.seo || {},
      status: validated.status,
      ratingAverage: 0,
      ratingCount: 0,
    };

    console.log('Saving product with spec groups:', JSON.stringify(cleanedSpecGroups, null, 2));

    const product = new Product(productData);
    await product.save();

    revalidatePath('/admin/products');
    revalidatePath('/admin/products/[id]', 'page');

    return {
      success: true,
      product: {
        _id: product._id.toString(),
        name: product.name,
        slug: product.slug,
      },
    };
  } catch (error) {
    console.error('Create product error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create product',
    };
  }
}