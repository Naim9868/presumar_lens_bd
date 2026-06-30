'use client';

import { motion } from 'framer-motion';
import { formatNumber } from '@/lib/analytics/format';

export interface FunnelStep {
  label: string;
  count: number;
}

interface FunnelChartProps {
  steps: FunnelStep[];
  delay?: number;
}

export function FunnelChart({ steps, delay = 0 }: FunnelChartProps) {
  if (!steps.length) return null;
  const max = Math.max(...steps.map((s) => s.count), 1);
  return (
    <div className="space-y-3">
      {steps.map((s, i) => {
        const pct = Math.max(8, Math.round((s.count / max) * 100));
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: delay + i * 0.06, ease: 'easeOut' }}
            className="flex items-center gap-3"
          >
            <div className="w-32 shrink-0 truncate text-xs text-body">{s.label}</div>
            <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-gray-2 dark:bg-dark-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.55, delay: delay + i * 0.06 + 0.05, ease: 'easeOut' }}
                className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-blue to-blue-light"
              />
              <div className="absolute inset-y-0 right-2 flex items-center text-2xs font-semibold text-dark dark:text-white">
                {formatNumber(s.count)}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
