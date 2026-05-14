// app/api/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import '@/models/index';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { Brand } from '@/models/Brand';
import { deleteImage, extractPublicIdFromUrl } from '@/lib/cloudinary';

/* ===============================
   TYPES
=============================== */
type Variant = {
  price?: number;
  inventory?: number;
  images?: string[];
};

interface SpecValidationResult {
  validSpecs: any[];
  errors: string[];
}

// Helper function to normalize keys
function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Helper function to validate specs against category template
async function validateAndCleanSpecs(
  specs: any[],
  categoryId: string,
  productId?: string
): Promise<{ validSpecs: any[]; errors: string[] }> {
  const errors: string[] = [];
  
  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
    return { validSpecs: specs || [], errors };
  }

  const category = await Category.findById(categoryId);
  if (!category || !category.specificationTemplate?.length) {
    return { validSpecs: specs || [], errors };
  }

  // Create a map of valid spec keys from template (using normalized keys)
  const validSpecsMap = new Map();
  const requiredSpecsMap = new Map();
  
  for (const group of category.specificationTemplate) {
    for (const field of group.fields) {
      const normalizedKey = normalizeKey(field.key);
      validSpecsMap.set(normalizedKey, {
        originalKey: field.key,
        label: field.label,
        group: group.groupName,
        unit: field.unit,
        filterable: field.filterable,
        required: field.required,
        defaultValue: field.defaultValue
      });
      
      if (field.required) {
        requiredSpecsMap.set(normalizedKey, {
          originalKey: field.key,
          label: field.label,
          group: group.groupName,
          unit: field.unit,
          filterable: field.filterable,
          defaultValue: field.defaultValue
        });
      }
    }
  }

  // Filter and validate incoming specs
  const validSpecs: any[] = [];
  const processedKeys = new Set();

  for (const spec of specs || []) {
    // FIX: Normalize the spec key for lookup
    const normalizedKey = normalizeKey(spec.key || '');
    const templateField = validSpecsMap.get(normalizedKey);
    
    if (templateField) {
      // Spec exists in template - keep it with template's key format
      validSpecs.push({
        key: templateField.originalKey, // Use template's key format
        label: templateField.label,
        value: spec.value, // Preserve the value
        group: templateField.group,
        unit: templateField.unit,
        filterable: templateField.filterable
      });
      processedKeys.add(normalizedKey);
    } else if (spec.key && spec.value !== undefined && spec.value !== '') {
      // Spec not in template - warn but don't include
      errors.push(`Spec "${spec.key}" is not defined in category template and will be removed`);
    }
  }

  // Add missing required specs
  for (const [normKey, templateField] of requiredSpecsMap) {
    if (!processedKeys.has(normKey)) {
      validSpecs.push({
        key: templateField.originalKey,
        label: templateField.label,
        value: templateField.defaultValue !== undefined ? templateField.defaultValue : '',
        group: templateField.group,
        unit: templateField.unit,
        filterable: templateField.filterable
      });
      errors.push(`Added missing required spec: ${templateField.label}`);
    }
  }
  
  return { validSpecs, errors };
}

// Helper function to delete product images
async function deleteProductImages(product: any): Promise<{ success: number; failed: number }> {
  const imagesToDelete: string[] = [];
  
  // Add thumbnail
  if (product.thumbnail) {
    imagesToDelete.push(product.thumbnail);
  }
  
  // Add all product images
  if (product.images && product.images.length > 0) {
    imagesToDelete.push(...product.images);
  }
  
  // Add all variant images
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach((variant: Variant) => {
      if (variant.images && variant.images.length > 0) {
        imagesToDelete.push(...variant.images);
      }
    });
  }
  
  // Remove duplicates
  const uniqueImages = [...new Set(imagesToDelete)];
  
  let successCount = 0;
  let failedCount = 0;
  
  // Delete each image from Cloudinary
  for (const imageUrl of uniqueImages) {
    const publicId = extractPublicIdFromUrl(imageUrl);
    if (publicId) {
      try {
        await deleteImage(publicId);
        successCount++;
        console.log(`[Delete] Deleted image: ${publicId}`);
      } catch (error) {
        failedCount++;
        console.error(`[Delete] Failed to delete image ${publicId}:`, error);
      }
    }
  }
  
  return { success: successCount, failed: failedCount };
}

/* ===============================
   GET PRODUCT
=============================== */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const product = await Product.findById(id)
      .populate('categoryId', 'name slug specificationTemplate')
      .populate('brandId', 'name')
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    /* ===============================
       CALCULATIONS
    =============================== */
    let totalInventory = 0;
    let lowestPrice = 0;
    let highestPrice = 0;

    if (product.variants && product.variants.length > 0) {
      const variants = product.variants as Variant[];

      totalInventory = variants.reduce(
        (sum: number, variant) => sum + (variant.inventory ?? 0),
        0
      );

      const prices = variants.map(v => v.price ?? 0);

      lowestPrice = Math.min(...prices);
      highestPrice = Math.max(...prices);
    }

    // Get category template info for reference
    const category = product.categoryId as any;
    const hasSpecTemplate = category?.specificationTemplate?.length > 0;

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        totalInventory,
        lowestPrice,
        highestPrice,
        _meta: {
          hasSpecTemplate,
          specTemplateGroups: hasSpecTemplate ? category.specificationTemplate : null
        }
      },
    });

  } catch (error: any) {
    console.error('GET product error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/* ===============================
   UPDATE PRODUCT
=============================== */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const existingProduct = await Product.findById(id);

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if category changed - need to revalidate specs
    const categoryChanged = body.categoryId && 
                           body.categoryId !== existingProduct.categoryId?.toString();

    // Clean subcategory
    const cleanBody: any = { ...body };
    if (
      cleanBody.subcategoryId === '' ||
      cleanBody.subcategoryId === null ||
      cleanBody.subcategoryId === undefined
    ) {
      delete cleanBody.subcategoryId;
    }

    // Validate and clean specifications against category template
    const targetCategoryId = body.categoryId || existingProduct.categoryId;
    let specValidation: SpecValidationResult = { validSpecs: [], errors: [] };
    
    // Always validate specs if they exist or category changed
    if (body.specsFlat || categoryChanged) {
      specValidation = await validateAndCleanSpecs(
        body.specsFlat || existingProduct.specsFlat || [],
        targetCategoryId,
        id
      );
      
      cleanBody.specsFlat = specValidation.validSpecs;
    } else {
      // Keep existing specs
      cleanBody.specsFlat = existingProduct.specsFlat;
    }

    // Handle image deletions if needed
    if (cleanBody.thumbnail && existingProduct.thumbnail && cleanBody.thumbnail !== existingProduct.thumbnail) {
      const oldPublicId = extractPublicIdFromUrl(existingProduct.thumbnail);
      if (oldPublicId) {
        try {
          await deleteImage(oldPublicId);
          // console.log(`Deleted old thumbnail: ${oldPublicId}`);
        } catch (error) {
          console.error('Failed to delete old thumbnail:', error);
        }
      }
    }

    if (cleanBody.images && existingProduct.images) {
      const removedImages = existingProduct.images.filter(
        (img: string) => !cleanBody.images.includes(img)
      );
      
      for (const img of removedImages) {
        const publicId = extractPublicIdFromUrl(img);
        if (publicId) {
          try {
            await deleteImage(publicId);
            // console.log(`Deleted removed image: ${publicId}`);
          } catch (error) {
            console.error('Failed to delete image:', error);
          }
        }
      }
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: cleanBody },
      {
        new: true,
        runValidators: true,
      }
    ).populate('categoryId', 'name slug specificationTemplate')
     .populate('brandId', 'name');

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Return warnings if there were spec validation issues
    const response: any = {
      success: true,
      data: product,
      message: 'Product updated successfully',
    };

    if (specValidation.errors.length > 0) {
      response.warnings = specValidation.errors;
      response.message = 'Product updated with specification warnings';
    }

    if (categoryChanged) {
      response.message += ' and category changed';
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('PUT product error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 11000 && error.keyPattern?.slug) {
      return NextResponse.json(
        { success: false, error: 'Product slug already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/* ===============================
   DELETE PRODUCT
=============================== */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Find product first to get all image URLs
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete all associated images from Cloudinary
    console.log(`[Delete] Deleting images for product: ${product.name} (ID: ${id})`);
    const { success: deletedCount, failed: failedCount } = await deleteProductImages(product);
    
    console.log(`[Delete] Images deleted: ${deletedCount} successful, ${failedCount} failed`);
    
    // Delete the product from database
    await Product.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      deletedImages: {
        success: deletedCount,
        failed: failedCount
      }
    });

  } catch (error: any) {
    console.error('DELETE product error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}