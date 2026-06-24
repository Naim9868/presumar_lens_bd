import Coupon, { ICoupon } from '@/models/Coupon';
import { connectDB } from '@/lib/dbConnect';

export interface ApplyCouponInput {
  code: string;
  subtotal: number;
  userId?: string;
  productIds?: string[];
  categories?: string[];
}

export interface CouponResult {
  valid: boolean;
  discountAmount: number;
  freeShipping: boolean;
  message?: string;
  coupon?: Partial<ICoupon>;
}

export interface GetCouponsFilters {
  active?: boolean;
  page?: number;
  limit?: number;
}

export interface GetCouponsResult {
  coupons: Partial<ICoupon>[];
  total: number;
}

export async function applyCoupon(input: ApplyCouponInput): Promise<CouponResult> {
  await connectDB();

  const coupon: ICoupon | null = await Coupon.findOne({ code: input.code.toUpperCase().trim(), active: true });

  if (!coupon) return { valid: false, discountAmount: 0, freeShipping: false, message: 'Invalid coupon code' };

  const now: Date = new Date();

  if (coupon.startDate && now < coupon.startDate)
    return { valid: false, discountAmount: 0, freeShipping: false, message: 'Coupon not yet active' };

  if (coupon.endDate && now > coupon.endDate)
    return { valid: false, discountAmount: 0, freeShipping: false, message: 'Coupon has expired' };

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
    return { valid: false, discountAmount: 0, freeShipping: false, message: 'Coupon usage limit reached' };

  if (coupon.minOrder && input.subtotal < coupon.minOrder)
    return { valid: false, discountAmount: 0, freeShipping: false, message: `Minimum order of ৳${coupon.minOrder} required` };

  // User restriction check
  if (coupon.allowedUsers && coupon.allowedUsers.length > 0 && input.userId) {
    const isAllowed: boolean = coupon.allowedUsers.some((id) => id.toString() === input.userId);
    if (!isAllowed) return { valid: false, discountAmount: 0, freeShipping: false, message: 'Coupon not valid for your account' };
  }

  // Free shipping coupon
  if (coupon.type === 'FREE_SHIPPING') {
    return { valid: true, discountAmount: 0, freeShipping: true, coupon: coupon.toObject() };
  }

  let discountAmount: number = 0;

  if (coupon.type === 'PERCENTAGE') {
    discountAmount = (input.subtotal * coupon.value) / 100;
    if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  } else if (coupon.type === 'FIXED') {
    discountAmount = coupon.value;
  }

  discountAmount = Math.min(discountAmount, input.subtotal);
  discountAmount = Math.round(discountAmount);

  return { valid: true, discountAmount, freeShipping: false, coupon: coupon.toObject() };
}

export async function incrementCouponUsage(code: string): Promise<void> {
  await connectDB();
  await Coupon.findOneAndUpdate({ code: code.toUpperCase() }, { $inc: { usedCount: 1 } });
}

export async function createCoupon(data: Partial<ICoupon>): Promise<ICoupon> {
  await connectDB();
  return Coupon.create(data);
}

export async function getCoupons(filters: GetCouponsFilters): Promise<GetCouponsResult> {
  await connectDB();
  const { active, page = 1, limit = 20 }: GetCouponsFilters = filters;
  const query: Record<string, unknown> = {};
  if (typeof active === 'boolean') query.active = active;

  const [coupons, total] = await Promise.all([
    Coupon.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Coupon.countDocuments(query),
  ]);
  return { coupons, total };
}

export async function updateCoupon(id: string, data: Partial<ICoupon>): Promise<ICoupon | null> {
  await connectDB();
  return Coupon.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteCoupon(id: string): Promise<ICoupon | null> {
  await connectDB();
  return Coupon.findByIdAndDelete(id);
}
