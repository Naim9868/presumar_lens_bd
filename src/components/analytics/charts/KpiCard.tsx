'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Users,
  Wallet,
  BarChart3,
  Percent,
  Eye,
  Star,
  AlertTriangle,
  RefreshCcw,
  Boxes,
  XCircle,
  Undo2,
  Crown,
  type LucideIcon,
} from 'lucide-react';
import { formatPercent } from '@/lib/analytics/format';
import type { KpiCardData, KpiIconKey } from '@/types/analytics';

const ICONS: Record<KpiIconKey, LucideIcon> = {
  revenue: Wallet,
  orders: ShoppingCart,
  aov: BarChart3,
  customers: Users,
  products: Package,
  inventory: Boxes,
  lowStock: AlertTriangle,
  refunds: Undo2,
  conversion: Percent,
  ltv: Crown,
};

interface KpiCardProps {
  data: KpiCardData;
  index?: number;
}

const ACCENT_BG: Record<string, string> = {
  emerald: 'bg-green-light-5 text-green-dark dark:bg-green/20 dark:text-green',
  amber: 'bg-amber-light-4 text-amber-dark dark:bg-amber/20 dark:text-amber',
  sky: 'bg-blue-light-5 text-blue-dark dark:bg-blue/20 dark:text-blue',
  rose: 'bg-red-light-5 text-red-dark dark:bg-red/20 dark:text-red',
  violet: 'bg-violet-light-5 text-violet-dark dark:bg-violet/20 dark:text-violet',
};

const TOP_BAR: Record<string, string> = {
  emerald: 'from-emerald-400 to-emerald-600',
  amber: 'from-amber-400 to-amber-600',
  sky: 'from-sky-400 to-sky-600',
  rose: 'from-rose-400 to-rose-600',
  violet: 'from-violet-400 to-violet-600',
};

export function KpiCard({ data, index = 0 }: KpiCardProps) {
  const Icon = ICONS[data.iconKey] ?? BarChart3;
  const isUp = data.delta?.trend === 'up';
  const isDown = data.delta?.trend === 'down';
  const neutral = !data.delta || data.delta.trend === 'flat';
  const positive = data.delta?.trend === 'up';

  const tone = neutral
    ? 'text-body'
    : positive
    ? 'text-green-dark dark:text-green'
    : 'text-red-dark dark:text-red';

  const chipBg = neutral
    ? 'bg-gray-2 dark:bg-dark-3'
    : positive
    ? 'bg-green-light-6 dark:bg-green/10'
    : 'bg-red-light-6 dark:bg-red/10';

  const iconBg = ACCENT_BG[data.accent ?? ''] ?? 'bg-blue-light-5 text-blue-dark dark:bg-blue/20 dark:text-blue';
  const topBar = TOP_BAR[data.accent ?? ''] ?? 'from-blue to-blue-dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl border border-gray-2 bg-white p-5 shadow-1 transition dark:border-dark-3 dark:bg-dark-2"
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100 ${topBar}`}
      />

      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        {data.delta ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-2xs font-semibold ${tone} ${chipBg}`}
          >
            {isUp ? (
              <TrendingUp className="h-3 w-3" />
            ) : isDown ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            {formatPercent(data.delta.changePct ?? 0, { signed: true })}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-body">{data.label}</p>
        <p className="mt-1 text-2xl font-bold text-dark dark:text-white">
          {data.display}
        </p>
        {data.hint ? (
          <p className="mt-1 text-2xs text-meta-4">{data.hint}</p>
        ) : null}
      </div>
    </motion.div>
  );
}
