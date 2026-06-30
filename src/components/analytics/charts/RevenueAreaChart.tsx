'use client';

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
import { formatCompact } from '@/lib/analytics/format';
import type { TrendPoint } from '@/types/analytics';

interface RevenueAreaChartProps {
  data: TrendPoint[];
  previous?: TrendPoint[];
  height?: number;
  showLegend?: boolean;
  currency?: 'BDT' | 'USD';
}

const currency = (v: number, cur: 'BDT' | 'USD' = 'BDT') =>
  cur === 'BDT' ? `৳${formatCompact(v)}` : `$${formatCompact(v)}`;

export function RevenueAreaChart({
  data,
  previous,
  height = 260,
  showLegend = true,
  currency: cur = 'BDT',
}: RevenueAreaChartProps) {
  const merged = data.map((d, i) => ({
    date: d.date,
    current: (d as any).value ?? d.revenue,
    previous: previous?.[i] ? ((previous[i] as any).value ?? previous[i].revenue) : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={merged} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="cur" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3C50E0" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#3C50E0" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="prev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22AD5C" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#22AD5C" stopOpacity={0.02} />
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
          width={60}
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
          formatter={(v, name) => [currency(Number(v), cur), String(name ?? '')]}
        />
        {showLegend ? (
          <Legend
            verticalAlign="top"
            height={28}
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: '#6C6F93' }}
          />
        ) : null}
        {previous?.length ? (
          <Area
            type="monotone"
            name="Previous"
            dataKey="previous"
            stroke="#22AD5C"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="url(#prev)"
          />
        ) : null}
        <Area
          type="monotone"
          name="Current"
          dataKey="current"
          stroke="#3C50E0"
          strokeWidth={2.5}
          fill="url(#cur)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
