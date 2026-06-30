// Deterministic mock data generator for analytics.
// Same `seed` â†’ same numbers, so charts are stable across reloads.

import type {
  CategorySlice,
  ChannelSlice,
  CohortRow,
  CustomersResponse,
  DateRange,
  DateRangePreset,
  DiscountImpactRow,
  FunnelStep,
  GeoRow,
  HeatmapCell,
  InventoryResponse,
  KpiCardData,
  LtvBucket,
  MarketingResponse,
  MovementPoint,
  OverviewResponse,
  PaymentMethodSlice,
  ProductsResponse,
  RatingSlice,
  RefundPoint,
  ReturnRow,
  SalesResponse,
  StockHealthBucket,
  TopCustomerRow,
  TopProductRow,
  TrafficResponse,
  TrendPoint,
} from '@/types/analytics';
import { addDays, buildDelta, formatCurrency, formatNumber, parseISODate, toISODate } from './format';

// Preserve literal `preset` union when spreading a DateRange.
function withRange(range: DateRange): DateRange {
  return range;
}

// â”€â”€â”€ Tiny seeded PRNG (mulberry32) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randRange(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function bucketDaily(from: string, to: string): { label: string; date: string }[] {
  const out: { label: string; date: string }[] = [];
  let cur = parseISODate(from);
  const end = parseISODate(to);
  while (cur.getTime() <= end.getTime()) {
    const iso = toISODate(cur);
    out.push({
      label: cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      date: iso,
    });
    cur = addDays(cur, 1);
  }
  return out;
}

function seededTrend(
  seed: number,
  from: string,
  to: string,
  opts: {
    baseRevenue: number;
    baseOrders: number;
    baseUnits: number;
    baseCustomers: number;
    growth: number; // 0..1 over the window
  }
): TrendPoint[] {
  const rng = mulberry32(seed);
  const days = bucketDaily(from, to);
  const step = opts.growth / Math.max(1, days.length - 1);
  return days.map((d, i) => {
    const seasonal = 0.85 + 0.3 * Math.sin((i / Math.max(1, days.length - 1)) * Math.PI * 2);
    const noise = 0.85 + rng() * 0.3;
    const grow = 1 + step * i;
    const revenue = Math.round(opts.baseRevenue * seasonal * noise * grow);
    const orders = Math.round(opts.baseOrders * seasonal * noise * grow);
    const units = Math.round(opts.baseUnits * seasonal * noise * grow);
    const customers = Math.round(opts.baseCustomers * seasonal * noise * grow);
    return { ...d, revenue, orders, customers, units };
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Overview
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function mockOverview(range: DateRange): OverviewResponse {
  const trend = seededTrend(7, range.from, range.to, {
    baseRevenue: 420000,
    baseOrders: 95,
    baseUnits: 140,
    baseCustomers: 88,
    growth: 0.18,
  });
  const prev = seededTrend(11, range.from, range.to, {
    baseRevenue: 360000,
    baseOrders: 82,
    baseUnits: 120,
    baseCustomers: 75,
    growth: 0.06,
  });

  const totalRevenue = trend.reduce((s, p) => s + p.revenue, 0);
  const prevRevenue = prev.reduce((s, p) => s + p.revenue, 0);
  const totalOrders = trend.reduce((s, p) => s + p.orders, 0);
  const prevOrders = prev.reduce((s, p) => s + p.orders, 0);
  const totalCustomers = trend.reduce((s, p) => s + p.customers, 0);
  const prevCustomers = prev.reduce((s, p) => s + p.customers, 0);
  const totalUnits = trend.reduce((s, p) => s + p.units, 0);
  const aov = totalOrders ? totalRevenue / totalOrders : 0;
  const prevAov = prevOrders ? prevRevenue / prevOrders : 0;

  const kpis: KpiCardData[] = [
    {
      key: 'revenue',
      label: 'Total Revenue',
      value: totalRevenue,
      display: formatCurrency(totalRevenue),
      iconKey: 'revenue',
      delta: buildDelta(totalRevenue, prevRevenue),
      accent: 'emerald',
      hint: `${formatNumber(totalOrders)} orders`,
    },
    {
      key: 'orders',
      label: 'Total Orders',
      value: totalOrders,
      display: formatNumber(totalOrders),
      iconKey: 'orders',
      delta: buildDelta(totalOrders, prevOrders),
      accent: 'amber',
      hint: `${formatNumber(totalUnits)} units sold`,
    },
    {
      key: 'aov',
      label: 'Avg Order Value',
      value: Math.round(aov),
      display: formatCurrency(Math.round(aov)),
      iconKey: 'aov',
      delta: buildDelta(Math.round(aov), Math.round(prevAov)),
      accent: 'sky',
    },
    {
      key: 'customers',
      label: 'Customers',
      value: totalCustomers,
      display: formatNumber(totalCustomers),
      iconKey: 'customers',
      delta: buildDelta(totalCustomers, prevCustomers),
      accent: 'violet',
    },
  ];

  const categoryShare: CategorySlice[] = [
    { name: 'Prime Lenses', value: 38, color: '#f59e0b' },
    { name: 'Zoom Lenses', value: 28, color: '#3b82f6' },
    { name: 'Macro Lenses', value: 14, color: '#10b981' },
    { name: 'Wide Angle', value: 11, color: '#8b5cf6' },
    { name: 'Accessories', value: 9, color: '#ef4444' },
  ];

  const statusFunnel: FunnelStep[] = [
    { step: 'Placed', count: totalOrders, conversionPct: 100 },
    { step: 'Confirmed', count: Math.round(totalOrders * 0.92), conversionPct: 92 },
    { step: 'Shipped', count: Math.round(totalOrders * 0.78), conversionPct: 78 },
    { step: 'Out for Delivery', count: Math.round(totalOrders * 0.62), conversionPct: 62 },
    { step: 'Delivered', count: Math.round(totalOrders * 0.56), conversionPct: 56 },
  ];

  const recentOrders: OverviewResponse['recentOrders'] = [
    { id: 'ORD-1042', customer: 'John Doe', amount: 1299, status: 'delivered', date: '2026-06-28', paymentMethod: 'COD' },
    { id: 'ORD-1041', customer: 'Jane Smith', amount: 899, status: 'shipped', date: '2026-06-28', paymentMethod: 'SSL' },
    { id: 'ORD-1040', customer: 'Mike Johnson', amount: 2499, status: 'processing', date: '2026-06-27', paymentMethod: 'BKASH' },
    { id: 'ORD-1039', customer: 'Sarah Wilson', amount: 499, status: 'paid', date: '2026-06-27', paymentMethod: 'SSL' },
    { id: 'ORD-1038', customer: 'David Brown', amount: 1599, status: 'delivered', date: '2026-06-26', paymentMethod: 'COD' },
    { id: 'ORD-1037', customer: 'Ayesha Khan', amount: 2199, status: 'in_transit', date: '2026-06-26', paymentMethod: 'NAGAD' },
    { id: 'ORD-1036', customer: 'Rahim Ahmed', amount: 3499, status: 'delivered', date: '2026-06-25', paymentMethod: 'CARD' },
  ];

  const topProducts: TopProductRow[] = [
    { id: 'p1', name: 'Canon 50mm f/1.8 STM', category: 'Prime', brand: 'Canon', sales: 145, revenue: 181250, rating: 4.7, stock: 28 },
    { id: 'p2', name: 'Sony 24-70mm f/2.8 GM', category: 'Zoom', brand: 'Sony', sales: 89, revenue: 222500, rating: 4.9, stock: 12 },
    { id: 'p3', name: 'Nikon 35mm f/1.8 DX', category: 'Prime', brand: 'Nikon', sales: 76, revenue: 95000, rating: 4.6, stock: 41 },
    { id: 'p4', name: 'Fujifilm 23mm f/2', category: 'Prime', brand: 'Fujifilm', sales: 54, revenue: 54000, rating: 4.5, stock: 22 },
    { id: 'p5', name: 'Sigma 85mm f/1.4 Art', category: 'Prime', brand: 'Sigma', sales: 48, revenue: 144000, rating: 4.8, stock: 9 },
  ];

  const acquisitionChannels: ChannelSlice[] = [
    { channel: 'Facebook', orders: 420, revenue: 540000 },
    { channel: 'Google', orders: 380, revenue: 612000 },
    { channel: 'Direct', orders: 290, revenue: 412000 },
    { channel: 'TikTok', orders: 220, revenue: 280000 },
    { channel: 'Email', orders: 110, revenue: 165000 },
    { channel: 'Referral', orders: 70, revenue: 92000 },
  ];

  const liveOrdersTicker: OverviewResponse['liveOrdersTicker'] = [
    { id: 'L-9001', customer: 'Tareq Aziz', amount: 1599, city: 'Dhaka', placedAt: new Date(Date.now() - 60_000).toISOString() },
    { id: 'L-9000', customer: 'Nadia Hossain', amount: 2499, city: 'Chattogram', placedAt: new Date(Date.now() - 180_000).toISOString() },
    { id: 'L-8999', customer: 'Imran Khan', amount: 499, city: 'Sylhet', placedAt: new Date(Date.now() - 320_000).toISOString() },
    { id: 'L-8998', customer: 'Mehnaz Tabassum', amount: 3299, city: 'Khulna', placedAt: new Date(Date.now() - 510_000).toISOString() },
  ];

  return {
    range: withRange(range),
    generatedAt: new Date().toISOString(),
    kpis,
    revenueTrend: trend,
    categoryShare,
    statusFunnel,
    recentOrders,
    topProducts,
    acquisitionChannels,
    liveOrdersTicker,
  };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Sales
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function mockSales(range: DateRange): SalesResponse {
  const trend = seededTrend(13, range.from, range.to, {
    baseRevenue: 380000,
    baseOrders: 88,
    baseUnits: 130,
    baseCustomers: 80,
    growth: 0.22,
  });
  const prev = seededTrend(17, range.from, range.to, {
    baseRevenue: 320000,
    baseOrders: 75,
    baseUnits: 110,
    baseCustomers: 68,
    growth: 0.04,
  });

  const totalRevenue = trend.reduce((s, p) => s + p.revenue, 0);
  const prevRevenue = prev.reduce((s, p) => s + p.revenue, 0);
  const totalOrders = trend.reduce((s, p) => s + p.orders, 0);
  const prevOrders = prev.reduce((s, p) => s + p.orders, 0);
  const totalUnits = trend.reduce((s, p) => s + p.units, 0);
  const aov = totalOrders ? totalRevenue / totalOrders : 0;
  const refunds = Math.round(totalRevenue * 0.034);
  const prevRefunds = Math.round(prevRevenue * 0.041);

  const kpis: KpiCardData[] = [
    { key: 'revenue', label: 'Revenue', value: totalRevenue, display: formatCurrency(totalRevenue), iconKey: 'revenue', delta: buildDelta(totalRevenue, prevRevenue), accent: 'emerald' },
    { key: 'orders', label: 'Orders', value: totalOrders, display: formatNumber(totalOrders), iconKey: 'orders', delta: buildDelta(totalOrders, prevOrders), accent: 'amber' },
    { key: 'aov', label: 'Avg Order Value', value: Math.round(aov), display: formatCurrency(Math.round(aov)), iconKey: 'aov', delta: buildDelta(Math.round(aov), Math.round(prevRevenue / Math.max(1, prevOrders))), accent: 'sky' },
    { key: 'refunds', label: 'Refunds', value: refunds, display: formatCurrency(refunds), iconKey: 'refunds', delta: buildDelta(refunds, prevRefunds), accent: 'rose' },
  ];

  const paymentMethods: PaymentMethodSlice[] = [
    { method: 'COD', orders: Math.round(totalOrders * 0.42), revenue: Math.round(totalRevenue * 0.40), share: 42 },
    { method: 'SSLCommerz', orders: Math.round(totalOrders * 0.28), revenue: Math.round(totalRevenue * 0.30), share: 28 },
    { method: 'bKash', orders: Math.round(totalOrders * 0.18), revenue: Math.round(totalRevenue * 0.18), share: 18 },
    { method: 'Nagad', orders: Math.round(totalOrders * 0.08), revenue: Math.round(totalRevenue * 0.08), share: 8 },
    { method: 'Card', orders: Math.round(totalOrders * 0.04), revenue: Math.round(totalRevenue * 0.04), share: 4 },
  ];

  const coupons = [
    { code: 'LENS20', uses: 142, discount: 89_500, revenue: 612_000 },
    { code: 'FREESHIP', uses: 220, discount: 31_800, revenue: 410_000 },
    { code: 'NEWUSER15', uses: 96, discount: 58_000, revenue: 280_000 },
    { code: 'FLASH50', uses: 38, discount: 41_200, revenue: 156_000 },
    { code: 'WEEKEND10', uses: 72, discount: 22_400, revenue: 188_000 },
  ];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hourlyHeatmap: HeatmapCell[] = [];
  const rng = mulberry32(33);
  days.forEach((d, di) => {
    for (let h = 0; h < 24; h++) {
      const peak = h >= 11 && h <= 22 ? 1 : 0.25;
      const weekend = di === 5 || di === 6 ? 1.2 : 1;
      hourlyHeatmap.push({
        day: d,
        hour: h,
        orders: Math.round(8 * peak * weekend * (0.6 + rng() * 0.8)),
      });
    }
  });

  const refunds_series: RefundPoint[] = trend.map((p, i) => ({
    date: p.date,
    amount: Math.round((p.revenue * (0.025 + (i % 5) * 0.002))),
    count: Math.round(p.orders * (0.025 + (i % 4) * 0.003)),
  }));

  const dailyOrders = trend.map((p) => ({
    date: p.date,
    orders: p.orders,
    revenue: p.revenue,
    units: p.units,
  }));

  return {
    range: withRange(range),
    generatedAt: new Date().toISOString(),
    kpis,
    trend,
    previousTrend: prev,
    paymentMethods,
    coupons,
    hourlyHeatmap,
    refunds: refunds_series,
    dailyOrders,
  };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Inventory
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function mockInventory(range: DateRange): InventoryResponse {
  const rng = mulberry32(43);
  const lowStock = [
    { productId: 'p2', name: 'Sony 24-70mm f/2.8 GM', variantSku: 'LENS-SONY-2470', variantAttributes: [{ key: 'Mount', value: 'E' }], stock: 4, threshold: 10, status: 'in_stock' as const },
    { productId: 'p5', name: 'Sigma 85mm f/1.4 Art', variantSku: 'LENS-SIGMA-85', stock: 2, threshold: 8, status: 'in_stock' as const },
    { productId: 'p8', name: 'Tamron 70-200 f/2.8', variantSku: 'LENS-TAM-70200', stock: 0, threshold: 6, status: 'out_of_stock' as const },
    { productId: 'p11', name: 'Canon RF 50mm f/1.8', variantSku: 'LENS-CAN-RF50', stock: 3, threshold: 12, status: 'in_stock' as const },
    { productId: 'p14', name: 'Sony 85mm f/1.8 FE', variantSku: 'LENS-SONY-85FE', stock: 6, threshold: 10, status: 'in_stock' as const },
    { productId: 'p17', name: 'Tokina 11-16 f/2.8', variantSku: 'LENS-TOK-1116', stock: 1, threshold: 5, status: 'in_stock' as const },
    { productId: 'p19', name: 'Samyang 14mm f/2.8', variantSku: 'LENS-SAM-14', stock: 0, threshold: 4, status: 'out_of_stock' as const },
    { productId: 'p22', name: 'Canon EF 70-200 f/4', variantSku: 'LENS-CAN-70200F4', stock: 5, threshold: 9, status: 'in_stock' as const },
  ];

  const topSellingVariants: TopProductRow[] = [
    { id: 'p1', name: 'Canon 50mm f/1.8 STM', sales: 145, revenue: 181250, stock: 28, rating: 4.7 },
    { id: 'p2', name: 'Sony 24-70mm f/2.8 GM', sales: 89, revenue: 222500, stock: 4, rating: 4.9 },
    { id: 'p3', name: 'Nikon 35mm f/1.8 DX', sales: 76, revenue: 95000, stock: 41, rating: 4.6 },
    { id: 'p5', name: 'Sigma 85mm f/1.4 Art', sales: 48, revenue: 144000, stock: 2, rating: 4.8 },
    { id: 'p6', name: 'Tamron 28-75 f/2.8', sales: 42, revenue: 96600, stock: 18, rating: 4.5 },
  ];

  const deadStock: TopProductRow[] = [
    { id: 'p30', name: 'Canon FD 50mm f/1.4 (legacy)', sales: 0, revenue: 0, stock: 47, rating: 0 },
    { id: 'p31', name: 'Nikon AF 28mm f/2.8D (legacy)', sales: 1, revenue: 4500, stock: 22, rating: 4.1 },
    { id: 'p32', name: 'Pentax 50mm f/2 (legacy)', sales: 0, revenue: 0, stock: 18, rating: 0 },
  ];

  const stockByCategory: CategorySlice[] = [
    { name: 'Prime Lenses', value: 320, color: '#f59e0b' },
    { name: 'Zoom Lenses', value: 240, color: '#3b82f6' },
    { name: 'Macro Lenses', value: 90, color: '#10b981' },
    { name: 'Wide Angle', value: 70, color: '#8b5cf6' },
    { name: 'Accessories', value: 410, color: '#ef4444' },
  ];

  const days = bucketDaily(range.from, range.to);
  const inventoryMovement: MovementPoint[] = days.map((d) => ({
    date: d.date,
    inbound: randRange(rng, 5, 60),
    outbound: randRange(rng, 20, 140),
    reserved: randRange(rng, 0, 30),
  }));

  const stockHealth: StockHealthBucket[] = [
    { bucket: 'healthy', count: 880, value: 11_200_000 },
    { bucket: 'low', count: 64, value: 950_000 },
    { bucket: 'out', count: 22, value: 0 },
    { bucket: 'overstock', count: 38, value: 2_400_000 },
  ];

  const kpis: KpiCardData[] = [
    { key: 'inventory', label: 'Total SKUs', value: 1004, display: formatNumber(1004), iconKey: 'inventory', delta: buildDelta(1004, 962), accent: 'sky' },
    { key: 'lowStock', label: 'Low Stock', value: 64, display: formatNumber(64), iconKey: 'lowStock', delta: buildDelta(64, 48), accent: 'amber' },
    { key: 'outOfStock', label: 'Out of Stock', value: 22, display: formatNumber(22), iconKey: 'lowStock', delta: buildDelta(22, 28), accent: 'rose' },
    { key: 'stockValue', label: 'Stock Value', value: 14_550_000, display: formatCurrency(14_550_000), iconKey: 'revenue', delta: buildDelta(14_550_000, 13_900_000), accent: 'emerald' },
  ];

  return {
    range: withRange(range),
    generatedAt: new Date().toISOString(),
    kpis,
    stockByCategory,
    lowStock,
    topSellingVariants,
    deadStock,
    inventoryMovement,
    stockHealth,
  };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Customers
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function mockCustomers(range: DateRange): CustomersResponse {
  const trend = seededTrend(19, range.from, range.to, {
    baseRevenue: 120_000,
    baseOrders: 28,
    baseUnits: 0,
    baseCustomers: 70,
    growth: 0.28,
  });
  const prev = seededTrend(23, range.from, range.to, {
    baseRevenue: 96_000,
    baseOrders: 22,
    baseUnits: 0,
    baseCustomers: 55,
    growth: 0.05,
  });
  const newCust = trend.reduce((s, p) => s + p.customers, 0);
  const prevNew = prev.reduce((s, p) => s + p.customers, 0);
  const orders = trend.reduce((s, p) => s + p.orders, 0);
  const prevOrders = prev.reduce((s, p) => s + p.orders, 0);
  const revenue = trend.reduce((s, p) => s + p.revenue, 0);
  const prevRevenue = prev.reduce((s, p) => s + p.revenue, 0);
  const ltv = newCust ? revenue / newCust : 0;
  const prevLtv = prevNew ? prevRevenue / prevNew : 0;

  const ltvDistribution: LtvBucket[] = [
    { bucket: 'à§³ 0â€“1k', customers: 1240, revenue: 620_000 },
    { bucket: 'à§³ 1kâ€“5k', customers: 980, revenue: 3_120_000 },
    { bucket: 'à§³ 5kâ€“15k', customers: 420, revenue: 4_200_000 },
    { bucket: 'à§³ 15kâ€“50k', customers: 110, revenue: 3_080_000 },
    { bucket: 'à§³ 50k+', customers: 22, revenue: 1_650_000 },
  ];

  const topCustomers: TopCustomerRow[] = [
    { id: 'c1', name: 'Tanvir Hasan', email: 'tanvir@example.com', orders: 38, totalSpent: 184_500, city: 'Dhaka', joinedAt: '2024-08-12' },
    { id: 'c2', name: 'Sadia Rahman', email: 'sadia@example.com', orders: 27, totalSpent: 142_300, city: 'Chattogram', joinedAt: '2025-01-04' },
    { id: 'c3', name: 'Imtiaz Ahmed', email: 'imtiaz@example.com', orders: 22, totalSpent: 121_900, city: 'Dhaka', joinedAt: '2024-11-22' },
    { id: 'c4', name: 'Rifat Khan', email: 'rifat@example.com', orders: 19, totalSpent: 98_400, city: 'Sylhet', joinedAt: '2025-03-18' },
    { id: 'c5', name: 'Nazia Sultana', email: 'nazia@example.com', orders: 16, totalSpent: 88_700, city: 'Khulna', joinedAt: '2025-02-09' },
    { id: 'c6', name: 'Asif Iqbal', email: 'asif@example.com', orders: 15, totalSpent: 76_200, city: 'Rajshahi', joinedAt: '2024-09-30' },
    { id: 'c7', name: 'Mahmud Hossain', email: 'mahmud@example.com', orders: 13, totalSpent: 71_500, city: 'Barishal', joinedAt: '2025-05-21' },
  ];

  const geographic: GeoRow[] = [
    { region: 'Dhaka', customers: 1820, orders: 2840, revenue: 4_120_000 },
    { region: 'Chattogram', customers: 640, orders: 1010, revenue: 1_540_000 },
    { region: 'Khulna', customers: 320, orders: 480, revenue: 720_000 },
    { region: 'Rajshahi', customers: 280, orders: 410, revenue: 612_000 },
    { region: 'Sylhet', customers: 240, orders: 360, revenue: 540_000 },
    { region: 'Barishal', customers: 160, orders: 220, revenue: 320_000 },
    { region: 'Rangpur', customers: 140, orders: 190, revenue: 280_000 },
    { region: 'Mymensingh', customers: 120, orders: 160, revenue: 230_000 },
  ];

  const cohortRetention: CohortRow[] = [
    { cohort: '2026-01', size: 320, retention: [100, 42, 28, 19, 14] },
    { cohort: '2026-02', size: 280, retention: [100, 38, 24, 17] },
    { cohort: '2026-03', size: 360, retention: [100, 45, 30] },
    { cohort: '2026-04', size: 410, retention: [100, 49] },
    { cohort: '2026-05', size: 460, retention: [100] },
    { cohort: '2026-06', size: 510, retention: [100] },
  ];

  const funnel: FunnelStep[] = [
    { step: 'Visitors', count: 48_200, conversionPct: 100 },
    { step: 'Signups', count: newCust, conversionPct: Math.round((newCust / 48_200) * 100) },
    { step: 'First Order', count: Math.round(newCust * 0.62), conversionPct: 62 },
    { step: 'Repeat Order', count: Math.round(newCust * 0.28), conversionPct: 28 },
    { step: 'VIP (5+ orders)', count: Math.round(newCust * 0.07), conversionPct: 7 },
  ];

  const kpis: KpiCardData[] = [
    { key: 'newCustomers', label: 'New Customers', value: newCust, display: formatNumber(newCust), iconKey: 'customers', delta: buildDelta(newCust, prevNew), accent: 'emerald' },
    { key: 'orders', label: 'Orders', value: orders, display: formatNumber(orders), iconKey: 'orders', delta: buildDelta(orders, prevOrders), accent: 'amber' },
    { key: 'ltv', label: 'Avg LTV', value: Math.round(ltv), display: formatCurrency(Math.round(ltv)), iconKey: 'ltv', delta: buildDelta(Math.round(ltv), Math.round(prevLtv)), accent: 'sky' },
    { key: 'repeatRate', label: 'Repeat Rate', value: 28, display: '28%', iconKey: 'conversion', delta: buildDelta(28, 24), accent: 'violet' },
  ];

  return {
    range: withRange(range),
    generatedAt: new Date().toISOString(),
    kpis,
    acquisitionTrend: trend,
    ltvDistribution,
    topCustomers,
    geographic,
    cohortRetention,
    funnel,
  };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Products
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function mockProducts(range: DateRange): ProductsResponse {
  const topSellers: TopProductRow[] = [
    { id: 'p2', name: 'Sony 24-70mm f/2.8 GM', category: 'Zoom', brand: 'Sony', sales: 89, revenue: 222500, rating: 4.9, stock: 4 },
    { id: 'p1', name: 'Canon 50mm f/1.8 STM', category: 'Prime', brand: 'Canon', sales: 145, revenue: 181250, rating: 4.7, stock: 28 },
    { id: 'p5', name: 'Sigma 85mm f/1.4 Art', category: 'Prime', brand: 'Sigma', sales: 48, revenue: 144000, rating: 4.8, stock: 2 },
    { id: 'p3', name: 'Nikon 35mm f/1.8 DX', category: 'Prime', brand: 'Nikon', sales: 76, revenue: 95000, rating: 4.6, stock: 41 },
    { id: 'p6', name: 'Tamron 28-75 f/2.8', category: 'Zoom', brand: 'Tamron', sales: 42, revenue: 96600, rating: 4.5, stock: 18 },
    { id: 'p7', name: 'Sony 85mm f/1.8 FE', category: 'Prime', brand: 'Sony', sales: 38, revenue: 76000, rating: 4.7, stock: 6 },
    { id: 'p4', name: 'Fujifilm 23mm f/2', category: 'Prime', brand: 'Fujifilm', sales: 54, revenue: 54000, rating: 4.5, stock: 22 },
  ];

  const revenueContribution = [
    { category: 'Prime Lenses', revenue: 612_000, orders: 412, units: 458, share: 41 },
    { category: 'Zoom Lenses', revenue: 388_000, orders: 198, units: 212, share: 26 },
    { category: 'Macro Lenses', revenue: 168_000, orders: 92, units: 102, share: 11 },
    { category: 'Wide Angle', revenue: 152_000, orders: 84, units: 96, share: 10 },
    { category: 'Accessories', revenue: 184_000, orders: 220, units: 580, share: 12 },
  ];

  const ratingsDistribution: RatingSlice[] = [
    { rating: 5, count: 612, share: 48 },
    { rating: 4, count: 422, share: 33 },
    { rating: 3, count: 148, share: 12 },
    { rating: 2, count: 64, share: 5 },
    { rating: 1, count: 28, share: 2 },
  ];

  const returnsByProduct: ReturnRow[] = [
    { productId: 'p1', name: 'Canon 50mm f/1.8 STM', orders: 145, returns: 4, returnRate: 0.028, refundAmount: 5200 },
    { productId: 'p2', name: 'Sony 24-70mm f/2.8 GM', orders: 89, returns: 6, returnRate: 0.067, refundAmount: 15000 },
    { productId: 'p5', name: 'Sigma 85mm f/1.4 Art', orders: 48, returns: 3, returnRate: 0.063, refundAmount: 9000 },
    { productId: 'p8', name: 'Tamron 70-200 f/2.8', orders: 32, returns: 5, returnRate: 0.156, refundAmount: 11200 },
    { productId: 'p3', name: 'Nikon 35mm f/1.8 DX', orders: 76, returns: 2, returnRate: 0.026, refundAmount: 2500 },
    { productId: 'p9', name: 'Canon EF 50mm f/1.8 II', orders: 88, returns: 7, returnRate: 0.080, refundAmount: 4900 },
  ];

  const categoryPerformance = revenueContribution;

  const discountImpact: DiscountImpactRow[] = [
    { bucket: '0%', orders: 612, revenue: 980_000, marginImpact: 0 },
    { bucket: '1-10%', orders: 320, revenue: 480_000, marginImpact: -32_000 },
    { bucket: '11-25%', orders: 188, revenue: 280_000, marginImpact: -52_000 },
    { bucket: '26-50%', orders: 92, revenue: 152_000, marginImpact: -62_000 },
    { bucket: '50%+', orders: 28, revenue: 41_000, marginImpact: -28_000 },
  ];

  const kpis: KpiCardData[] = [
    { key: 'topSeller', label: 'Top Seller Revenue', value: 222_500, display: formatCurrency(222_500), iconKey: 'revenue', delta: buildDelta(222_500, 198_000), accent: 'emerald', hint: 'Sony 24-70mm f/2.8 GM' },
    { key: 'unitsSold', label: 'Units Sold', value: 1448, display: formatNumber(1448), iconKey: 'orders', delta: buildDelta(1448, 1280), accent: 'amber' },
    { key: 'avgRating', label: 'Avg Rating', value: 4.6, display: '4.6 â˜…', iconKey: 'conversion', delta: buildDelta(4.6, 4.4), accent: 'sky' },
    { key: 'returnRate', label: 'Return Rate', value: 5.4, display: '5.4%', iconKey: 'refunds', delta: buildDelta(5.4, 6.2), accent: 'rose' },
  ];

  return {
    range: withRange(range),
    generatedAt: new Date().toISOString(),
    kpis,
    topSellers,
    revenueContribution,
    ratingsDistribution,
    returnsByProduct,
    categoryPerformance,
    discountImpact,
  };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Marketing
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function mockMarketing(range: DateRange): MarketingResponse {
  const campaigns: MarketingResponse['campaigns'] = [
    { id: 'c4', name: 'Google Search â€“ Zoom', channel: 'Google', sent: 0, delivered: 0, opened: 0, clicked: 3_200, converted: 320, revenue: 540_000, status: 'active' },
    { id: 'c5', name: 'Newsletter June', channel: 'Email', sent: 9_400, delivered: 9_100, opened: 3_400, clicked: 720, converted: 110, revenue: 168_000, status: 'completed' },
    { id: 'c6', name: 'Flash Sale 50%', channel: 'SMS', sent: 4_200, delivered: 4_080, opened: 0, clicked: 920, converted: 96, revenue: 144_000, status: 'completed' },
  ];

  const attribution: MarketingResponse['attribution'] = [
    { source: 'facebook', medium: 'paid_social', orders: 412, revenue: 612_000, firstTouch: 248, lastTouch: 188 },
    { source: 'google', medium: 'cpc', orders: 380, revenue: 612_000, firstTouch: 220, lastTouch: 240 },
    { source: 'direct', medium: 'none', orders: 290, revenue: 412_000, firstTouch: 90, lastTouch: 180 },
    { source: 'tiktok', medium: 'paid_social', orders: 220, revenue: 280_000, firstTouch: 142, lastTouch: 96 },
    { source: 'email', medium: 'email', orders: 110, revenue: 165_000, firstTouch: 32, lastTouch: 88 },
    { source: 'referral', medium: 'referral', orders: 70, revenue: 92_000, firstTouch: 24, lastTouch: 46 },
  ];

  const channels: ChannelSlice[] = [
    { channel: 'Paid Social', orders: 632, revenue: 892_000 },
    { channel: 'Paid Search', orders: 380, revenue: 612_000 },
    { channel: 'Email', orders: 188, revenue: 312_000 },
    { channel: 'Direct', orders: 290, revenue: 412_000 },
    { channel: 'Organic', orders: 180, revenue: 248_000 },
    { channel: 'Referral', orders: 70, revenue: 92_000 },
  ];

  const funnel: FunnelStep[] = [
    { step: 'Impressions', count: 480_000, conversionPct: 100 },
    { step: 'Clicks', count: 18_400, conversionPct: 4 },
    { step: 'Sessions', count: 14_200, conversionPct: 3 },
    { step: 'Add to Cart', count: 3_800, conversionPct: 0.8 },
    { step: 'Checkout', count: 1_840, conversionPct: 0.4 },
    { step: 'Purchase', count: 1_240, conversionPct: 0.26 },
  ];

  const topUtm: MarketingResponse['topUtm'] = [
    { utm: 'fb_eid_lens50', visits: 9_200, conversions: 312, revenue: 480_000 },
    { utm: 'g_zoom_search', visits: 6_400, conversions: 188, revenue: 380_000 },
    { utm: 'tt_creator_a', visits: 5_800, conversions: 142, revenue: 220_000 },
    { utm: 'em_june_newsletter', visits: 3_400, conversions: 96, revenue: 168_000 },
    { utm: 'flash50_sms', visits: 920, conversions: 96, revenue: 144_000 },
  ];

  const kpis: KpiCardData[] = [
    { key: 'campaignRevenue', label: 'Campaign Revenue', value: 1_538_000, display: formatCurrency(1_538_000), iconKey: 'revenue', delta: buildDelta(1_538_000, 1_280_000), accent: 'emerald' },
    { key: 'roas', label: 'Blended ROAS', value: 4.2, display: '4.2x', iconKey: 'conversion', delta: buildDelta(4.2, 3.8), accent: 'sky' },
    { key: 'emailsSent', label: 'Emails Sent', value: 51_600, display: formatNumber(51_600), iconKey: 'orders', delta: buildDelta(51_600, 44_200), accent: 'amber' },
    { key: 'newSignups', label: 'Attributed Signups', value: 920, display: formatNumber(920), iconKey: 'customers', delta: buildDelta(920, 720), accent: 'violet' },
  ];

  return {
    range: withRange(range),
    generatedAt: new Date().toISOString(),
    kpis,
    campaigns,
    attribution,
    channels,
    funnel,
    topUtm,
  };
}

export function mockTraffic(range: DateRange): TrafficResponse {
  const channels: TrafficResponse['channels'] = [
    { channel: 'Organic Search', sessions: 18_400, conversions: 412, conversionRate: 2.2, revenue: 612_000 },
    { channel: 'Paid Social', sessions: 14_200, conversions: 388, conversionRate: 2.7, revenue: 580_000 },
    { channel: 'Direct', sessions: 9_800, conversions: 246, conversionRate: 2.5, revenue: 412_000 },
    { channel: 'Paid Search', sessions: 6_400, conversions: 188, conversionRate: 2.9, revenue: 380_000 },
    { channel: 'Email', sessions: 3_400, conversions: 96, conversionRate: 2.8, revenue: 168_000 },
    { channel: 'Referral', sessions: 1_840, conversions: 42, conversionRate: 2.3, revenue: 92_000 },
  ];

  const totalSessions =
    channels.reduce((s, c) => s + c.sessions, 0) || 1;

  const devices: TrafficResponse['devices'] = [
    { device: 'mobile', sessions: 32_400, share: Math.round((32_400 / totalSessions) * 1000) / 10 },
    { device: 'desktop', sessions: 17_900, share: Math.round((17_900 / totalSessions) * 1000) / 10 },
    { device: 'tablet', sessions: 3_740, share: Math.round((3_740 / totalSessions) * 1000) / 10 },
  ];

  const topPages: TrafficResponse['topPages'] = [
    { path: '/', views: 12_400, avgTime: 84 },
    { path: '/products', views: 8_200, avgTime: 132 },
    { path: '/categories/prime-lenses', views: 4_600, avgTime: 96 },
    { path: '/products/canon-50mm-f1-8', views: 3_100, avgTime: 168 },
    { path: '/checkout', views: 2_840, avgTime: 212 },
    { path: '/cart', views: 2_320, avgTime: 64 },
  ];

  const realtime: TrafficResponse['realtime'] = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    // Lighter at night, peaks late morning and evening.
    sessions:
      h < 6
        ? 60 + ((h * 37) % 80)
        : h < 11
          ? 280 + ((h * 113) % 220)
          : h < 15
            ? 520 + ((h * 173) % 360)
            : h < 20
              ? 640 + ((h * 191) % 320)
              : 240 + ((h * 89) % 180),
  }));

  const kpis: KpiCardData[] = [
    {
      key: 'sessions',
      label: 'Sessions',
      value: totalSessions,
      display: formatNumber(totalSessions),
      iconKey: 'orders',
      delta: buildDelta(totalSessions, Math.round(totalSessions * 0.82)),
      accent: 'sky',
    },
    {
      key: 'conversionRate',
      label: 'Conversion Rate',
      value: 2.5,
      display: '2.5%',
      iconKey: 'conversion',
      delta: buildDelta(2.5, 2.2),
      accent: 'emerald',
    },
    {
      key: 'avgSession',
      label: 'Avg Session',
      value: 184,
      display: '3m 04s',
      iconKey: 'revenue',
      delta: buildDelta(184, 168),
      accent: 'amber',
    },
    {
      key: 'bounceRate',
      label: 'Bounce Rate',
      value: 38.4,
      display: '38.4%',
      iconKey: 'refunds',
      delta: buildDelta(38.4, 41.2),
      accent: 'violet',
    },
  ];

  return {
    range: withRange(range),
    generatedAt: new Date().toISOString(),
    kpis,
    channels,
    devices,
    topPages,
    realtime,
  };
}

