import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { mockProducts } from '@/lib/analytics/mock';
import { parseRangeFromQuery } from '@/lib/analytics/server-range';
import type { ProductsResponse } from '@/types/analytics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const range = parseRangeFromQuery(new URL(req.url));
  const url = new URL(req.url);
  const useDb = url.searchParams.get('source') === 'db';

  if (!useDb) return NextResponse.json(mockProducts(range));

  try {
    await connectDB();

    const [top, categoryAgg] = await Promise.all([
      Product.find({ status: 'active' })
        .sort({ 'ratings.count': -1, sold: -1 })
        .limit(10)
        .select('name price sold ratings')
        .lean(),
      Product.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$category',
            units: { $sum: { $ifNull: ['$sold', 0] } },
            revenue: { $sum: { $multiply: ['$price', { $ifNull: ['$sold', 0] }] } },
          },
        },
      ]),
    ]);

    const payload: ProductsResponse = mockProducts(range);
    if (top.length) {
      payload.topSellers = top.map((p: any) => ({
        id: String(p._id),
        name: p.name,
        sales: p.sold || 0,
        revenue: Math.round((p.sold || 0) * (p.price || 0)),
        rating: p.ratings?.average || 0,
      }));
    }
    if (categoryAgg.length) {
      const total = categoryAgg.reduce((s: number, c: any) => s + (c.revenue || 0), 0) || 1;
      payload.categoryPerformance = categoryAgg.map((c: any) => ({
        category: c._id,
        units: c.units,
        revenue: Math.round(c.revenue),
        orders: c.orders ?? c.units ?? 0,
        share: Math.round((c.revenue / total) * 1000) / 10,
      }));
    }
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(mockProducts(range));
  }
}
