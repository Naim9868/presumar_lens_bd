import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';
import { Product } from '@/models/Product';
import Customer from '@/models/Customer';
import { mockOverview } from '@/lib/analytics/mock';
import { parseRangeFromQuery } from '@/lib/analytics/server-range';
import type { OverviewResponse } from '@/types/analytics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const range = parseRangeFromQuery(new URL(req.url));
  const url = new URL(req.url);

  // Optional: only run DB aggregation if explicitly enabled.
  const useDb = url.searchParams.get('source') === 'db';

  if (!useDb) {
    return NextResponse.json(mockOverview(range));
  }

  try {
    await connectDB();
    const from = new Date(range.from);
    const to = new Date(range.to);

    const [orderAgg, productAgg, customerAgg] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
            aov: { $avg: '$totalAmount' },
          },
        },
      ]),
      Product.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          },
        },
      ]),
      Customer.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: null, newCustomers: { $sum: 1 } } },
      ]),
    ]);

    const payload: OverviewResponse = mockOverview(range);
    if (orderAgg[0]) {
      payload.kpis[0].value = Math.round(orderAgg[0].revenue || 0);
      payload.kpis[1].value = orderAgg[0].orders || 0;
      payload.kpis[2].value = Math.round(orderAgg[0].aov || 0);
    }
    if (productAgg[0]) {
      payload.kpis[3].value = productAgg[0].active || productAgg[0].total || 0;
    }
    if (customerAgg[0]) {
      // If you have a "Customers" KPI card, it would be at index 4 in future.
    }

    return NextResponse.json(payload);
  } catch (err) {
    // DB not available — gracefully fall back to mock so the UI never breaks.
    return NextResponse.json(mockOverview(range));
  }
}

