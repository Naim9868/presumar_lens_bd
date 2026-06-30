'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { DateRange, DateRangePreset, LiveOrderEvent } from '@/types/analytics';
import { rangeForPreset } from '@/lib/analytics/format';
import {
  analyticsSource,
  getCustomers,
  getInventory,
  getMarketing,
  getOrders,
  getOverview,
  getProducts,
  getSales,
  getTraffic,
} from '@/lib/analytics/adapter';
import type {
  CustomersResponse,
  InventoryResponse,
  MarketingResponse,
  OverviewResponse,
  ProductsResponse,
  SalesResponse,
  TrafficResponse,
} from '@/types/analytics';

type RefreshStrategy = 'manual' | 'slow' | 'live';

interface AnalyticsContextValue {
  source: 'mock' | 'api';
  range: DateRange;
  setPreset: (preset: DateRangePreset) => void;
  setCustomRange: (from: string, to: string) => void;
  toggleCompare: () => void;
  // Data slices
  overview: OverviewResponse | null;
  sales: SalesResponse | null;
  customers: CustomersResponse | null;
  inventory: InventoryResponse | null;
  products: ProductsResponse | null;
  marketing: MarketingResponse | null;
  traffic: TrafficResponse | null;
  recentOrdersTicker: LiveOrderEvent[];
  loading: boolean;
  refresh: () => Promise<void>;
  refreshKey: number;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

const POLL = {
  // Avoid realtime chart rendering — page-level pulls only.
  slow: 45_000, // revenue-like pages
  live: 15_000, // inventory / overview ticker
};

export function AnalyticsProvider({
  children,
  strategy = 'slow',
}: {
  children: React.ReactNode;
  strategy?: RefreshStrategy;
}) {
  const [preset, setPresetState] = useState<DateRangePreset>('30d');
  const [custom, setCustom] = useState<{ from: string; to: string } | undefined>();
  const [comparePrevious, setComparePrevious] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const range: DateRange = useMemo(() => {
    const r = rangeForPreset(preset, custom, comparePrevious);
    return {
      from: r.from,
      to: r.to,
      preset: r.preset,
      comparePrevious: r.comparePrevious,
    };
  }, [preset, custom, comparePrevious]);

  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [sales, setSales] = useState<SalesResponse | null>(null);
  const [customers, setCustomers] = useState<CustomersResponse | null>(null);
  const [inventory, setInventory] = useState<InventoryResponse | null>(null);
  const [products, setProducts] = useState<ProductsResponse | null>(null);
  const [marketing, setMarketing] = useState<MarketingResponse | null>(null);
  const [traffic, setTraffic] = useState<TrafficResponse | null>(null);
  const [ticker, setTicker] = useState<LiveOrderEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, sl, cu, inv, pr, mk, tr, ord] = await Promise.all([
        getOverview(range),
        getSales(range),
        getCustomers(range),
        getInventory(range),
        getProducts(range),
        getMarketing(range),
        getTraffic(range),
        getOrders(range),
      ]);
      setOverview(ov);
      setSales(sl);
      setCustomers(cu);
      setInventory(inv);
      setProducts(pr);
      setMarketing(mk);
      setTraffic(tr);
      setTicker(ord.liveOrdersTicker || []);
    } finally {
      setLoading(false);
      setRefreshKey((k) => k + 1);
    }
  }, [range]);

  // First load and whenever the range changes.
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Polling strategy.
  useEffect(() => {
    const interval =
      strategy === 'live' ? POLL.live : strategy === 'slow' ? POLL.slow : null;
    if (!interval) return;
    const t = window.setInterval(() => {
      // Light refresh: pull overview + ticker; full heavy data on demand.
      getOverview(range)
        .then((ov) => {
          setOverview(ov);
          setTicker(ov.liveOrdersTicker || []);
          setRefreshKey((k) => k + 1);
        })
        .catch(() => undefined);
    }, interval);
    return () => window.clearInterval(t);
  }, [strategy, range]);

  // Live order ticker via socket.io — emit new event into ticker state.
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    (async () => {
      try {
        const mod = await import('socket.io-client');
        const socket = mod.io('/admin', { transports: ['websocket', 'polling'] });
        socket.on('order:new', (evt: LiveOrderEvent) => {
          setTicker((prev) => [evt, ...prev].slice(0, 8));
        });
        cleanup = () => {
          socket.disconnect();
        };
      } catch {
        // socket not configured → silently fall back to polling
      }
    })();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const setPreset = useCallback((p: DateRangePreset) => {
    setPresetState(p);
    if (p !== 'custom') setCustom(undefined);
  }, []);
  const setCustomRange = useCallback((from: string, to: string) => {
    setCustom({ from, to });
    setPresetState('custom');
  }, []);
  const toggleCompare = useCallback(() => {
    setComparePrevious((v) => !v);
  }, []);

  const value: AnalyticsContextValue = {
    source: analyticsSource,
    range,
    setPreset,
    setCustomRange,
    toggleCompare,
    overview,
    sales,
    customers,
    inventory,
    products,
    marketing,
    traffic,
    recentOrdersTicker: ticker,
    loading,
    refresh,
    refreshKey,
  };

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return ctx;
}

// Convenience selectors so each page only pulls what it needs.
export function useAnalyticsSlice<K extends keyof AnalyticsContextValue>(key: K) {
  const ctx = useAnalytics();
  // Re-render on refresh so dependent charts update.
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  ctx.refreshKey;
  return ctx[key];
}
