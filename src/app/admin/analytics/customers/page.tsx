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
import { BarRanking } from '@/components/analytics/charts/BarRanking';
import { CategoryDonut } from '@/components/analytics/charts/CategoryDonut';
import { CohortTable } from '@/components/analytics/charts/CohortTable';
import { FunnelChart } from '@/components/analytics/charts/FunnelChart';
import { formatCompact, formatNumber } from '@/lib/analytics/format';

function CustomersView() {
  const { customers, range } = useAnalytics();

  const exportRows = useMemo(() => {
    if (!customers) return () => [];
    return () =>
      customers.topCustomers.map((c) => ({
        name: c.name,
        email: c.email,
        city: c.city ?? '',
        orders: c.orders,
        spent: c.totalSpent,
      }));
  }, [customers]);

  if (!customers) {
    return <div className="p-6 text-body">Loading customers…</div>;
  }

  return (
    <AnalyticsShell
      title="Customer Report"
      subtitle={`${range.from} → ${range.to} · ${formatNumber(customers.topCustomers.length)} top customers tracked`}
      exportRows={exportRows}
      exportFilename="customers-report"
    >
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {customers.kpis.map((k, i) => (
          <KpiCard key={k.key} data={k} index={i} />
        ))}
      </div>

      {/* Acquisition trend + LTV donut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard
          title="Acquisition Trend"
          subtitle="New customers over time"
          className="lg:col-span-2"
          delay={0.05}
        >
          {customers.acquisitionTrend?.length ? (
            <RevenueAreaChart
              data={customers.acquisitionTrend}
              height={280}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>
        <SectionCard title="LTV Distribution" subtitle="Lifetime spend brackets" delay={0.1}>
          {customers.ltvDistribution?.length ? (
            <CategoryDonut
              data={customers.ltvDistribution.map((l, i) => ({
                name: l.bucket,
                value: l.customers,
                color: ['#3C50E0', '#22AD5C', '#FBBF24', '#F27430', '#02AAA4'][i % 5],
              }))}
              valueFormatter={(v) => formatNumber(v)}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>
      </div>

      {/* Top customers + Geographic */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Top Customers" subtitle="By lifetime spend" delay={0.05}>
          {customers.topCustomers?.length ? (
            <BarRanking
              items={customers.topCustomers.map((c) => ({
                label: c.name,
                value: c.totalSpent,
                helper: `${formatNumber(c.orders)} orders · ৳${formatCompact(c.totalSpent)}`,
              }))}
              valueFormatter={(v) => `৳${formatCompact(v)}`}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>

        <SectionCard title="Geographic Mix" subtitle="By region" delay={0.1}>
          {customers.geographic?.length ? (
            <BarRanking
              items={customers.geographic.map((g) => ({
                label: g.region,
                value: g.customers,
                helper: `${formatNumber(g.customers)} customers · ৳${formatCompact(g.revenue)}`,
              }))}
              valueFormatter={(v) => formatNumber(v)}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>
      </div>

      {/* Cohort retention + Sign-up funnel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard
          title="Cohort Retention"
          subtitle="Sign-up month × subsequent activity"
          className="lg:col-span-2"
          delay={0.05}
        >
          {customers.cohortRetention?.length ? (
            <CohortTable cohorts={customers.cohortRetention} />
          ) : (
            <AnalyticsEmpty label="Cohorts need ≥30 days of history." />
          )}
        </SectionCard>

        <SectionCard title="Sign-up Funnel" subtitle="Visitor → Customer" delay={0.1}>
          {customers.funnel?.length ? (
            <FunnelChart
              steps={customers.funnel.map((s) => ({
                label: s.step,
                count: s.count,
              }))}
            />
          ) : (
            <AnalyticsEmpty />
          )}
        </SectionCard>
      </div>

      {/* Top customers detail table */}
      <SectionCard title="Top Customers Detail" subtitle="Spend & order count" delay={0.15}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-2xs uppercase tracking-wide text-meta-4">
                <th className="py-2 text-left font-medium">Name</th>
                <th className="py-2 text-left font-medium">Email</th>
                <th className="py-2 text-left font-medium">City</th>
                <th className="py-2 text-right font-medium">Orders</th>
                <th className="py-2 text-right font-medium">Lifetime Spend</th>
                <th className="py-2 text-right font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.topCustomers.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-gray-2 dark:border-dark-3"
                >
                  <td className="py-2 font-semibold text-dark dark:text-white">{c.name}</td>
                  <td className="py-2 text-body">{c.email}</td>
                  <td className="py-2 text-body">{c.city ?? '—'}</td>
                  <td className="py-2 text-right text-body">{formatNumber(c.orders)}</td>
                  <td className="py-2 text-right font-semibold text-dark dark:text-white">
                    ৳{formatNumber(c.totalSpent)}
                  </td>
                  <td className="py-2 text-right text-body">
                    {c.joinedAt ? new Date(c.joinedAt).toLocaleDateString() : '—'}
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

export default function CustomersReportPage() {
  return (
    <AnalyticsProvider strategy="slow">
      <CustomersView />
    </AnalyticsProvider>
  );
}