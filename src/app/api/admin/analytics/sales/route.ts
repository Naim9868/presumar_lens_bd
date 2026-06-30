import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';
import { mockSales } from '@/lib/analytics/mock';
import { parseRangeFromQuery } from '@/lib/analytics/server-range';
import type { SalesResponse } from '@/types/analytics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const range = parseRangeFromQuery(new URL(req.url));
  const url = new URL(req.url);
  const useDb = url.searchParams.get('source') === 'db';

  if (!useDb) return NextResponse.json(mockSales(range));

  try {
    await connectDB();
    const from = new Date(range.from);
    const to = new Date(range.to);

    const [daily, methods, coupons] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: '$paymentMethod',
            revenue: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to }, couponCode: { $ne: null } } },
        {
          $group: {
            _id: '$couponCode',
            usage: { $sum: 1 },
            discount: { $sum: '$discount' },
          },
        },
        { $sort: { usage: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const payload: SalesResponse = mockSales(range);
    payload.trend = daily.map((d: any) => ({
      date: String(d._id),
      label: String(d._id),
      revenue: Math.round(d.revenue || 0),
      orders: d.orders || 0,
      customers: d.customers ?? d.orders ?? 0,
      units: d.units ?? d.orders ?? 0,
    }));
    if (methods.length) {
      const totalMethodRevenue = methods.reduce(
        (s: number, m: any) => s + (m.revenue || 0),
        0,
      ) || 1;
      payload.paymentMethods = methods.map((m: any) => ({
        method: m._id || 'unknown',
        orders: m.count || m.orders || 0,
        revenue: Math.round(m.revenue || 0),
        share: Math.round(((m.revenue || 0) / totalMethodRevenue) * 1000) / 10,
      }));
    }
    if (coupons.length) {
      payload.coupons = coupons.map((c: any) => ({
        code: c._id,
        uses: c.usage ?? c.uses ?? 0,
        discount: Math.round(c.discount || 0),
        revenue: Math.round(c.revenue || 0),
      }));
    }
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(mockSales(range));
  }
}
