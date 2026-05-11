// app/api/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect as connectDB } from '@/lib/dbConnect';
import { Category } from '@/models/Category';
import { deleteImage,extractPublicIdFromUrl,} from '@/lib/cloudinary';

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

    /**
     * DELETE OLD IMAGE
     * when image changed
     */
    if (
      body.image &&
      existingCategory.image &&
      body.image !== existingCategory.image
    ) {
      const publicId = extractPublicIdFromUrl(
        existingCategory.image
      );

      if (publicId) {
        try {
          await deleteImage(publicId);

          console.log(
            'Deleted old category image:',
            publicId
          );
        } catch (error) {
          console.error(
            'Failed to delete old category image:',
            error
          );
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
      const publicId = extractPublicIdFromUrl(
        existingCategory.image
      );

      if (publicId) {
        try {
          await deleteImage(publicId);

          console.log(
            'Removed category image:',
            publicId
          );
        } catch (error) {
          console.error(
            'Failed to remove category image:',
            error
          );
        }
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
      updateData.specificationTemplate =
        body.specificationTemplate;
    }

    /**
     * Handle parentId
     */
    if (body.parentId !== undefined) {
      if (!body.parentId || body.parentId === '') {
        updateData.parentId = null;
      } else if (
        mongoose.Types.ObjectId.isValid(body.parentId)
      ) {
        updateData.parentId = body.parentId;
      } else {
        return NextResponse.json(
          { error: 'Invalid parentId format' },
          { status: 400 }
        );
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return NextResponse.json(category);

  } catch (error: any) {
    console.error(
      'Error updating category:',
      error
    );

    if (
      error.code === 11000 &&
      error.keyPattern?.slug
    ) {
      return NextResponse.json(
        {
          error:
            'Category with this slug already exists',
        },
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
      {
        error:
          error.message || 'Internal server error',
      },
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
          error:
            'Cannot delete category with subcategories. Please delete or reassign subcategories first.',
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
      const publicId = extractPublicIdFromUrl(
        category.image
      );

      if (publicId) {
        try {
          await deleteImage(publicId);

          console.log(
            'Deleted category image:',
            publicId
          );
        } catch (error) {
          console.error(
            'Failed to delete category image:',
            error
          );
        }
      }
    }

    await Category.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error(
      'Error deleting category:',
      error
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}