// Single switch between mock and api data sources.
// Toggle via env var NEXT_PUBLIC_ANALYTICS_SOURCE=mock|api (default mock).

import {
  mockCustomers,
  mockInventory,
  mockMarketing,
  mockOverview,
  mockProducts,
  mockSales,
  mockTraffic,
} from './mock';
import type {
  CustomersResponse,
  DateRange,
  InventoryResponse,
  MarketingResponse,
  OverviewResponse,
  ProductsResponse,
  SalesResponse,
  TrafficResponse,
} from '@/types/analytics';

export type AnalyticsSource = 'mock' | 'api';

const SOURCE: AnalyticsSource =
  (process.env.NEXT_PUBLIC_ANALYTICS_SOURCE as AnalyticsSource) || 'mock';

export const analyticsSource = SOURCE;

function qs(range: DateRange): string {
  const p = new URLSearchParams({
    from: range.from,
    to: range.to,
    preset: range.preset,
    compare: range.comparePrevious ? '1' : '0',
  });
  return p.toString();
}

async function apiGet<T>(path: string, range: DateRange): Promise<T> {
  const res = await fetch(`/api/admin/analytics/${path}?${qs(range)}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Analytics API failed: ${res.status}`);
  const json = await res.json();
  return (json.data || json) as T;
}

export async function getOverview(range: DateRange): Promise<OverviewResponse> {
  if (SOURCE === 'api') return apiGet<OverviewResponse>('overview', range);
  return mockOverview(range);
}

export async function getSales(range: DateRange): Promise<SalesResponse> {
  if (SOURCE === 'api') return apiGet<SalesResponse>('sales', range);
  return mockSales(range);
}

export async function getOrders(range: DateRange): Promise<OverviewResponse> {
  // Orders reuses overview aggregation; can be expanded later.
  if (SOURCE === 'api') return apiGet<OverviewResponse>('orders', range);
  return mockOverview(range);
}

export async function getInventory(range: DateRange): Promise<InventoryResponse> {
  if (SOURCE === 'api') return apiGet<InventoryResponse>('inventory', range);
  return mockInventory(range);
}

export async function getCustomers(range: DateRange): Promise<CustomersResponse> {
  if (SOURCE === 'api') return apiGet<CustomersResponse>('customers', range);
  return mockCustomers(range);
}

export async function getProducts(range: DateRange): Promise<ProductsResponse> {
  if (SOURCE === 'api') return apiGet<ProductsResponse>('products', range);
  return mockProducts(range);
}

export async function getMarketing(range: DateRange): Promise<MarketingResponse> {
  if (SOURCE === 'api') return apiGet<MarketingResponse>('marketing', range);
  return mockMarketing(range);
}

export async function getTraffic(range: DateRange): Promise<TrafficResponse> {
  if (SOURCE === 'api') return apiGet<TrafficResponse>('traffic', range);
  return mockTraffic(range);
}