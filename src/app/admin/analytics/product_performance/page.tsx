'use client';

import { useMemo } from 'react';
import {
  AnalyticsShell,
  AnalyticsEmpty,
} from '@/components/analytics/AnalyticsShell';
import { AnalyticsProvider, useAnalytics } from '@/context/AnalyticsContext';
import { SectionCard } from '@/components/analytics/charts/SectionCard';
import { KpiCard } from '@/components/analytics/charts/KpiCard';
import { BarRanking } from '@/components/analytics/charts/BarRanking';
import { CategoryDonut } from '@/components/analytics/charts/CategoryDonut';
import { TrendBarChart } from '@/components/analytics/charts/TrendLineChart';
import { StatusBadge } from '@/components/analytics/charts/StatusBadge';
import { formatCompact, formatNumber } from '@/lib/analytics/format';

function ProductPerformanceView() {
  const { products, range } = useAnalytics();

  const exportRows = useMemo(() => {
    if (!products) return () => [];
    return () =>
      products.topSellers.map((p) => ({
        product: p.name,
        category: p.category ?? '',
        units: p.sales,
        revenue: p.revenue,
      }));
  }, [products]);

  if (!products) {
    return <div className="p-6 text-body">Loading product performance…</div>;
  }

  const returnRatePct = (r: number) => (r * 100).toFixed(1);

  return (
    <AnalyticsShell
      title="Product Performance"
      subtitle={`${range.from} → ${range.to} · ${formatNumber(products.topSellers.length)} top sellers`}
      exportRows={exportRows}
      exportFilename="product-performance"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {products.kpis.map((k, i) => (
          <KpiCard key={k.key} data={k} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard
          title="Top Sellers"
          subtitle="Units sold"
          className="lg:col-span-2"
          delay={0.05}
        >
          {products.topSellers?.length ? (
            <BarRanking
              items={products.topSellers.map((p) => ({
                label: p.name,
                value: p.sales,
                helper: `৳${formatCompact(p.revenue)} revenue${p.rating ? ` · ${p.rating.toFixed(1)}★` : ''}`,
              }))}
              valueFormatter={(v) => formatNumber(v)}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>

        <SectionCard title="Revenue Contribution" subtitle="By category" delay={0.1}>
          {products.revenueContribution?.length ? (
            <CategoryDonut
              data={products.revenueContribution.map((c, i) => ({
                name: c.category,
                value: c.revenue,
                color: ['#3C50E0', '#22AD5C', '#FBBF24', '#F27430', '#02AAA4', '#A78BFA'][i % 6],
              }))}
              valueFormatter={(v) => `৳${formatCompact(v)}`}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Ratings Distribution" subtitle="Review score breakdown" delay={0.05}>
          {products.ratingsDistribution?.length ? (
            <BarRanking
              items={products.ratingsDistribution.map((r) => ({
                label: `${r.rating}★`,
                value: r.count,
                helper: `${r.share}% of reviews`,
              }))}
              valueFormatter={(v) => formatNumber(v)}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>

        <SectionCard title="Discount Impact" subtitle="Orders per discount bucket" delay={0.1}>
          {products.discountImpact?.length ? (
            <BarRanking
              items={products.discountImpact.map((d) => ({
                label: d.bucket,
                value: d.orders,
                helper: `৳${formatCompact(d.revenue)} revenue`,
              }))}
              valueFormatter={(v) => formatNumber(v)}
            />
          ) : (
            <AnalyticsEmpty label="No discount data in range." />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Returns by Product" subtitle="Top returned items" delay={0.15}>
        {products.returnsByProduct?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-2xs uppercase tracking-wide text-meta-4">
                  <th className="py-2 text-left font-medium">Product</th>
                  <th className="py-2 text-right font-medium">Orders</th>
                  <th className="py-2 text-right font-medium">Returns</th>
                  <th className="py-2 text-right font-medium">Return Rate</th>
                  <th className="py-2 text-right font-medium">Refund</th>
                  <th className="py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.returnsByProduct.map((r) => (
                  <tr key={r.productId} className="border-t border-gray-2 dark:border-dark-3">
                    <td className="py-2 font-semibold text-dark dark:text-white">{r.name}</td>
                    <td className="py-2 text-right text-body">{formatNumber(r.orders)}</td>
                    <td className="py-2 text-right text-body">{formatNumber(r.returns)}</td>
                    <td className="py-2 text-right text-body">{returnRatePct(r.returnRate)}%</td>
                    <td className="py-2 text-right text-body">৳{formatNumber(r.refundAmount)}</td>
                    <td className="py-2 text-right">
                      <StatusBadge status={r.returnRate > 0.08 ? 'high_return' : 'normal'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AnalyticsEmpty label="No returns in this period." />
        )}
      </SectionCard>
    </AnalyticsShell>
  );
}

export default function ProductPerformancePage() {
  return (
    <AnalyticsProvider strategy="slow">
      <ProductPerformanceView />
    </AnalyticsProvider>
  );
}