'use client';

import { motion } from 'framer-motion';

export type HeatmapValue = number | null;

export interface HeatmapCell {
  row: string;
  col: string;
  value: HeatmapValue;
}

interface HeatmapMatrixProps {
  rows: string[];
  cols: string[];
  values: HeatmapValue[][];
  delay?: number;
  emptyLabel?: string;
}

const intensity = (v: HeatmapValue, min: number, max: number) => {
  if (v == null || max === min) return 0;
  return (v - min) / (max - min);
};

export function HeatmapMatrix({
  rows,
  cols,
  values,
  delay = 0,
  emptyLabel = '—',
}: HeatmapMatrixProps) {
  const flat = values.flat().filter((v): v is number => typeof v === 'number');
  const min = flat.length ? Math.min(...flat) : 0;
  const max = flat.length ? Math.max(...flat) : 1;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-2xs">
        <thead>
          <tr>
            <th className="px-1 py-1 text-left text-meta-4" />
            {cols.map((c) => (
              <th key={c} className="px-1 py-1 text-center font-medium text-meta-4">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r}>
              <th className="whitespace-nowrap px-1 py-1 text-left font-medium text-body">
                {r}
              </th>
              {cols.map((_, j) => {
                const v = values[i]?.[j] ?? null;
                const a = intensity(v, min, max);
                return (
                  <td key={j} className="px-0.5 py-0.5">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        duration: 0.25,
                        delay: delay + (i * cols.length + j) * 0.005,
                        ease: 'easeOut',
                      }}
                      className="flex h-7 items-center justify-center rounded-md text-2xs font-semibold"
                      style={{
                        background:
                          v == null
                            ? 'rgba(148,163,184,0.12)'
                            : `rgba(60,80,224,${0.15 + a * 0.7})`,
                        color: a > 0.55 ? '#fff' : '#1C274C',
                      }}
                    >
                      {v == null ? emptyLabel : Math.round(v * 100) / 100}
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
