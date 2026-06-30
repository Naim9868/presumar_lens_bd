'use client';

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export interface DonutSlice {
  name: string;
  value: number;
  color?: string;
}

interface CategoryDonutProps {
  data: DonutSlice[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  valueFormatter?: (v: number) => string;
}

const DEFAULT_PALETTE = ['#3C50E0', '#22AD5C', '#FBBF24', '#F27430', '#02AAA4', '#8D93A5', '#A855F7'];

export function CategoryDonut({
  data,
  height = 240,
  innerRadius = 50,
  outerRadius = 80,
  valueFormatter,
}: CategoryDonutProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Tooltip
          contentStyle={{
            background: '#1C274C',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 12,
          }}
          formatter={(v: any) => (valueFormatter ? valueFormatter(Number(v)) : v)}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: '#6C6F93' }}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="45%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={3}
          cornerRadius={6}
          strokeWidth={0}
        >
          {data.map((s, i) => (
            <Cell key={i} fill={s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
