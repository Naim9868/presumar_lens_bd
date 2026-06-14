// src/actions/category/getCategories.ts
'use server';

import { connectDB } from '@/lib/dbConnect';
import { Category } from '@/models/Category';
import { Types } from 'mongoose';

// Define the return type
export interface CategoryResponse {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  parentId: string | null;
  status: 'active' | 'inactive';
  children?: CategoryResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export async function getCategories(options?: {
  status?: 'active' | 'inactive';
  parentId?: string | null;
  includeInactive?: boolean;
}): Promise<CategoryResponse[]> {
  try {
    await connectDB();

    const query: any = {};

    if (options?.status) {
      query.status = options.status;
    } else if (!options?.includeInactive) {
      query.status = 'active';
    }

    if (options?.parentId !== undefined) {
      if (options.parentId === null) {
        query.parentId = null;
      } else if (Types.ObjectId.isValid(options.parentId)) {
        query.parentId = new Types.ObjectId(options.parentId);
      }
    }

    const categories = await Category.find(query)
      .sort({ name: 1 })
      .lean();

    // Serialize and convert to plain objects
    const serializedCategories: CategoryResponse[] = categories.map(cat => ({
      _id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      image: cat.image,
      description: cat.description,
      parentId: cat.parentId?.toString() || null,
      status: cat.status,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    // Build hierarchy
    const categoryMap = new Map<string, CategoryResponse>();
    const rootCategories: CategoryResponse[] = [];

    // First pass: add all categories to map
    serializedCategories.forEach(cat => {
      categoryMap.set(cat._id, { ...cat, children: [] });
    });

    // Second pass: build hierarchy
    serializedCategories.forEach(cat => {
      const categoryWithChildren = categoryMap.get(cat._id);
      if (categoryWithChildren) {
        if (cat.parentId && categoryMap.has(cat.parentId)) {
          const parent = categoryMap.get(cat.parentId);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(categoryWithChildren);
          }
        } else {
          rootCategories.push(categoryWithChildren);
        }
      }
    });

    return rootCategories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function getCategory(id: string) {
  try {
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const category = await Category.findById(id).lean();

    if (!category) return null;

    return {
      _id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      image: category.image,
      description: category.description,
      parentId: category.parentId?.toString() || null,
      status: category.status,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    await connectDB();

    const category = await Category.findOne({ slug }).lean();

    if (!category) return null;

    return {
      _id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      image: category.image,
      description: category.description,
      parentId: category.parentId?.toString() || null,
      status: category.status,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    return null;
  }
}

export async function createCategory(data: {
  name: string;
  image?: string;
  description?: string;
  parentId?: string;
}) {
  try {
    await connectDB();

    const slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const category = new Category({
      name: data.name,
      slug,
      image: data.image,
      description: data.description,
      parentId: data.parentId ? new Types.ObjectId(data.parentId) : null,
      status: 'active',
    });

    await category.save();

    return {
      success: true,
      category: {
        _id: category._id.toString(),
        name: category.name,
        slug: category.slug,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create category',
    };
  }
}