// src/app/api/categories/[id]/route.ts (updated PUT and DELETE methods)
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { Category } from '@/models/Category';
import { Product } from '@/models/Product';
import { Types } from 'mongoose';
import { deleteImage } from '@/lib/cloudinary';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const category = await Category.findById(id).lean();

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category: {
        ...category,
        _id: category._id.toString(),
        parentId: category.parentId?.toString() || null,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // If image is being changed and there's an old publicId, delete the old image
    const oldPublicId = category?.imagePublicId;

    // Check for circular reference
    if (body.parentId) {
      let currentId: Types.ObjectId | null =
        new Types.ObjectId(body.parentId);
      let isCircular = false;

      while (currentId) {
        if (currentId.toString() === id) {
          isCircular = true;
          break;
        }
        const parent: {
          parentId?: Types.ObjectId | null;
        } | null = await Category.findById(currentId);
        
        currentId = parent?.parentId || null;
      }

      if (isCircular) {
        return NextResponse.json(
          { success: false, error: 'Cannot set category as its own descendant' },
          { status: 400 }
        );
      }
    }

    // Update fields
    if (body.name && body.name !== category.name) {
      const newSlug = body.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const existingCategory = await Category.findOne({
        slug: newSlug,
        _id: { $ne: category._id }
      });

      if (existingCategory) {
        return NextResponse.json(
          { success: false, error: 'Category with similar name already exists' },
          { status: 400 }
        );
      }

      category.name = body.name;
      category.slug = newSlug;
    }

    if (body.image !== undefined) category.image = body.image;
    if (body.imagePublicId !== undefined) category.imagePublicId = body.imagePublicId;
    if (body.description !== undefined) category.description = body.description;
    if (body.parentId !== undefined) {
      category.parentId = body.parentId ? new Types.ObjectId(body.parentId) : null;
    }
    if (body.status !== undefined) category.status = body.status;

    await category.save();

    if (
      oldPublicId &&
      body.imagePublicId &&
      oldPublicId !== body.imagePublicId
    ) {
      try {
        await deleteImage(oldPublicId);
      } catch (error) {
        console.error('Cloudinary delete failed:', error);
      }
    }

    return NextResponse.json({
      success: true,
      category: {
        _id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        image: category.image,
        imagePublicId: category.imagePublicId,
        description: category.description,
        parentId: category.parentId?.toString() || null,
        status: category.status,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Partial update
    if (body.status !== undefined) category.status = body.status;
    if (body.name !== undefined) {
      category.name = body.name;
      category.slug = body.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    await category.save();

    return NextResponse.json({
      success: true,
      category: {
        _id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        status: category.status,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get all descendant categories to delete
    const getDescendantIds = async (categoryId: string): Promise<string[]> => {
      const children = await Category.find({ parentId: new Types.ObjectId(categoryId) });
      let descendants = [categoryId];

      for (const child of children) {
        const childDescendants = await getDescendantIds(child._id.toString());
        descendants.push(...childDescendants);
      }

      return descendants;
    };

    const categoriesToDelete = await getDescendantIds(id);
    const categoryObjectIds = categoriesToDelete.map(cid => new Types.ObjectId(cid));

    // Check if any categories have products
    const productCount = await Product.countDocuments({
      categoryId: { $in: categoryObjectIds }
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete categories with ${productCount} associated products. Reassign or delete products first.`
        },
        { status: 400 }
      );
    }

    // Delete images from Cloudinary for all categories being deleted
    const categoriesWithImages = await Category.find({
      _id: { $in: categoryObjectIds },
      imagePublicId: { $exists: true, $ne: null }
    });

    // Delete images sequentially to avoid overwhelming the API
    for (const cat of categoriesWithImages) {
      if (cat.imagePublicId) {
        try {
          await deleteImage(cat.imagePublicId);
        } catch (error) {
          console.error(`Error deleting image for category ${cat._id}:`, error);
          // Continue with deletion even if image delete fails
        }
      }
    }

    // Delete all categories
    await Category.deleteMany({ _id: { $in: categoryObjectIds } });

    return NextResponse.json({
      success: true,
      deletedChildrenIds: categoriesToDelete.filter(cid => cid !== id),
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}