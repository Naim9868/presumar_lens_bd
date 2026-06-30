'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrendPoint } from '@/types/analytics';
import { formatCompact, formatNumber } from '@/lib/analytics/format';

interface TrendLineChartProps {
  data: TrendPoint[] | { date: string; value: number }[];
  height?: number;
  color?: string;
  yFormatter?: (v: number) => string;
}

export function TrendLineChart({
  data,
  height = 220,
  color = '#3C50E0',
  yFormatter,
}: TrendLineChartProps) {
  const normalized = data.map((d: any) => ({
    date: d.date,
    value: d.value ?? d.revenue ?? 0,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={normalized} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d: string) => d.slice(5)}
          tick={{ fontSize: 11, fill: '#6C6F93' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => (yFormatter ? yFormatter(v) : formatCompact(v))}
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
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface TrendBarChartProps {
  data: TrendPoint[] | { date: string; value: number }[];
  height?: number;
  color?: string;
}

export function TrendBarChart({ data, height = 220, color = '#3C50E0' }: TrendBarChartProps) {
  const normalized = (data as any[]).map((d) => ({
    date: d.date,
    value: d.value ?? d.revenue ?? 0,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={normalized} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
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
          cursor={{ fill: 'rgba(60,80,224,0.06)' }}
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
        <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={color}>
          {data.map((_, i) => (
            <Cell key={i} fill={color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
