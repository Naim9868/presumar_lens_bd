// ============================================================================
// Centralized Analytics Types
// ----------------------------------------------------------------------------
// All shapes used across analytics pages, APIs, and adapters live here so
// switching from mock → real data is a single config change.
// ============================================================================

export type DateRangePreset =
  | 'today'
  | '7d'
  | '30d'
  | '90d'
  | 'custom';

export interface DateRange {
  /** ISO string (yyyy-mm-dd) */
  from: string;
  /** ISO string (yyyy-mm-dd) */
  to: string;
  preset: DateRangePreset;
  /** When true, the API should also compute a `previous` window of equal length. */
  comparePrevious: boolean;
}

export interface TrendPoint {
  /** Bucket label — e.g. "Jan 12", "2026-06-28" */
  label: string;
  /** ISO timestamp bucket start */
  date: string;
  revenue: number;
  orders: number;
  customers: number;
  units: number;
}

export interface KpiDelta {
  current: number;
  previous: number;
  /** percent change vs previous period — null when previous === 0 */
  changePct: number | null;
  trend: 'up' | 'down' | 'flat';
}

export interface KpiCardData {
  key: string;
  label: string;
  value: number;
  /** Pre-formatted display string (e.g. "৳ 1,24,567") */
  display: string;
  iconKey: KpiIconKey;
  delta: KpiDelta;
  hint?: string;
  /** Optional accent color token (e.g. "amber", "emerald", "rose"). */
  accent?: string;
}

export type KpiIconKey =
  | 'revenue'
  | 'orders'
  | 'aov'
  | 'customers'
  | 'products'
  | 'inventory'
  | 'lowStock'
  | 'refunds'
  | 'conversion'
  | 'ltv';

// ─────────────────────────────────────────────────────────────────────────────
// Overview
// ─────────────────────────────────────────────────────────────────────────────

export interface OverviewResponse {
  range: DateRange;
  generatedAt: string;
  kpis: KpiCardData[];
  revenueTrend: TrendPoint[];
  categoryShare: CategorySlice[];
  statusFunnel: FunnelStep[];
  recentOrders: RecentOrderRow[];
  topProducts: TopProductRow[];
  acquisitionChannels: ChannelSlice[];
  liveOrdersTicker: LiveOrderEvent[];
}

export interface CategorySlice {
  name: string;
  value: number;
  color: string;
}

export interface FunnelStep {
  step: string;
  count: number;
  conversionPct: number;
}

export interface RecentOrderRow {
  id: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
  paymentMethod?: string;
}

export interface TopProductRow {
  id: string;
  name: string;
  category?: string;
  brand?: string;
  sales: number;
  revenue: number;
  rating?: number;
  stock?: number;
}

export interface ChannelSlice {
  channel: string;
  orders: number;
  revenue: number;
}

export interface LiveOrderEvent {
  id: string;
  customer: string;
  amount: number;
  city?: string;
  placedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sales
// ─────────────────────────────────────────────────────────────────────────────

export interface SalesResponse {
  range: DateRange;
  generatedAt: string;
  kpis: KpiCardData[];
  trend: TrendPoint[];
  previousTrend?: TrendPoint[];
  paymentMethods: PaymentMethodSlice[];
  coupons: CouponSlice[];
  hourlyHeatmap: HeatmapCell[];
  refunds: RefundPoint[];
  dailyOrders: DailyOrdersRow[];
}

export interface PaymentMethodSlice {
  method: string;
  orders: number;
  revenue: number;
  share: number;
}

export interface CouponSlice {
  code: string;
  uses: number;
  discount: number;
  revenue: number;
}

export interface HeatmapCell {
  day: string;
  hour: number;
  orders: number;
}

export interface RefundPoint {
  date: string;
  amount: number;
  count: number;
}

export interface DailyOrdersRow {
  date: string;
  orders: number;
  revenue: number;
  units: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inventory
// ─────────────────────────────────────────────────────────────────────────────

export interface InventoryResponse {
  range: DateRange;
  generatedAt: string;
  kpis: KpiCardData[];
  stockByCategory: CategorySlice[];
  lowStock: LowStockRow[];
  topSellingVariants: TopProductRow[];
  deadStock: TopProductRow[];
  inventoryMovement: MovementPoint[];
  stockHealth: StockHealthBucket[];
}

export interface LowStockRow {
  productId: string;
  name: string;
  variantSku?: string;
  variantAttributes?: { key: string; value: string }[];
  stock: number;
  threshold: number;
  status: 'in_stock' | 'out_of_stock' | 'discontinued';
}

export interface MovementPoint {
  date: string;
  inbound: number;
  outbound: number;
  reserved: number;
}

export interface StockHealthBucket {
  bucket: 'healthy' | 'low' | 'out' | 'overstock';
  count: number;
  value: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Customers
// ─────────────────────────────────────────────────────────────────────────────

export interface CustomersResponse {
  range: DateRange;
  generatedAt: string;
  kpis: KpiCardData[];
  acquisitionTrend: TrendPoint[];
  ltvDistribution: LtvBucket[];
  topCustomers: TopCustomerRow[];
  geographic: GeoRow[];
  cohortRetention: CohortRow[];
  funnel: FunnelStep[];
}

export interface LtvBucket {
  bucket: string;
  customers: number;
  revenue: number;
}

export interface TopCustomerRow {
  id: string;
  name: string;
  email: string;
  orders: number;
  totalSpent: number;
  city?: string;
  joinedAt: string;
}

export interface GeoRow {
  region: string;
  customers: number;
  orders: number;
  revenue: number;
}

export interface CohortRow {
  cohort: string; // "2026-01"
  size: number;
  /** retention % per month index 0..n (index 0 is the signup month) */
  retention: number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductsResponse {
  range: DateRange;
  generatedAt: string;
  kpis: KpiCardData[];
  topSellers: TopProductRow[];
  revenueContribution: CategoryContribution[];
  ratingsDistribution: RatingSlice[];
  returnsByProduct: ReturnRow[];
  categoryPerformance: CategoryContribution[];
  discountImpact: DiscountImpactRow[];
}

export interface CategoryContribution {
  category: string;
  revenue: number;
  orders: number;
  units: number;
  share: number;
}

export interface RatingSlice {
  rating: number; // 1..5
  count: number;
  share: number;
}

export interface ReturnRow {
  productId: string;
  name: string;
  orders: number;
  returns: number;
  returnRate: number; // 0..1
  refundAmount: number;
}

export interface DiscountImpactRow {
  bucket: '0%' | '1-10%' | '11-25%' | '26-50%' | '50%+';
  orders: number;
  revenue: number;
  marginImpact: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Marketing
// ─────────────────────────────────────────────────────────────────────────────

export interface MarketingResponse {
  range: DateRange;
  generatedAt: string;
  kpis: KpiCardData[];
  campaigns: CampaignRow[];
  attribution: AttributionRow[];
  channels: ChannelSlice[];
  funnel: FunnelStep[];
  topUtm: UtmRow[];
}

export interface CampaignRow {
  id: string;
  name: string;
  channel: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number;
  status: 'active' | 'scheduled' | 'completed' | 'paused';
}

export interface AttributionRow {
  source: string;
  medium: string;
  orders: number;
  revenue: number;
  firstTouch: number;
  lastTouch: number;
}

export interface UtmRow {
  utm: string;
  visits: number;
  conversions: number;
  revenue: number;
}

export interface TrafficChannelRow {
  channel: string;
  sessions: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
}

export interface TrafficDeviceRow {
  device: 'desktop' | 'mobile' | 'tablet';
  sessions: number;
  share: number;
}

export interface TrafficPageRow {
  path: string;
  views: number;
  avgTime: number;
}

export interface TrafficResponse {
  range: DateRange;
  generatedAt: string;
  kpis: KpiCardData[];
  channels: TrafficChannelRow[];
  devices: TrafficDeviceRow[];
  topPages: TrafficPageRow[];
  /** Last 24h session buckets (one entry per hour). */
  realtime: { hour: number; sessions: number }[];
}
