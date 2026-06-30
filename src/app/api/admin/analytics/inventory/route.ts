import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import { Product } from '@/models/Product';
import { mockInventory } from '@/lib/analytics/mock';
import { parseRangeFromQuery } from '@/lib/analytics/server-range';
import type { InventoryResponse } from '@/types/analytics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const range = parseRangeFromQuery(new URL(req.url));
  const url = new URL(req.url);
  const useDb = url.searchParams.get('source') === 'db';

  if (!useDb) return NextResponse.json(mockInventory(range));

  try {
    await connectDB();

    const [low, top, categoryAgg] = await Promise.all([
      Product.find({ $expr: { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', 5] }] } })
        .sort({ stock: 1 })
        .limit(20)
        .lean(),
      Product.find({ status: 'active' })
        .sort({ sold: -1 })
        .limit(10)
        .select('name variants sold')
        .lean(),
      Product.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$category',
            units: { $sum: '$stock' },
            value: { $sum: { $multiply: ['$stock', '$price'] } },
          },
        },
      ]),
    ]);

    const payload: InventoryResponse = mockInventory(range);
    if (low.length) {
      payload.lowStock = low.map((p: any) => {
        const stock: number = p.stock ?? 0;
        const threshold: number = p.lowStockThreshold || 5;
        const status: 'in_stock' | 'out_of_stock' | 'discontinued' =
          stock <= 0
            ? 'out_of_stock'
            : p.status === 'discontinued'
            ? 'discontinued'
            : 'in_stock';
        return {
          productId: String(p._id),
          name: p.name,
          variantSku: p.sku || String(p._id),
          stock,
          threshold,
          status,
        };
      });
    }
    if (top.length) {
      payload.topSellingVariants = top.map((p: any) => ({
        id: String(p._id),
        name: p.name,
        sales: p.sold || 0,
        revenue: p.revenue || 0,
        stock: p.stock,
      }));
    }
    if (categoryAgg.length) {
      const palette = [
        '#6366f1',
        '#f59e0b',
        '#10b981',
        '#ef4444',
        '#8b5cf6',
        '#06b6d4',
        '#f97316',
        '#22c55e',
        '#ec4899',
        '#14b8a6',
      ];
      payload.stockByCategory = categoryAgg.map((c: any, i: number) => ({
        name: c._id || 'Uncategorized',
        value: Math.round(c.value),
        color: palette[i % palette.length],
      }));
    }
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(mockInventory(range));
  }
}
