import Campaign from '@/models/Campaign';
import MarketingEvent from '@/models/MarketingEvent';
import Attribution from '@/models/Attribution';
import Order from '@/models/Order';
import Audience from '@/models/Audience';
import { nanoid } from 'nanoid';
import { connectDB } from '@/lib/dbConnect';

// ─────────────────────────────────────────────
// Campaigns
// ─────────────────────────────────────────────
export async function createCampaign(data: {
  name: string;
  platform: string;
  objective: string;
  budget: { total: number; daily?: number };
  startDate: string;
  endDate?: string;
  utm?: Record<string, string>;
  description?: string;
}) {
  await connectDB();

  const slug = `${data.name.toLowerCase().replace(/\s+/g, '-')}-${nanoid(4)}`;

  return Campaign.create({
    ...data,
    slug,
    status: 'DRAFT',
    utm: data.utm || {
      source: data.platform,
      medium: 'cpc',
      campaign: slug,
    },
    metrics: { impressions: 0, clicks: 0, ctr: 0, spend: 0, orders: 0, revenue: 0, roas: 0 },
  });
}

export async function getCampaigns(filters: {
  platform?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  await connectDB();
  const { platform, status, page = 1, limit = 20 } = filters;
  const query: Record<string, unknown> = {};
  if (platform) query.platform = platform;
  if (status) query.status = status;

  const [campaigns, total] = await Promise.all([
    Campaign.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Campaign.countDocuments(query),
  ]);
  return { campaigns, total };
}

export async function updateCampaign(id: string, data: Record<string, unknown>) {
  await connectDB();
  return Campaign.findByIdAndUpdate(id, data, { new: true });
}

// ─────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────
export async function getMarketingOverview(filters: { startDate?: string; endDate?: string }) {
  await connectDB();

  const dateRange: Record<string, unknown> = {};
  if (filters.startDate) dateRange.$gte = new Date(filters.startDate);
  if (filters.endDate) dateRange.$lte = new Date(filters.endDate);
  const dateMatch = Object.keys(dateRange).length ? { createdAt: dateRange } : {};

  const [
    totalRevenue,
    totalOrders,
    channelBreakdown,
    eventFunnel,
    topCampaigns,
  ] = await Promise.all([
    // Total revenue from delivered orders in date range
    Order.aggregate([
      { $match: { status: 'DELIVERED', ...dateMatch } },
      { $group: { _id: null, total: { $sum: '$pricing.total' }, count: { $sum: 1 } } },
    ]),

    // Orders by marketing source
    Order.aggregate([
      { $match: { ...dateMatch } },
      { $group: { _id: '$marketing.source', orders: { $sum: 1 }, revenue: { $sum: '$pricing.total' } } },
      { $sort: { revenue: -1 } },
    ]),

    // Event funnel
    MarketingEvent.aggregate([
      { $match: { ...dateMatch } },
      { $group: { _id: '$name', count: { $sum: 1 }, totalValue: { $sum: '$value' } } },
      { $sort: { count: -1 } },
    ]),

    // Attribution by first touch
    Attribution.aggregate([
      { $match: { ...dateMatch } },
      {
        $group: {
          _id: '$firstTouch.source',
          conversions: { $sum: 1 },
          revenue: { $sum: '$conversionValue' },
        },
      },
      { $sort: { revenue: -1 } },
    ]),

    // Top campaigns by revenue
    Campaign.find({ status: 'ACTIVE' }).sort({ 'metrics.revenue': -1 }).limit(5).lean(),
  ]);

  const revenue = totalRevenue[0]?.total || 0;
  const orders = totalRevenue[0]?.count || 0;

  return {
    revenue,
    orders,
    aov: orders > 0 ? revenue / orders : 0,
    channelBreakdown: totalOrders,
    eventFunnel,
    attribution: channelBreakdown,
    topCampaigns,
  };
}

export async function getROAS(filters: { startDate?: string; endDate?: string }) {
  await connectDB();

  // ROAS = Revenue / Ad Spend (grouped by marketing source)
  const dateRange: Record<string, unknown> = {};
  if (filters.startDate) dateRange.$gte = new Date(filters.startDate);
  if (filters.endDate) dateRange.$lte = new Date(filters.endDate);
  const match = Object.keys(dateRange).length ? { createdAt: dateRange } : {};

  const bySource = await Order.aggregate([
    { $match: { status: { $in: ['CONFIRMED', 'DELIVERED'] }, ...match } },
    {
      $group: {
        _id: '$marketing.source',
        revenue: { $sum: '$pricing.total' },
        orders: { $sum: 1 },
        aov: { $avg: '$pricing.total' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  // Merge with campaign spend data
  const campaigns = await Campaign.find({}).lean();
  const spendBySource: Record<string, number> = {};
  campaigns.forEach((c) => {
    spendBySource[c.platform] = (spendBySource[c.platform] || 0) + (c.metrics?.spend || 0);
  });

  return bySource.map((row) => ({
    source: row._id || 'direct',
    revenue: row.revenue,
    orders: row.orders,
    aov: Math.round(row.aov),
    spend: spendBySource[row._id] || 0,
    roas: spendBySource[row._id] ? +(row.revenue / spendBySource[row._id]).toFixed(2) : null,
  }));
}

export async function getSalesChart(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
  await connectDB();

  const groupFormat: Record<string, unknown> = {
    daily: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
    weekly: { $week: '$createdAt' },
    monthly: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
  };

  return Order.aggregate([
    { $match: { status: { $in: ['CONFIRMED', 'DELIVERED'] } } },
    {
      $group: {
        _id: groupFormat[period],
        revenue: { $sum: '$pricing.total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 30 },
  ]);
}

// ─────────────────────────────────────────────
// Audiences
// ─────────────────────────────────────────────
export async function createAudience(data: {
  name: string;
  description?: string;
  rules: { field: string; operator: string; value: unknown }[];
  autoRefresh: boolean;
}) {
  await connectDB();
  return Audience.create({ ...data, customerCount: 0 });
}

export async function getAudiences() {
  await connectDB();
  return Audience.find().sort({ createdAt: -1 }).lean();
}

export async function refreshAudience(audienceId: string) {
  await connectDB();
  const audience = await Audience.findById(audienceId);
  if (!audience) throw new Error('Audience not found');

  // Build MongoDB query from rules
  const query: Record<string, unknown> = {};
  for (const rule of audience.rules) {
    const ops: Record<string, string> = { gt: '$gt', lt: '$lt', eq: '$eq', gte: '$gte', lte: '$lte' };
    if (rule.operator === 'contains') {
      query[rule.field] = { $regex: rule.value, $options: 'i' };
    } else {
      query[rule.field] = { [ops[rule.operator]]: rule.value };
    }
  }

  const count = await Order.countDocuments(query);

  await Audience.findByIdAndUpdate(audienceId, {
    customerCount: count,
    lastRefreshed: new Date(),
  });

  return count;
}
