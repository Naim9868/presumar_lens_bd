import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';
import { mockMarketing } from '@/lib/analytics/mock';
import { parseRangeFromQuery } from '@/lib/analytics/server-range';
import type { MarketingResponse } from '@/types/analytics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const range = parseRangeFromQuery(new URL(req.url));
  const url = new URL(req.url);
  const useDb = url.searchParams.get('source') === 'db';

  if (!useDb) return NextResponse.json(mockMarketing(range));

  try {
    await connectDB();
    const from = new Date(range.from);
    const to = new Date(range.to);

    const [channels, utm] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: '$source',
            orders: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: { source: '$source', medium: '$utmMedium' },
            orders: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 20 },
      ]),
    ]);

    const payload: MarketingResponse = mockMarketing(range);
    if (channels.length) {
      const total = channels.reduce((s: number, c: any) => s + (c.revenue || 0), 0) || 1;
      payload.channels = channels.map((c: any) => ({
        channel: c._id || 'Direct',
        orders: c.orders,
        revenue: Math.round(c.revenue),
        share: Math.round((c.revenue / total) * 1000) / 10,
      }));
    }
    if (utm.length) {
      payload.topUtm = utm.map((u: any) => ({
        utm: [u._id?.source, u._id?.medium].filter(Boolean).join(' / ') || '—',
        visits: u.visits ?? u.orders ?? 0,
        conversions: u.conversions ?? u.orders ?? 0,
        revenue: Math.round(u.revenue || 0),
      }));
    }
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(mockMarketing(range));
  }
}
