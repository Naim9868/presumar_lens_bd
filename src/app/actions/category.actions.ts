// app/actions/category.actions.ts
"use server";

import {dbConnect} from "@/lib/dbConnect";
import { Category } from "@/models/Category";
import { revalidatePath } from "next/cache";
import { Category as CategoryType } from "@/types/category";

export async function fetchCategories(): Promise<CategoryType[]> {
  try {
    await dbConnect();
    
    // Get all active categories
    const categories = await Category.find({ status: 'active' })
      .sort({ name: 1 })
      .lean();
    
    // Build hierarchical structure
    const categoryMap = new Map();
    const parentCategories: CategoryType[] = [];
    
    // First, convert all categories to plain objects and store in map
    categories.forEach(category => {
      const serialized: CategoryType = {
        _id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        image: category.image || '',
        description: category.description || '',
        parentId: category.parentId ? category.parentId.toString() : null,
        status: category.status,
        specificationTemplate: category.specificationTemplate || [],
        children: [],
        createdAt: category.createdAt ? new Date(category.createdAt).toISOString() : undefined,
        updatedAt: category.updatedAt ? new Date(category.updatedAt).toISOString() : undefined,
      };
      categoryMap.set(serialized._id, serialized);
    });
    
    // Build parent-child relationships
    categories.forEach(category => {
      const catId = category._id.toString();
      const parentId = category.parentId ? category.parentId.toString() : null;
      const categoryObj = categoryMap.get(catId);
      
      if (parentId && categoryMap.has(parentId)) {
        // Add as child to parent
        const parent = categoryMap.get(parentId);
        if (parent.children) {
          parent.children.push(categoryObj);
        }
      } else {
        // This is a parent category
        parentCategories.push(categoryObj);
      }
    });
    
    // Sort children by name
    parentCategories.forEach(parent => {
      if (parent.children && parent.children.length > 0) {
        parent.children.sort((a, b) => a.name.localeCompare(b.name));
      }
    });
    
    return parentCategories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function fetchCategoryBySlug(slug: string): Promise<CategoryType | null> {
  try {
    await dbConnect();
    
    const category = await Category.findOne({ slug, status: 'active' }).lean();
    
    if (!category) return null;
    
    // Get subcategories if this is a parent
    const subcategories = await Category.find({ 
      parentId: category._id, 
      status: 'active' 
    }).lean();
    
    return {
      _id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      image: category.image || '',
      description: category.description || '',
      parentId: category.parentId ? category.parentId.toString() : null,
      status: category.status,
      specificationTemplate: category.specificationTemplate || [],
      children: subcategories.map(sub => ({
        _id: sub._id.toString(),
        name: sub.name,
        slug: sub.slug,
        image: sub.image || '',
        description: sub.description || '',
        parentId: sub.parentId ? sub.parentId.toString() : null,
        status: sub.status,
        specificationTemplate: sub.specificationTemplate || [],
        createdAt: sub.createdAt ? new Date(sub.createdAt).toISOString() : undefined,
        updatedAt: sub.updatedAt ? new Date(sub.updatedAt).toISOString() : undefined,
      })),
      createdAt: category.createdAt ? new Date(category.createdAt).toISOString() : undefined,
      updatedAt: category.updatedAt ? new Date(category.updatedAt).toISOString() : undefined,
    };
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

export async function revalidateCategories() {
  revalidatePath('/');
  revalidatePath('/categories');
}