import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import {
  getCouponById,
  updateCoupon,
  deleteCoupon,
} from '@/services/coupon.service';
import { successResponse, errorResponse } from '@/lib/api-response';

// GET /api/admin/coupons/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const coupon = await getCouponById(id);
    if (!coupon) return errorResponse('Coupon not found', 404);
    return successResponse({ coupon });
  } catch (err) {
    console.error('[GET /api/admin/coupons/[id]]', err);
    return errorResponse('Failed to fetch coupon', 500);
  }
}

// PUT /api/admin/coupons/[id] — update
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    if (body.type && !['FIXED', 'PERCENTAGE', 'FREE_SHIPPING'].includes(body.type)) {
      return errorResponse('Invalid coupon type');
    }

    if (body.code) body.code = String(body.code).toUpperCase();

    const data: Record<string, unknown> = {};
    if (body.code !== undefined) data.code = body.code;
    if (body.type !== undefined) data.type = body.type;
    if (body.value !== undefined) data.value = Number(body.value);
    if (body.minOrder !== undefined)
      data.minOrder = body.minOrder === null ? undefined : Number(body.minOrder);
    if (body.maxDiscount !== undefined)
      data.maxDiscount =
        body.maxDiscount === null ? undefined : Number(body.maxDiscount);
    if (body.usageLimit !== undefined)
      data.usageLimit =
        body.usageLimit === null ? undefined : Number(body.usageLimit);
    if (body.perUserLimit !== undefined)
      data.perUserLimit =
        body.perUserLimit === null ? undefined : Number(body.perUserLimit);
    if (body.startDate !== undefined)
      data.startDate = body.startDate ? new Date(body.startDate) : undefined;
    if (body.endDate !== undefined)
      data.endDate = body.endDate ? new Date(body.endDate) : undefined;
    if (body.active !== undefined) data.active = Boolean(body.active);
    if (body.description !== undefined) data.description = body.description;
    if (body.allowedCategories !== undefined)
      data.allowedCategories = body.allowedCategories;
    if (body.allowedProducts !== undefined)
      data.allowedProducts = body.allowedProducts;
    if (body.allowedUsers !== undefined)
      data.allowedUsers = body.allowedUsers;

    const coupon = await updateCoupon(id, data);
    if (!coupon) return errorResponse('Coupon not found', 404);
    return successResponse({ coupon });
  } catch (err: any) {
    console.error('[PUT /api/admin/coupons/[id]]', err);
    if (err?.code === 11000) {
      return errorResponse('Coupon code already exists', 409);
    }
    return errorResponse('Failed to update coupon', 500);
  }
}

// DELETE /api/admin/coupons/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const coupon = await deleteCoupon(id);
    if (!coupon) return errorResponse('Coupon not found', 404);
    return successResponse({ coupon });
  } catch (err) {
    console.error('[DELETE /api/admin/coupons/[id]]', err);
    return errorResponse('Failed to delete coupon', 500);
  }
}

// PATCH /api/admin/coupons/[id] — toggle active
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    if (typeof body.active !== 'boolean') {
      return errorResponse('active flag is required');
    }

    const coupon = await updateCoupon(id, { active: body.active });
    if (!coupon) return errorResponse('Coupon not found', 404);
    return successResponse({ coupon });
  } catch (err) {
    console.error('[PATCH /api/admin/coupons/[id]]', err);
    return errorResponse('Failed to toggle coupon', 500);
  }
}