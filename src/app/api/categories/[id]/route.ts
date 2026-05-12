// app/api/categories/[id]/route.ts
import '@/models/Brand';
import '@/models/Category';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect as connectDB } from '@/lib/dbConnect';
import { Category } from '@/models/Category';
import { deleteImage, extractPublicIdFromUrl } from '@/lib/cloudinary';
import { syncProductsWithCategoryTemplate, cleanupOrphanedSpecs, getTemplateChanges } from '@/lib/categorySpecSync';

// Helper function to update child paths
async function updateChildPaths(categoryId: mongoose.Types.ObjectId, parentPath: string[]) {
  const children = await Category.find({ parentId: categoryId });
  
  for (const child of children) {
    const newPath = [...parentPath, child.slug];
    await Category.findByIdAndUpdate(child._id, { path: newPath });
    await updateChildPaths(child._id, newPath);
  }
}

// ==================== GET ====================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const category = await Category.findById(id).lean();

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== PUT ====================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const existingCategory = await Category.findById(id);

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if specification template has changed
    const templateChanged = JSON.stringify(existingCategory.specificationTemplate || []) !== 
                           JSON.stringify(body.specificationTemplate || []);

    // Check for duplicate slug (excluding current category)
    if (body.slug && body.slug !== existingCategory.slug) {
      const slugExists = await Category.findOne({
        slug: body.slug,
        _id: { $ne: id }
      });
      
      if (slugExists) {
        return NextResponse.json(
          { error: 'Category with this slug already exists' },
          { status: 400 }
        );
      }
    }

    /**
     * DELETE OLD IMAGE
     * when image changed
     */
    if (
      body.image &&
      existingCategory.image &&
      body.image !== existingCategory.image
    ) {
      const publicId = extractPublicIdFromUrl(existingCategory.image);

      if (publicId) {
        try {
          await deleteImage(publicId);
          console.log('Deleted old category image:', publicId);
        } catch (error) {
          console.error('Failed to delete old category image:', error);
        }
      }
    }

    /**
     * REMOVE IMAGE
     * when image removed completely
     */
    if (
      body.image === '' &&
      existingCategory.image
    ) {
      const publicId = extractPublicIdFromUrl(existingCategory.image);

      if (publicId) {
        try {
          await deleteImage(publicId);
          // console.log('Removed category image:', publicId);
        } catch (error) {
          console.error('Failed to remove category image:', error);
        }
      }
    }

    // Calculate level and path if parent changed
    let level = existingCategory.level || 0;
    let path = existingCategory.path || [existingCategory.slug];
    let parentChanged = false;

    if (body.parentId !== undefined && body.parentId !== existingCategory.parentId?.toString()) {
      parentChanged = true;
      
      if (!body.parentId || body.parentId === '') {
        // No parent (root category)
        level = 0;
        path = [body.slug || existingCategory.slug];
      } else if (mongoose.Types.ObjectId.isValid(body.parentId)) {
        const parent = await Category.findById(body.parentId);
        if (parent) {
          level = (parent.level || 0) + 1;
          path = [...(parent.path || [parent.slug]), body.slug || existingCategory.slug];
        } else {
          return NextResponse.json(
            { error: 'Parent category not found' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Invalid parentId format' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (body.name !== undefined)
      updateData.name = body.name;

    if (body.slug !== undefined)
      updateData.slug = body.slug;

    if (body.image !== undefined)
      updateData.image = body.image;

    if (body.description !== undefined)
      updateData.description = body.description;

    if (body.status !== undefined)
      updateData.status = body.status;

    if (body.specificationTemplate !== undefined) {
      updateData.specificationTemplate = body.specificationTemplate;
    }

    /**
     * Handle parentId
     */
    if (body.parentId !== undefined) {
      if (!body.parentId || body.parentId === '') {
        updateData.parentId = null;
      } else if (mongoose.Types.ObjectId.isValid(body.parentId)) {
        updateData.parentId = body.parentId;
      } else {
        return NextResponse.json(
          { error: 'Invalid parentId format' },
          { status: 400 }
        );
      }
    }

    // Add level and path if parent changed
    if (parentChanged) {
      updateData.level = level;
      updateData.path = path;
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedCategory) {
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      );
    }

    // If parent changed, update all children's paths
    if (parentChanged) {
      await updateChildPaths(updatedCategory._id, path);
    }

    // If specification template changed, sync all products in this category
    let syncResult = null;
    let changes = null;
    
    if (templateChanged && body.specificationTemplate) {
      try {
        // console.log(`Template changed for category ${id}, syncing products...`);
        
        // Get template changes for logging and response
        changes = getTemplateChanges(
          existingCategory.specificationTemplate || [], 
          body.specificationTemplate
        );
        
        // console.log(`Template changes:`, {
        //   added: changes.added.map((f: any) => f.key),
        //   removed: changes.removed,
        //   changed: changes.changed.map((c: any) => c.key),
        //   unchanged: changes.unchanged
        // });

        // Sync products with new template (preserving values)
        syncResult = await syncProductsWithCategoryTemplate(id, body.specificationTemplate);
        
        // console.log(`Sync complete: ${syncResult.updatedCount} products updated, ${syncResult.errorCount} errors`);
        
      } catch (syncError: any) {
        console.error('Error syncing products:', syncError);
        // Don't fail the category update, but return warning
        const response = updatedCategory.toObject();
        return NextResponse.json({
          ...response,
          warning: 'Category updated but product sync failed. You may need to run manual sync.',
          syncError: syncError.message
        }, { status: 200 });
      }
    }

    // Return response with sync info if applicable
    const response = updatedCategory.toObject();
    
    if (syncResult && changes) {
      return NextResponse.json({
        ...response,
        syncInfo: {
          productsUpdated: syncResult.updatedCount,
          productsWithErrors: syncResult.errorCount,
          templateChanges: {
            added: changes.added.map((f: any) => ({ key: f.key, label: f.label })),
            removed: changes.removed,
            changed: changes.changed.map((c: any) => ({ 
              key: c.key, 
              oldLabel: c.old.label, 
              newLabel: c.new.label 
            })),
            unchanged: changes.unchanged
          },
          message: 'Category updated and products synced successfully'
        }
      });
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error updating category:', error);

    if (error.code === 11000 && error.keyPattern?.slug) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      );
    }

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== DELETE ====================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    /**
     * Check children
     */
    const hasChildren = await Category.findOne({
      parentId: id,
    });

    if (hasChildren) {
      return NextResponse.json(
        {
          error: 'Cannot delete category with subcategories. Please delete or reassign subcategories first.',
        },
        { status: 400 }
      );
    }

    /**
     * Check if category has products
     */
    const { Product } = await import('@/models/Product');
    const hasProducts = await Product.findOne({ 
      categoryId: id,
      deletedAt: null 
    });

    if (hasProducts) {
      return NextResponse.json(
        {
          error: 'Cannot delete category with products. Please reassign products first.',
        },
        { status: 400 }
      );
    }

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    /**
     * Delete category image
     */
    if (category.image) {
      const publicId = extractPublicIdFromUrl(category.image);

      if (publicId) {
        try {
          await deleteImage(publicId);
          // console.log('Deleted category image:', publicId);
        } catch (error) {
          console.error('Failed to delete category image:', error);
        }
      }
    }

    await Category.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting category:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}