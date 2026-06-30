import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';
import { mockOverview } from '@/lib/analytics/mock';
import { parseRangeFromQuery } from '@/lib/analytics/server-range';
import type { OverviewResponse } from '@/types/analytics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Orders endpoint reuses the overview shape (recentOrders + statusFunnel + liveOrdersTicker).
export async function GET(req: NextRequest) {
  const range = parseRangeFromQuery(new URL(req.url));
  const url = new URL(req.url);
  const useDb = url.searchParams.get('source') === 'db';

  if (!useDb) return NextResponse.json(mockOverview(range));

  try {
    await connectDB();
    const from = new Date(range.from);
    // range.to is a date-only string ("2026-06-29") that JS parses as UTC midnight.
    // Extend to end-of-day so orders created later today are included.
    const to = new Date(range.to);
    to.setUTCHours(23, 59, 59, 999);

    const [recent, funnel] = await Promise.all([
      Order.find({ createdAt: { $gte: from, $lte: to } })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderId customer totalAmount pricing shipping status createdAt')
        .lean(),
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const displayName = (o: any) => o.customer?.name || o.shipping?.name || 'Guest';
    const displayAmount = (o: any) =>
      Math.round(o.totalAmount || o.pricing?.total || 0);
    const payload: OverviewResponse = mockOverview(range);
    const recentMapped = recent.map((o: any) => ({
      id: o.orderId,
      customer: displayName(o),
      amount: displayAmount(o),
      status: o.status,
      date: o.createdAt,
    }));
    payload.recentOrders = recentMapped;
    // Also feed the live ticker from the real recent orders so polling shows real data.
    payload.liveOrdersTicker = recent.map((o: any) => ({
      id: o.orderId,
      customer: displayName(o),
      amount: displayAmount(o),
      city: o.shipping?.city,
      placedAt: (o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt)).toISOString(),
    }));
    const baseCount = funnel.length ? Number(funnel[0].count) || 0 : 0;
    payload.statusFunnel = funnel.map((f: any) => {
      const count = Number(f.count) || 0;
      return {
        step: String(f._id ?? ''),
        count,
        conversionPct: baseCount > 0 ? Math.round((count / baseCount) * 100) : 0,
      };
    });
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(mockOverview(range));
  }
}
