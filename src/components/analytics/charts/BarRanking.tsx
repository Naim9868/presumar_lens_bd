'use client';

import { motion } from 'framer-motion';
import { formatNumber } from '@/lib/analytics/format';

export interface BarRankingItem {
  label: string;
  value: number;
  helper?: string;
  color?: string;
}

interface BarRankingProps {
  items: BarRankingItem[];
  valueFormatter?: (v: number) => string;
  delay?: number;
}

export function BarRanking({ items, valueFormatter, delay = 0 }: BarRankingProps) {
  if (!items.length) return null;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-3">
      {items.map((it, i) => {
        const pct = Math.max(4, Math.round((it.value / max) * 100));
        return (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: delay + i * 0.05, ease: 'easeOut' }}
          >
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate text-dark dark:text-white">{it.label}</span>
              <span className="font-semibold text-body">
                {valueFormatter ? valueFormatter(it.value) : formatNumber(it.value)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-2 dark:bg-dark-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{
                  duration: 0.55,
                  delay: delay + i * 0.05 + 0.05,
                  ease: 'easeOut',
                }}
                className="h-full rounded-full"
                style={{ background: it.color ?? 'linear-gradient(90deg, #3C50E0, #5475E5)' }}
              />
            </div>
            {it.helper ? (
              <p className="mt-1 text-2xs text-meta-4">{it.helper}</p>
            ) : null}
          </motion.div>
        );
      })}
    </div>
  );
}
