// src/app/api/brands/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { Brand } from '@/models/Brand';
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
        { success: false, error: 'Invalid brand ID' },
        { status: 400 }
      );
    }

    const brand = await Brand.findById(id).lean();

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      brand: {
        ...brand,
        _id: brand._id.toString(),
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brand' },
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
        { success: false, error: 'Invalid brand ID' },
        { status: 400 }
      );
    }

    const brand = await Brand.findById(id);


    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      );
    }

    // If logo is being changed and there's an old publicId, delete the old image
    const oldPublicId = brand.logoPublicId;

    // Update fields
    if (body.name && body.name !== brand.name) {
      // Check if new name conflicts
      const existingBrand = await Brand.findOne({
        name: { $regex: new RegExp(`^${body.name}$`, 'i') },
        _id: { $ne: brand._id }
      });

      if (existingBrand) {
        return NextResponse.json(
          { success: false, error: 'Brand with this name already exists' },
          { status: 400 }
        );
      }

      brand.name = body.name;
      brand.slug = body.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    if (body.logo !== undefined) brand.logo = body.logo;
    if (body.logoPublicId !== undefined) brand.logoPublicId = body.logoPublicId;
    if (body.description !== undefined) brand.description = body.description;
    if (body.website !== undefined) brand.website = body.website;
    if (body.isActive !== undefined) brand.isActive = body.isActive;

    await brand.save();


    // delete old image after successful save
    const imageChanged =
      body.logoPublicId &&
      oldPublicId &&
      body.logoPublicId !== oldPublicId;

    if (imageChanged) {
      try {
        await deleteImage(oldPublicId);
      } catch (error) {
        console.error('Cloudinary delete failed:', error);
      }
    }

    return NextResponse.json({
      success: true,
      brand: {
        _id: brand._id.toString(),
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
        logoPublicId: brand.logoPublicId,
        description: brand.description,
        website: brand.website,
        isActive: brand.isActive,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update brand' },
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
        { success: false, error: 'Invalid brand ID' },
        { status: 400 }
      );
    }

    const brand = await Brand.findById(id);

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      );
    }

    // Partial update
    if (body.isActive !== undefined) brand.isActive = body.isActive;
    if (body.name !== undefined) {
      brand.name = body.name;
      brand.slug = body.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    await brand.save();

    return NextResponse.json({
      success: true,
      brand: {
        _id: brand._id.toString(),
        name: brand.name,
        slug: brand.slug,
        isActive: brand.isActive,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update brand' },
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
        { success: false, error: 'Invalid brand ID' },
        { status: 400 }
      );
    }

    const brand = await Brand.findById(id);

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      );
    }

    // Check if brand has products
    const productCount = await Product.countDocuments({ brandId: new Types.ObjectId(id) });

    if (productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete brand with ${productCount} associated products. Reassign or delete products first.`
        },
        { status: 400 }
      );
    }

    // Delete logo from Cloudinary if exists
    if (brand.logoPublicId) {
      try {
        await deleteImage(brand.logoPublicId);
      } catch (error) {
        console.error('Error deleting logo from Cloudinary:', error);
      }
    }

    await Brand.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete brand' },
      { status: 500 }
    );
  }
}