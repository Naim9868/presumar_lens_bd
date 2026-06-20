// src/services/coupon.service.ts
import Coupon from '@/models/Coupon';

interface ApplyCouponInput {
  code: string;
  subtotal: number;
  userId?: string;
  productIds?: string[];
}

interface CouponResult {
  valid: boolean;
  discountAmount: number;
  message?: string;
  coupon?: Record<string, unknown>;
}

export async function applyCoupon(input: ApplyCouponInput): Promise<CouponResult> {
  const coupon = await Coupon.findOne({
    code: input.code.toUpperCase(),
    active: true,
  });

  if (!coupon) return { valid: false, discountAmount: 0, message: 'Invalid coupon code' };

  const now = new Date();
  if (coupon.startDate && now < coupon.startDate)
    return { valid: false, discountAmount: 0, message: 'Coupon not yet active' };

  if (coupon.endDate && now > coupon.endDate)
    return { valid: false, discountAmount: 0, message: 'Coupon expired' };

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
    return { valid: false, discountAmount: 0, message: 'Coupon usage limit reached' };

  if (coupon.minOrder && input.subtotal < coupon.minOrder)
    return {
      valid: false,
      discountAmount: 0,
      message: `Minimum order of ৳${coupon.minOrder} required`,
    };

  let discountAmount = 0;

  if (coupon.type === 'PERCENTAGE') {
    discountAmount = (input.subtotal * coupon.value) / 100;
    if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  } else if (coupon.type === 'FIXED') {
    discountAmount = coupon.value;
  }

  discountAmount = Math.min(discountAmount, input.subtotal);

  return {
    valid: true,
    discountAmount,
    coupon: coupon.toObject(),
  };
}