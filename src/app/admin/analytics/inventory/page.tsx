'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AnalyticsShell,
  AnalyticsEmpty,
} from '@/components/analytics/AnalyticsShell';
import { AnalyticsProvider, useAnalytics } from '@/context/AnalyticsContext';
import { SectionCard } from '@/components/analytics/charts/SectionCard';
import { KpiCard } from '@/components/analytics/charts/KpiCard';
import { CategoryDonut } from '@/components/analytics/charts/CategoryDonut';
import { BarRanking } from '@/components/analytics/charts/BarRanking';
import { formatCompact, formatNumber } from '@/lib/analytics/format';

function MovementChart({
  data,
  height = 260,
}: {
  data: { date: string; inbound: number; outbound: number; reserved: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="inv-in" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22AD5C" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#22AD5C" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="inv-out" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F27430" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#F27430" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="inv-res" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d: string) => d.slice(5)}
          tick={{ fontSize: 11, fill: '#6C6F93' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => formatCompact(v)}
          tick={{ fontSize: 11, fill: '#6C6F93' }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip
          contentStyle={{
            background: '#1C274C',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 12,
          }}
          labelStyle={{ color: '#BBBEC9' }}
          formatter={(v: any) => formatNumber(Number(v))}
        />
        <Legend
          verticalAlign="top"
          height={28}
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: '#6C6F93' }}
        />
        <Area
          type="monotone"
          name="Inbound"
          dataKey="inbound"
          stroke="#22AD5C"
          strokeWidth={2}
          fill="url(#inv-in)"
        />
        <Area
          type="monotone"
          name="Outbound"
          dataKey="outbound"
          stroke="#F27430"
          strokeWidth={2}
          fill="url(#inv-out)"
        />
        <Area
          type="monotone"
          name="Reserved"
          dataKey="reserved"
          stroke="#A78BFA"
          strokeWidth={2}
          fill="url(#inv-res)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function InventoryView() {
  const { inventory, range } = useAnalytics();

  const exportRows = useMemo(() => {
    if (!inventory) return () => [];
    return () =>
      inventory.lowStock.map((p) => ({
        product: p.name,
        sku: p.variantSku ?? p.productId,
        stock: p.stock,
        threshold: p.threshold,
      }));
  }, [inventory]);

  if (!inventory) {
    return <div className="p-6 text-body">Loading inventory…</div>;
  }

  return (
    <AnalyticsShell
      title="Inventory Report"
      subtitle={`${range.from} → ${range.to} · ${formatNumber(inventory.lowStock.length)} low-stock alerts`}
      exportRows={exportRows}
      exportFilename="inventory-report"
    >
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {inventory.kpis.map((k, i) => (
          <KpiCard key={k.key} data={k} index={i} />
        ))}
      </div>

      {/* Stock by category + movement */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard title="Stock by Category" subtitle="Share of stock units" delay={0.05}>
          {inventory.stockByCategory?.length ? (
            <CategoryDonut
              data={inventory.stockByCategory.map((c, i) => ({
                name: c.name,
                value: c.value,
                color: ['#3C50E0', '#22AD5C', '#FBBF24', '#F27430', '#02AAA4', '#A78BFA'][i % 6],
              }))}
              valueFormatter={(v) => formatNumber(v)}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>

        <SectionCard
          title="Stock Movement"
          subtitle="Daily inflow vs outflow"
          className="lg:col-span-2"
          delay={0.1}
        >
          {inventory.inventoryMovement?.length ? (
            <MovementChart data={inventory.inventoryMovement} height={260} />
          ) : (
            <AnalyticsEmpty label="No movement data." />
          )}
        </SectionCard>
      </div>

      {/* Top variants + dead stock */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Top Selling Variants" subtitle="By units sold" delay={0.05}>
          {inventory.topSellingVariants?.length ? (
            <BarRanking
              items={inventory.topSellingVariants.map((v) => ({
                label: v.name,
                value: v.sales,
                helper: `${formatCompact(v.revenue)} revenue`,
              }))}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>

        <SectionCard title="Dead Stock" subtitle="No recent sales" delay={0.1}>
          {inventory.deadStock?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-2xs uppercase tracking-wide text-meta-4">
                    <th className="py-2 text-left font-medium">Product</th>
                    <th className="py-2 text-right font-medium">Stock</th>
                    <th className="py-2 text-right font-medium">Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.deadStock.map((d) => (
                    <tr
                      key={d.id}
                      className="border-t border-gray-2 dark:border-dark-3"
                    >
                      <td className="py-2 font-semibold text-dark dark:text-white">
                        {d.name}
                      </td>
                      <td className="py-2 text-right text-body">{formatNumber(d.stock ?? 0)}</td>
                      <td className="py-2 text-right text-body">{formatNumber(d.sales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <AnalyticsEmpty label="No dead stock. Great!" />
          )}
        </SectionCard>
      </div>

      {/* Stock health */}
      {inventory.stockHealth?.length ? (
        <SectionCard title="Stock Health" subtitle="Distribution by status" delay={0.15}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {inventory.stockHealth.map((s) => {
              const colors: Record<string, string> = {
                healthy: 'from-emerald-500 to-emerald-700',
                low: 'from-amber-500 to-amber-700',
                out: 'from-rose-500 to-rose-700',
                overstock: 'from-violet-500 to-violet-700',
              };
              return (
                <div
                  key={s.bucket}
                  className={`rounded-xl bg-gradient-to-br ${
                    colors[s.bucket] ?? 'from-sky-500 to-sky-700'
                  } p-4 text-white shadow-sm`}
                >
                  <div className="text-2xs uppercase tracking-wide opacity-80">
                    {s.bucket}
                  </div>
                  <div className="mt-1 text-2xl font-bold">{formatNumber(s.count)}</div>
                  <div className="mt-1 text-2xs opacity-80">
                    {formatCurrencyBDT(s.value)}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      ) : null}

      {/* Low stock alerts */}
      <SectionCard title="Low Stock Alerts" subtitle="Below threshold" delay={0.2}>
        {inventory.lowStock?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-2xs uppercase tracking-wide text-meta-4">
                  <th className="py-2 text-left font-medium">Product</th>
                  <th className="py-2 text-left font-medium">SKU</th>
                  <th className="py-2 text-right font-medium">Stock</th>
                  <th className="py-2 text-right font-medium">Threshold</th>
                  <th className="py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.lowStock.map((p) => (
                  <tr
                    key={p.variantSku ?? p.productId}
                    className="border-t border-gray-2 dark:border-dark-3"
                  >
                    <td className="py-2 font-semibold text-dark dark:text-white">{p.name}</td>
                    <td className="py-2 text-body">{p.variantSku ?? '—'}</td>
                    <td className="py-2 text-right font-semibold text-red-600">
                      {formatNumber(p.stock)}
                    </td>
                    <td className="py-2 text-right text-body">{formatNumber(p.threshold)}</td>
                    <td className="py-2 text-right text-body">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-2xs font-semibold ${
                          p.status === 'out_of_stock'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}
                      >
                        {p.status === 'out_of_stock' ? 'Out' : 'Low'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AnalyticsEmpty label="All products above threshold." />
        )}
      </SectionCard>
    </AnalyticsShell>
  );
}

function formatCurrencyBDT(v: number) {
  return `৳${formatCompact(v)}`;
}

export default function InventoryReportPage() {
  return (
    <AnalyticsProvider strategy="manual">
      <InventoryView />
    </AnalyticsProvider>
  );
}