import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/dbConnect';
import Order from '@/models/Order';
import { Product } from '@/models/Product';
import Customer from '@/models/Customer';
import { mockOverview } from '@/lib/analytics/mock';
import { parseRangeFromQuery } from '@/lib/analytics/server-range';
import type { OverviewResponse } from '@/types/analytics';
import { buildDelta, formatCurrency, formatNumber } from '@/lib/analytics/format';

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
    to.setUTCHours(23, 59, 59, 999);

    const [orderAgg, productAgg, customerAgg, daily, recent, funnel] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$pricing.total' },
            orders: { $sum: 1 },
            aov: { $avg: '$pricing.total' },
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
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$pricing.total' },
            orders: { $sum: 1 },
            units: { $sum: { $sum: '$items.quantity' } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.find({ createdAt: { $gte: from, $lte: to } })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderId pricing shipping status paymentMethod createdAt')
        .lean(),
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const payload: OverviewResponse = mockOverview(range);
    payload.categoryShare = [];
    payload.topProducts = [];
    payload.acquisitionChannels = [];
    if (orderAgg[0]) {
      const revenue = Math.round(orderAgg[0].revenue || 0);
      const orders = orderAgg[0].orders || 0;
      const aov = Math.round(orderAgg[0].aov || 0);
      payload.kpis[0] = {
        ...payload.kpis[0],
        value: revenue,
        display: formatCurrency(revenue),
        hint: `${formatNumber(orders)} orders`,
        delta: buildDelta(revenue, 0),
      };
      payload.kpis[1] = {
        ...payload.kpis[1],
        value: orders,
        display: formatNumber(orders),
        hint: 'Orders in selected period',
        delta: buildDelta(orders, 0),
      };
      payload.kpis[2] = {
        ...payload.kpis[2],
        value: aov,
        display: formatCurrency(aov),
        delta: buildDelta(aov, 0),
      };
    }
    if (productAgg[0]) {
      payload.kpis[3].value = productAgg[0].active || productAgg[0].total || 0;
    }
    const customers = customerAgg[0]?.newCustomers || 0;
    payload.kpis[3] = {
      ...payload.kpis[3],
      value: customers,
      display: formatNumber(customers),
      hint: 'New customers in selected period',
      delta: buildDelta(customers, 0),
    };
    payload.revenueTrend = daily.map((row) => ({
      date: String(row._id),
      label: String(row._id),
      revenue: Math.round(row.revenue || 0),
      orders: row.orders || 0,
      customers: row.orders || 0,
      units: row.units || 0,
    }));
    payload.recentOrders = recent.map((order) => ({
      id: order.orderId,
      customer: order.shipping?.name || 'Guest',
      amount: Math.round(order.pricing?.total || 0),
      status: order.status,
      date: order.createdAt.toISOString(),
      paymentMethod: order.paymentMethod,
    }));
    payload.liveOrdersTicker = recent.slice(0, 8).map((order) => ({
      id: order.orderId,
      customer: order.shipping?.name || 'Guest',
      amount: Math.round(order.pricing?.total || 0),
      city: order.shipping?.city,
      placedAt: order.createdAt.toISOString(),
    }));
    const totalOrders = orderAgg[0]?.orders || 0;
    payload.statusFunnel = funnel.map((row) => ({
      step: String(row._id || 'UNKNOWN'),
      count: row.count || 0,
      conversionPct: totalOrders ? Math.round((row.count / totalOrders) * 100) : 0,
    }));

    return NextResponse.json(payload);
  } catch (err) {
    console.error('[GET /api/admin/analytics/overview]', err);
    return NextResponse.json({ error: 'Failed to load overview analytics' }, { status: 500 });
  }
}
