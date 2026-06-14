// src/actions/brand/getBrands.ts
'use server';

import { connectDB } from '@/lib/dbConnect';
import { Brand } from '@/models/Brand';
import { Types } from 'mongoose';

export async function getBrands(options?: { isActive?: boolean; search?: string }) {
  await connectDB();

  const query: any = {};

  if (options?.isActive !== undefined) {
    query.isActive = options.isActive;
  }

  if (options?.search) {
    query.$or = [
      { name: { $regex: options.search, $options: 'i' } },
      { description: { $regex: options.search, $options: 'i' } },
    ];
  }

  const brands = await Brand.find(query)
    .sort({ name: 1 })
    .lean();

  return brands.map(brand => ({
    ...brand,
    _id: brand._id.toString(),
  }));
}

export async function getBrand(id: string) {
  await connectDB();

  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  const brand = await Brand.findById(id).lean();

  if (!brand) return null;

  return {
    ...brand,
    _id: brand._id.toString(),
  };
}

export async function createBrand(data: {
  name: string;
  logo?: string;
  description?: string;
  website?: string;
}) {
  try {
    await connectDB();

    const slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const brand = new Brand({
      name: data.name,
      slug,
      logo: data.logo,
      description: data.description,
      website: data.website,
      isActive: true,
    });

    await brand.save();

    return {
      success: true,
      brand: {
        _id: brand._id.toString(),
        name: brand.name,
        slug: brand.slug,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create brand',
    };
  }
}

// app/actions/brand/getBrands.ts
export async function getBrandById(id: string) {
  try {
    await connectDB();
    const brand = await Brand.findById(id).lean();
    if (!brand) return null;
    return {
      _id: brand._id.toString(),
      name: brand.name,
      slug: brand.slug,
    };
  } catch (error) {
    console.error('Error fetching brand:', error);
    return null;
  }
}