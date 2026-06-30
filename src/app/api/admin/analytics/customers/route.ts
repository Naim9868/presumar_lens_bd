import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Customer from '@/models/Customer';
import Order from '@/models/Order';
import { mockCustomers } from '@/lib/analytics/mock';
import { parseRangeFromQuery } from '@/lib/analytics/server-range';
import type { CustomersResponse } from '@/types/analytics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const range = parseRangeFromQuery(new URL(req.url));
  const url = new URL(req.url);
  const useDb = url.searchParams.get('source') === 'db';

  if (!useDb) return NextResponse.json(mockCustomers(range));

  try {
    await connectDB();
    const from = new Date(range.from);
    const to = new Date(range.to);

    const [acq, geo, top] = await Promise.all([
      Customer.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            newCustomers: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Customer.aggregate([
        { $group: { _id: '$address.division', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: '$customer',
            orders: { $sum: 1 },
            ltv: { $sum: '$totalAmount' },
          },
        },
        { $sort: { ltv: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const payload: CustomersResponse = mockCustomers(range);
    payload.acquisitionTrend = acq.map((d: any) => ({
      date: d._id,
      value: d.newCustomers,
    })) as any;
    payload.geographic = geo.map((g: any) => ({
      region: g._id || 'Unknown',
      customers: g.count,
      orders: g.count,
      revenue: 0,
    }));
    payload.topCustomers = top.map((t: any, idx: number) => ({
      id: t._id ? String(t._id) : `cust-${idx}`,
      name: t._id?.name || `Customer ${idx + 1}`,
      email: t._id?.email || '',
      orders: t.orders,
      totalSpent: Math.round(t.ltv),
      city: t._id?.city || '',
      joinedAt: '',
    }));
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(mockCustomers(range));
  }
}
