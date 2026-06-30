'use client';

import { motion } from 'framer-motion';

export interface CohortRow {
  cohort: string;
  size: number;
  retention: (number | null)[];
}

interface CohortTableProps {
  /** Accept either the local CohortRow or the canonical one (number[] instead of (number|null)[]) */
  cohorts: { cohort: string; size: number; retention: (number | null)[] }[];
  delay?: number;
}

const cellColor = (v: number | null) => {
  if (v == null) return 'rgba(148,163,184,0.12)';
  const a = Math.max(0.08, Math.min(1, v / 100));
  return `rgba(34,173,92,${a})`;
};

export function CohortTable({ cohorts, delay = 0 }: CohortTableProps) {
  if (!cohorts.length) return null;
  const max = cohorts.reduce((m, c) => Math.max(m, c.retention.length), 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-2xs">
        <thead>
          <tr>
            <th className="px-1 py-1 text-left font-medium text-meta-4">Cohort</th>
            <th className="px-1 py-1 text-right font-medium text-meta-4">Size</th>
            {Array.from({ length: max }).map((_, i) => (
              <th key={i} className="px-1 py-1 text-center font-medium text-meta-4">
                M{i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((c, i) => (
            <tr key={c.cohort}>
              <td className="whitespace-nowrap px-1 py-0.5 font-medium text-body">{c.cohort}</td>
              <td className="px-1 py-0.5 text-right text-body">{c.size}</td>
              {Array.from({ length: max }).map((_, j) => {
                const v = c.retention[j] ?? null;
                return (
                  <td key={j} className="px-0.5 py-0.5">
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        duration: 0.2,
                        delay: delay + (i * max + j) * 0.004,
                      }}
                      className="flex h-7 items-center justify-center rounded-md text-2xs font-semibold"
                      style={{
                        background: cellColor(v),
                        color: v != null && v > 55 ? '#fff' : '#1C274C',
                      }}
                    >
                      {v == null ? '—' : `${v.toFixed(0)}%`}
                    </motion.div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
