import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import {
  getCoupons,
  createCoupon,
} from '@/services/coupon.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import Coupon from '@/models/Coupon';

// GET /api/admin/coupons — list with filters + stats
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const sp = req.nextUrl.searchParams;

    const activeParam = sp.get('active');
    const active =
      activeParam === null ? undefined : activeParam === 'true';

    const result = await getCoupons({
      active,
      search: sp.get('search') || undefined,
      page: Number(sp.get('page') || 1),
      limit: Number(sp.get('limit') || 50),
    });

    const [totalCoupons, activeCoupons, totalUsedAgg, totalSavingsAgg] =
      await Promise.all([
        Coupon.countDocuments(),
        Coupon.countDocuments({ active: true }),
        Coupon.aggregate([
          { $group: { _id: null, total: { $sum: '$usedCount' } } },
        ]),
        Coupon.aggregate([
          {
            $project: {
              savings: {
                $cond: [
                  { $eq: ['$type', 'FIXED'] },
                  { $multiply: ['$value', '$usedCount'] },
                  {
                    $cond: [
                      { $eq: ['$type', 'PERCENTAGE'] },
                      {
                        $multiply: [
                          { $divide: ['$value', 100] },
                          '$usedCount',
                          { $ifNull: ['$maxDiscount', 1000] },
                        ],
                      },
                      0,
                    ],
                  },
                ],
              },
            },
          },
          { $group: { _id: null, total: { $sum: '$savings' } } },
        ]),
      ]);

    return successResponse({
      coupons: result.coupons,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit),
      },
      stats: {
        total: totalCoupons,
        active: activeCoupons,
        used: totalUsedAgg[0]?.total ?? 0,
        savings: Math.round(totalSavingsAgg[0]?.total ?? 0),
      },
    });
  } catch (err) {
    console.error('[GET /api/admin/coupons]', err);
    return errorResponse('Failed to fetch coupons', 500);
  }
}

// POST /api/admin/coupons — create coupon
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.code || !body.type || body.value === undefined) {
      return errorResponse('Code, type and value are required');
    }

    if (!['FIXED', 'PERCENTAGE', 'FREE_SHIPPING'].includes(body.type)) {
      return errorResponse('Invalid coupon type');
    }

    if (body.type !== 'FREE_SHIPPING' && Number(body.value) <= 0) {
      return errorResponse('Value must be greater than 0');
    }

    if (body.type === 'PERCENTAGE' && Number(body.value) > 100) {
      return errorResponse('Percentage value cannot exceed 100');
    }

    const exists = await Coupon.findOne({
      code: String(body.code).toUpperCase(),
    });
    if (exists) {
      return errorResponse('Coupon code already exists');
    }

    const coupon = await createCoupon({
      code: String(body.code).toUpperCase(),
      type: body.type,
      value: Number(body.value),
      minOrder: body.minOrder ? Number(body.minOrder) : undefined,
      maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : undefined,
      usageLimit: body.usageLimit ? Number(body.usageLimit) : undefined,
      perUserLimit: body.perUserLimit
        ? Number(body.perUserLimit)
        : undefined,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      active: body.active !== false,
      description: body.description,
      allowedCategories: body.allowedCategories || [],
      allowedProducts: body.allowedProducts || [],
      allowedUsers: body.allowedUsers || [],
    });

    return successResponse({ coupon }, 201);
  } catch (err: any) {
    console.error('[POST /api/admin/coupons]', err);
    if (err?.code === 11000) {
      return errorResponse('Coupon code already exists', 409);
    }
    return errorResponse('Failed to create coupon', 500);
  }
}