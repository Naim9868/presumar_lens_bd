import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { applyCoupon } from '@/services/coupon.service';
import { successResponse, errorResponse } from '@/lib/api-response';

// POST /api/coupons/apply
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { code, subtotal, userId, productIds, categories } = await req.json();

    if (!code) return errorResponse('Coupon code is required');
    if (!subtotal || subtotal <= 0) return errorResponse('Valid subtotal is required');

    const result = await applyCoupon({ code, subtotal, userId, productIds, categories });

    if (!result.valid) {
      return errorResponse(result.message || 'Invalid coupon', 400);
    }

    return successResponse({
      valid: true,
      discountAmount: result.discountAmount,
      freeShipping: result.freeShipping,
      coupon: {
        code: result.coupon?.code,
        type: result.coupon?.type,
        value: result.coupon?.value,
      },
    });
  } catch (err) {
    console.error('[POST /api/coupons/apply]', err);
    return errorResponse('Failed to apply coupon', 500);
  }
}
