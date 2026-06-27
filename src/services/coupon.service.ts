import Coupon, { ICoupon } from '@/models/Coupon';
import { connectDB } from '@/lib/dbConnect';

export interface ApplyCouponInput {
  code: string;
  subtotal: number;
  userId?: string;
  productIds?: string[];
  categories?: string[];
  // Per-line totals: [{ productId, lineTotal }] — used to scope
  // product-specific coupons to the qualifying items only.
  lines?: Array<{ productId: string; lineTotal: number }>;
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
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetCouponsResult {
  coupons: Partial<ICoupon>[];
  total: number;
  page: number;
  limit: number;
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

  // Product/category restriction check
  if (input.productIds && input.productIds.length > 0) {
    const productRestrictions = coupon.allowedProducts && coupon.allowedProducts.length > 0;
    if (productRestrictions) {
      const allowed = coupon.allowedProducts!.some((id) =>
        input.productIds!.includes(id.toString())
      );
      if (!allowed) {
        return {
          valid: false,
          discountAmount: 0,
          freeShipping: false,
          message: 'Coupon not valid for items in your cart',
        };
      }
    }

    if (coupon.allowedCategories && coupon.allowedCategories.length > 0 && input.categories && input.categories.length > 0) {
      const catMatch = input.categories.some((c) => coupon.allowedCategories!.includes(c));
      if (!catMatch) {
        return {
          valid: false,
          discountAmount: 0,
          freeShipping: false,
          message: 'Coupon not valid for items in your cart',
        };
      }
    }
  }

  // Calculate the discountable subtotal.
  // - For product-specific coupons, only the qualifying line totals count.
  // - Otherwise the entire subtotal counts.
  let discountable: number = input.subtotal;

  if (coupon.allowedProducts && coupon.allowedProducts.length > 0 && input.lines && input.lines.length > 0) {
    const allowedIds = new Set(coupon.allowedProducts.map((id) => id.toString()));
    discountable = input.lines
      .filter((l) => allowedIds.has(l.productId))
      .reduce((sum, l) => sum + (Number(l.lineTotal) || 0), 0);

    if (discountable <= 0) {
      return {
        valid: false,
        discountAmount: 0,
        freeShipping: false,
        message: 'Coupon not valid for items in your cart',
      };
    }
  }

  // Free shipping coupon
  if (coupon.type === 'FREE_SHIPPING') {
    return { valid: true, discountAmount: 0, freeShipping: true, coupon: coupon.toObject() };
  }

  let discountAmount: number = 0;

  if (coupon.type === 'PERCENTAGE') {
    discountAmount = (discountable * coupon.value) / 100;
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
  const { active, search, page = 1, limit = 20 }: GetCouponsFilters = filters;
  const query: Record<string, unknown> = {};
  if (typeof active === 'boolean') query.active = active;
  if (search) {
    query.$or = [
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const [coupons, total] = await Promise.all([
    Coupon.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Coupon.countDocuments(query),
  ]);
  return { coupons, total, page, limit };
}

export async function getCouponById(id: string): Promise<ICoupon | null> {
  await connectDB();
  return Coupon.findById(id).lean();
}

export async function updateCoupon(id: string, data: Partial<ICoupon>): Promise<ICoupon | null> {
  await connectDB();
  return Coupon.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteCoupon(id: string): Promise<ICoupon | null> {
  await connectDB();
  return Coupon.findByIdAndDelete(id);
}
