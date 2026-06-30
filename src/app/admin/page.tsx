'use client';

import { useMemo } from 'react';
import {
  AnalyticsShell,
  AnalyticsEmpty,
} from '@/components/analytics/AnalyticsShell';
import {
  AnalyticsProvider,
  useAnalytics,
} from '@/context/AnalyticsContext';
import { SectionCard } from '@/components/analytics/charts/SectionCard';
import { KpiCard } from '@/components/analytics/charts/KpiCard';
import { RevenueAreaChart } from '@/components/analytics/charts/RevenueAreaChart';
import { CategoryDonut } from '@/components/analytics/charts/CategoryDonut';
import { FunnelChart } from '@/components/analytics/charts/FunnelChart';
import { BarRanking } from '@/components/analytics/charts/BarRanking';
import { TrendBarChart } from '@/components/analytics/charts/TrendLineChart';
import { StatusBadge } from '@/components/analytics/charts/StatusBadge';
import { LiveOrderTicker } from '@/components/analytics/charts/LiveOrderTicker';
import {
  formatCompact,
  formatNumber,
  formatCurrency,
} from '@/lib/analytics/format';
import { Sparkles } from 'lucide-react';

function DashboardView() {
  const {
    overview,
    sales,
    customers,
    inventory,
    products,
    marketing,
    traffic,
    recentOrdersTicker,
    loading,
    range,
  } = useAnalytics();

  const exportRows = useMemo(() => {
    if (!overview) return () => [];
    return () => [
      ...overview.recentOrders.map((o) => ({
        order_id: o.id,
        customer: o.customer,
        amount: o.amount,
        status: o.status,
        date: o.date,
      })),
      ...overview.topProducts.map((p) => ({
        product: p.name,
        category: p.category ?? '',
        sales: p.sales,
        revenue: p.revenue,
        rating: p.rating ?? '',
      })),
    ];
  }, [overview]);

  if (loading && !overview) {
    return <div className="p-6 text-body">Loading dashboard…</div>;
  }

  const data = overview;
  const days = sales?.dailyOrders ?? [];
  const totalRevenue = days.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = days.reduce((s, d) => s + d.orders, 0);

  // Best-of summaries for hero cards
  const topProduct = data?.topProducts?.[0];
  const topCustomer = customers?.topCustomers?.[0];
  const lowStockCount = inventory?.lowStock?.length ?? 0;
  const topLtvBucket = [...(customers?.ltvDistribution ?? [])].sort(
    (a, b) => b.customers - a.customers
  )[0];

  return (
    <AnalyticsShell
      title="Admin Dashboard"
      subtitle={`${range.from} → ${range.to} · ৳${formatCompact(
        totalRevenue
      )} revenue across ${formatNumber(
        totalOrders
      )} orders — real-time pulse of the store`}
      exportRows={exportRows}
      exportFilename="admin-dashboard"
      liveStrategy
    >
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(data?.kpis ?? []).slice(0, 4).map((k, i) => (
          <KpiCard key={k.key} data={k} index={i} />
        ))}
      </div>

      {/* Hero stats: revenue + live ticker */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard
          title="Revenue Pulse"
          subtitle={
            range.comparePrevious
              ? 'Current vs previous period'
              : 'Current period'
          }
          className="lg:col-span-2"
          delay={0.05}
        >
          {sales?.trend?.length ? (
            <RevenueAreaChart
              data={sales.trend}
              previous={
                range.comparePrevious ? sales.previousTrend : undefined
              }
              height={280}
            />
          ) : (
            <AnalyticsEmpty label="No revenue activity for this range." />
          )}
        </SectionCard>
        <SectionCard
          title="Live Orders"
          subtitle="Streaming via Socket.io"
          delay={0.1}
        >
          <LiveOrderTicker events={recentOrdersTicker} />
        </SectionCard>
      </div>

      {/* Hero cards: Top product / Top customer / Returning / Low stock */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SectionCard title="Top Product" delay={0.05}>
          {topProduct ? (
            <div className="space-y-2">
              <p className="text-base font-semibold text-dark dark:text-white">
                {topProduct.name}
              </p>
              <p className="text-2xs uppercase tracking-wide text-meta-4">
                {topProduct.category ?? '—'}
              </p>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xs text-body">Units sold</span>
                <span className="text-sm font-semibold text-dark dark:text-white">
                  {formatNumber(topProduct.sales)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xs text-body">Revenue</span>
                <span className="text-sm font-semibold text-primary">
                  ৳{formatCompact(topProduct.revenue)}
                </span>
              </div>
              {topProduct.rating ? (
                <div className="flex items-baseline justify-between">
                  <span className="text-2xs text-body">Rating</span>
                  <span className="text-sm font-semibold text-dark dark:text-white">
                    {topProduct.rating.toFixed(1)} ★
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>

        <SectionCard title="Top Customer" delay={0.1}>
          {topCustomer ? (
            <div className="space-y-2">
              <p className="text-base font-semibold text-dark dark:text-white">
                {topCustomer.name}
              </p>
              <p className="text-2xs text-meta-4">{topCustomer.email}</p>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xs text-body">Orders</span>
                <span className="text-sm font-semibold text-dark dark:text-white">
                  {formatNumber(topCustomer.orders)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xs text-body">Total spent</span>
                <span className="text-sm font-semibold text-primary">
                  ৳{formatCompact(topCustomer.totalSpent)}
                </span>
              </div>
              {topCustomer.city ? (
                <div className="flex items-baseline justify-between">
                  <span className="text-2xs text-body">City</span>
                  <span className="text-xs text-dark dark:text-white">
                    {topCustomer.city}
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>

        <SectionCard title="Top LTV Bucket" delay={0.15}>
          {topLtvBucket ? (
            <div className="space-y-2">
              <p className="text-2xs uppercase tracking-wide text-meta-4">
                {topLtvBucket.bucket}
              </p>
              <p className="text-3xl font-bold text-primary">
                {formatNumber(topLtvBucket.customers)}
              </p>
              <p className="text-xs text-body">
                customers · ৳{formatCompact(topLtvBucket.revenue)} revenue
              </p>
            </div>
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>

        <SectionCard title="Low Stock Alerts" delay={0.2}>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-dark dark:text-white">
              {formatNumber(lowStockCount)}
            </p>
            <p className="text-xs text-body">SKUs at or below threshold</p>
            {(inventory?.lowStock ?? []).slice(0, 3).map((row) => (
              <div
                key={row.productId}
                className="flex items-center justify-between gap-2 border-t border-gray-2 pt-2 text-xs dark:border-dark-3"
              >
                <span className="truncate text-dark dark:text-white">
                  {row.name}
                </span>
                <StatusBadge status={row.status} />
              </div>
            ))}
            {!lowStockCount ? (
              <AnalyticsEmpty label="All inventory healthy." />
            ) : null}
          </div>
        </SectionCard>
      </div>

      {/* Category share + Status funnel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard
          title="Category Share"
          subtitle="Revenue contribution"
          delay={0.05}
        >
          {data?.categoryShare?.length ? (
            <CategoryDonut
              data={data.categoryShare}
              valueFormatter={(v) => `৳${formatCompact(v)}`}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>

        <SectionCard
          title="Acquisition Channels"
          subtitle="By orders share"
          className="lg:col-span-2"
          delay={0.1}
        >
          {data?.acquisitionChannels?.length ? (
            <BarRanking
              items={data.acquisitionChannels.map((c) => ({
                label: c.channel,
                value: c.orders,
                helper: `৳${formatCompact(c.revenue)} revenue`,
              }))}
              valueFormatter={(v) => formatNumber(v)}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>
      </div>

      {/* Traffic Insights: channels / devices / realtime */}
      <SectionCard
        title="Traffic Insights"
        subtitle="Sessions, channels, devices, and live activity"
        delay={0.1}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(traffic?.kpis ?? []).slice(0, 4).map((k, i) => (
            <KpiCard key={k.key} data={k} index={i} />
          ))}
          {!traffic?.kpis?.length ? <AnalyticsEmpty label="No traffic data." /> : null}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-2 p-3 dark:border-dark-3">
            <p className="mb-2 text-2xs uppercase tracking-wide text-meta-4">
              Top Channels
            </p>
            {traffic?.channels?.length ? (
              <BarRanking
                items={traffic.channels.slice(0, 6).map((c) => ({
                  label: c.channel,
                  value: c.sessions,
                  helper: `${formatNumber(c.conversions)} conv · ৳${formatCompact(
                    c.revenue
                  )}`,
                }))}
                valueFormatter={(v) => formatNumber(v)}
              />
            ) : (
              <AnalyticsEmpty />
            )}
          </div>

          <div className="rounded-2xl border border-gray-2 p-3 dark:border-dark-3">
            <p className="mb-2 text-2xs uppercase tracking-wide text-meta-4">
              Device Mix
            </p>
            {traffic?.devices?.length ? (
              <CategoryDonut
                data={traffic.devices.map((d) => ({
                  name: d.device,
                  value: d.sessions,
                }))}
                valueFormatter={(v) => formatNumber(v)}
              />
            ) : (
              <AnalyticsEmpty />
            )}
          </div>

          <div className="rounded-2xl border border-gray-2 p-3 dark:border-dark-3">
            <p className="mb-2 text-2xs uppercase tracking-wide text-meta-4">
              Realtime (last 24h)
            </p>
            {traffic?.realtime?.length ? (
              <TrendBarChart
                data={traffic.realtime.map((r) => ({
                  date: `${String(r.hour).padStart(2, '0')}:00`,
                  value: r.sessions,
                }))}
                color="#3C50E0"
              />
            ) : (
              <AnalyticsEmpty />
            )}
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-2xs uppercase tracking-wide text-meta-4">
            Top Pages
          </p>
          {traffic?.topPages?.length ? (
            <BarRanking
              items={traffic.topPages.slice(0, 5).map((p) => ({
                label: p.path,
                value: p.views,
                helper: `${p.avgTime.toFixed(0)}s avg time on page`,
              }))}
              valueFormatter={(v) => formatNumber(v)}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </div>
      </SectionCard>

      {/* Order funnel + Daily orders trend */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard title="Order Funnel" subtitle="By status" delay={0.05}>
          {data?.statusFunnel?.length ? (
            <FunnelChart
              steps={data.statusFunnel.map((s) => ({
                label: s.step,
                count: s.count,
              }))}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>

        <SectionCard
          title="Daily Orders"
          subtitle="Order count over time"
          className="lg:col-span-2"
          delay={0.1}
        >
          {sales?.dailyOrders?.length ? (
            <TrendBarChart
              data={sales.dailyOrders.map((d) => ({
                date: d.date,
                value: d.orders,
              }))}
              color="#22AD5C"
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>
      </div>

      {/* Top products + Top customers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Top Products"
          subtitle="Best sellers in this period"
          delay={0.05}
        >
          {data?.topProducts?.length ? (
            <BarRanking
              items={data.topProducts.map((p) => ({
                label: p.name,
                value: p.revenue,
                helper: `${formatNumber(p.sales)} units · ${
                  p.rating ? p.rating.toFixed(1) + ' ★' : 'unrated'
                }`,
              }))}
              valueFormatter={(v) => `৳${formatCompact(v)}`}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>

        <SectionCard
          title="Top Customers"
          subtitle="By total spent"
          delay={0.1}
        >
          {customers?.topCustomers?.length ? (
            <BarRanking
              items={customers.topCustomers.map((c) => ({
                label: c.name,
                value: c.totalSpent,
                helper: `${formatNumber(c.orders)} orders${
                  c.city ? ' · ' + c.city : ''
                }`,
              }))}
              valueFormatter={(v) => `৳${formatCompact(v)}`}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>
      </div>

      {/* Inventory health snapshot */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Inventory Movement"
          subtitle="Inbound vs outbound vs reserved"
          delay={0.05}
        >
          {inventory?.inventoryMovement?.length ? (
            <TrendBarChart
              data={inventory.inventoryMovement.map((m) => ({
                date: m.date,
                value: m.outbound,
              }))}
              color="#3C50E0"
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>

        <SectionCard
          title="Stock Health"
          subtitle="Bucketed counts"
          delay={0.1}
        >
          {inventory?.stockHealth?.length ? (
            <BarRanking
              items={inventory.stockHealth.map((b) => ({
                label: b.bucket,
                value: b.count,
                helper: `৳${formatCompact(b.value)} value`,
              }))}
              valueFormatter={(v) => formatNumber(v)}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>
      </div>

      {/* Recent orders + category performance */}
      <SectionCard
        title="Recent Orders"
        subtitle="Latest 10 in the period"
        delay={0.15}
      >
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
              {(data?.recentOrders ?? []).map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-gray-2 dark:border-dark-3"
                >
                  <td className="py-2 font-semibold text-dark dark:text-white">
                    {o.id}
                  </td>
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

      {/* Quick categories of interest */}
      <SectionCard
        title="Category Performance"
        subtitle="Revenue contribution per category"
        delay={0.2}
      >
        {products?.revenueContribution?.length ? (
          <BarRanking
            items={products.revenueContribution.map((c) => ({
              label: c.category,
              value: c.revenue,
              helper: `${formatNumber(c.orders)} orders · ${formatNumber(
                c.units
              )} units`,
            }))}
            valueFormatter={(v) => `৳${formatCompact(v)}`}
          />
        ) : (
          <AnalyticsEmpty />
        )}
      </SectionCard>

      {/* Footer accent: insights summary */}
      <SectionCard
        title="Insights"
        subtitle="Quick signals from your store"
        delay={0.25}
        action={
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-light-5 px-2.5 py-1 text-2xs font-semibold text-blue-dark dark:bg-blue/10">
            <Sparkles className="h-3 w-3" /> Auto
          </span>
        }
      >
        <ul className="grid grid-cols-1 gap-2 text-xs text-body sm:grid-cols-2 lg:grid-cols-3">
          <li className="rounded-lg border border-gray-2 p-3 dark:border-dark-3">
            <p className="text-2xs uppercase tracking-wide text-meta-4">
              Avg Order Value
            </p>
            <p className="mt-1 text-base font-semibold text-dark dark:text-white">
              {formatCurrency(
                totalOrders > 0 ? totalRevenue / totalOrders : 0
              )}
            </p>
          </li>
          <li className="rounded-lg border border-gray-2 p-3 dark:border-dark-3">
            <p className="text-2xs uppercase tracking-wide text-meta-4">
              Refund Rate
            </p>
            <p className="mt-1 text-base font-semibold text-dark dark:text-white">
              {formatPercent(
                totalOrders > 0
                  ? ((sales?.refunds?.reduce((s, r) => s + r.count, 0) ?? 0) /
                      totalOrders) *
                      100
                  : 0
              )}
            </p>
          </li>
          <li className="rounded-lg border border-gray-2 p-3 dark:border-dark-3">
            <p className="text-2xs uppercase tracking-wide text-meta-4">
              Top-rated count
            </p>
            <p className="mt-1 text-base font-semibold text-dark dark:text-white">
              {formatNumber(
                (products?.ratingsDistribution ?? [])
                  .filter((r) => r.rating >= 4)
                  .reduce((s, r) => s + r.count, 0)
              )}
            </p>
          </li>
        </ul>
      </SectionCard>
    </AnalyticsShell>
  );
}

// Local percent helper (avoids importing formatPercent twice)
function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—';
  return `${value.toFixed(digits)}%`;
}

export default function AdminDashboardPage() {
  return (
    <AnalyticsProvider strategy="live">
      <DashboardView />
    </AnalyticsProvider>
  );
}