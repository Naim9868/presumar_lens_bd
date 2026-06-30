'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CircleDot } from 'lucide-react';
import { formatCompact } from '@/lib/analytics/format';
import type { LiveOrderEvent } from '@/types/analytics';
import { StatusBadge } from './StatusBadge';

interface LiveOrderTickerProps {
  events: LiveOrderEvent[];
  max?: number;
}

export function LiveOrderTicker({ events, max = 6 }: LiveOrderTickerProps) {
  const list = events.slice(0, max);
  return (
    <div className="space-y-2">
      <div className="mb-2 flex items-center gap-2 text-2xs font-semibold uppercase tracking-wide text-green">
        <motion.span
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        >
          <CircleDot className="h-3.5 w-3.5 fill-current" />
        </motion.span>
        Live
      </div>
      <AnimatePresence initial={false}>
        {list.map((e) => (
          <motion.div
            key={e.id}
            layout
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-2 bg-white px-3 py-2 dark:border-dark-3 dark:bg-dark"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-dark dark:text-white">
                {e.customer} · <span className="text-body">{e.id}</span>
              </p>
              <p className="text-2xs text-meta-4">{e.city ?? '—'}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status="paid" />
              <span className="text-xs font-semibold text-dark dark:text-white">
                ৳{formatCompact(e.amount)}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {!list.length ? (
        <p className="py-3 text-center text-2xs text-meta-4">No live orders yet.</p>
      ) : null}
    </div>
  );
}
