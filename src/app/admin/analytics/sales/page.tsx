'use client';

import { useMemo } from 'react';
import {
  AnalyticsShell,
  AnalyticsEmpty,
} from '@/components/analytics/AnalyticsShell';
import { AnalyticsProvider, useAnalytics } from '@/context/AnalyticsContext';
import { SectionCard } from '@/components/analytics/charts/SectionCard';
import { KpiCard } from '@/components/analytics/charts/KpiCard';
import { RevenueAreaChart } from '@/components/analytics/charts/RevenueAreaChart';
import { CategoryDonut } from '@/components/analytics/charts/CategoryDonut';
import { FunnelChart } from '@/components/analytics/charts/FunnelChart';
import { HeatmapMatrix } from '@/components/analytics/charts/HeatmapMatrix';
import { TrendBarChart } from '@/components/analytics/charts/TrendLineChart';
import { StatusBadge } from '@/components/analytics/charts/StatusBadge';
import { LiveOrderTicker } from '@/components/analytics/charts/LiveOrderTicker';
import { formatCompact, formatNumber } from '@/lib/analytics/format';

function SalesView() {
  const { sales, overview, recentOrdersTicker, loading, range } = useAnalytics();

  const exportRows = useMemo(() => {
    if (!sales) return () => [];
    return () => [
      ...sales.dailyOrders.map((d) => ({
        date: d.date,
        orders: d.orders,
        revenue: d.revenue,
        aov: d.orders ? Math.round(d.revenue / d.orders) : 0,
      })),
    ];
  }, [sales]);

  // Convert long-format HeatmapCell[] (day, hour, orders) into a 2D matrix [7][24]
  const heatmapMatrix = useMemo<(number | null)[][]>(() => {
    const cells = sales?.hourlyHeatmap ?? [];
    if (!cells.length) return [];
    const matrix: (number | null)[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => null)
    );
    cells.forEach((c) => {
      const dayIdx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(c.day);
      if (dayIdx >= 0 && c.hour >= 0 && c.hour < 24) {
        matrix[dayIdx][c.hour] = c.orders;
      }
    });
    return matrix;
  }, [sales]);

  if (loading && !sales) {
    return <div className="p-6 text-body">Loading sales analytics…</div>;
  }

  const data = sales;
  const days = data?.dailyOrders ?? [];
  const totalRevenue = days.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = days.reduce((s, d) => s + d.orders, 0);

  return (
    <AnalyticsShell
      title="Sales Report"
      subtitle={`${range.from} → ${range.to} · BDT ৳${formatCompact(
        totalRevenue,
      )} across ${formatNumber(totalOrders)} orders`}
      exportRows={exportRows}
      exportFilename="sales-report"
      liveStrategy
    >
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(data?.kpis ?? []).map((k, i) => (
          <KpiCard key={k.key} data={k} index={i} />
        ))}
      </div>

      {/* Trend + Live ticker */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard
          title="Revenue Trend"
          subtitle={range.comparePrevious ? 'Current vs previous period' : 'Current period'}
          className="lg:col-span-2"
          delay={0.05}
        >
          {data?.trend?.length ? (
            <RevenueAreaChart
              data={data.trend}
              previous={range.comparePrevious ? data.previousTrend : undefined}
              height={300}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>
        <SectionCard title="Live Orders" subtitle="Streaming via Socket.io" delay={0.1}>
          <LiveOrderTicker events={recentOrdersTicker} />
        </SectionCard>
      </div>

      {/* Payment methods + Coupons */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard
          title="Payment Methods"
          subtitle="Revenue share by gateway"
          delay={0.05}
        >
          {data?.paymentMethods?.length ? (
            <CategoryDonut
              data={data.paymentMethods.map((p, i) => ({
                name: p.method,
                value: p.revenue,
                color: ['#3C50E0', '#22AD5C', '#FBBF24', '#F27430', '#02AAA4'][i % 5],
              }))}
              valueFormatter={(v) => `৳${formatCompact(v)}`}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>

        <SectionCard
          title="Top Coupons"
          subtitle="By usage"
          delay={0.1}
          className="lg:col-span-2"
        >
          {data?.coupons?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-2xs uppercase tracking-wide text-meta-4">
                    <th className="py-2 text-left font-medium">Code</th>
                    <th className="py-2 text-right font-medium">Usage</th>
                    <th className="py-2 text-right font-medium">Discount</th>
                    <th className="py-2 text-right font-medium">Avg Discount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.coupons.map((c) => (
                    <tr key={c.code} className="border-t border-gray-2 dark:border-dark-3">
                      <td className="py-2 font-semibold text-dark dark:text-white">{c.code}</td>
                      <td className="py-2 text-right text-body">{formatNumber(c.uses)}</td>
                      <td className="py-2 text-right text-body">৳{formatNumber(c.discount)}</td>
                      <td className="py-2 text-right text-body">
                        ৳{formatNumber(Math.round(c.discount / Math.max(c.uses, 1)))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <AnalyticsEmpty label="No coupons used in this period." />
          )}
        </SectionCard>
      </div>

      {/* Hourly heatmap + Status funnel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard
          title="Hourly Heatmap"
          subtitle="Orders by day-of-week × hour"
          className="lg:col-span-2"
          delay={0.05}
        >
          {heatmapMatrix.length ? (
            <HeatmapMatrix
              rows={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
              cols={['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p']}
              values={heatmapMatrix}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>

        <SectionCard title="Order Funnel" subtitle="By status" delay={0.1}>
          {(overview?.statusFunnel ?? []).length ? (
            <FunnelChart
              steps={(overview?.statusFunnel ?? []).map((s) => ({
                label: s.step,
                count: s.count,
              }))}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>
      </div>

      {/* Refunds + Daily bars */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Refunds Trend" subtitle="Refunded amount over time" delay={0.05}>
          {data?.refunds?.length ? (
            <TrendBarChart
              data={data.refunds.map((r) => ({ date: r.date, value: r.amount }))}
              color="#F23030"
            />
          ) : (
            <AnalyticsEmpty label="No refunds in this period." />
          )}
        </SectionCard>
        <SectionCard title="Daily Orders" subtitle="Order count" delay={0.1}>
          {data?.dailyOrders?.length ? (
            <TrendBarChart
              data={data.dailyOrders.map((d) => ({ date: d.date, value: d.orders }))}
              color="#22AD5C"
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>
      </div>

      {/* Recent orders */}
      <SectionCard title="Recent Orders" subtitle="Latest 10 in the period" delay={0.15}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-2xs uppercase tracking-wide text-meta-4">
                <th className="py-2 text-left font-medium">Order</th>
                <th className="py-2 text-left font-medium">Customer</th>
                <th className="py-2 text-left font-medium">Status</th>
                <th className="py-2 text-right font-medium">Amount</th>
                <th className="py-2 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {(overview?.recentOrders ?? []).map((o) => (
                <tr key={o.id} className="border-t border-gray-2 dark:border-dark-3">
                  <td className="py-2 font-semibold text-dark dark:text-white">{o.id}</td>
                  <td className="py-2 text-body">{o.customer}</td>
                  <td className="py-2">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="py-2 text-right font-semibold text-dark dark:text-white">
                    ৳{formatNumber(o.amount)}
                  </td>
                  <td className="py-2 text-right text-body">
                    {new Date(o.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AnalyticsShell>
  );
}

export default function SalesReportPage() {
  return (
    <AnalyticsProvider strategy="slow">
      <SalesView />
    </AnalyticsProvider>
  );
}
