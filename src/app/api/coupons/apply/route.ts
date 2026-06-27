import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { applyCoupon } from '@/services/coupon.service';
import { successResponse, errorResponse } from '@/lib/api-response';

// POST /api/coupons/apply — used by checkout/order form
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const {
      code,
      subtotal,
      userId,
      productIds,
      categories,
      lines,
    } = await req.json();

    if (!code || typeof code !== 'string') {
      return errorResponse('Coupon code is required');
    }
    if (subtotal === undefined || Number(subtotal) <= 0) {
      return errorResponse('Valid subtotal is required');
    }

    const result = await applyCoupon({
      code,
      subtotal: Number(subtotal),
      userId,
      productIds,
      categories,
      lines: Array.isArray(lines)
        ? lines
            .filter((l: any) => l && typeof l === 'object')
            .map((l: any) => ({
              productId: String(l.productId || ''),
              lineTotal: Number(l.lineTotal) || 0,
            }))
            .filter((l: any) => l.productId)
        : undefined,
    });

    if (!result.valid) {
      return errorResponse(result.message || 'Invalid coupon', 400);
    }

    const allowedProducts: string[] = Array.isArray(result.coupon?.allowedProducts)
      ? result.coupon!.allowedProducts.map((id: any) => id.toString())
      : [];

    return successResponse({
      valid: true,
      discountAmount: result.discountAmount,
      freeShipping: result.freeShipping,
      allowedProducts,
      coupon: result.coupon
        ? {
            _id: result.coupon._id,
            code: result.coupon.code,
            type: result.coupon.type,
            value: result.coupon.value,
            discountAmount: result.discountAmount,
            freeShipping: result.freeShipping,
            description: result.coupon.description,
          }
        : null,
    });
  } catch (err) {
    console.error('[POST /api/coupons/apply]', err);
    return errorResponse('Failed to apply coupon', 500);
  }
}
