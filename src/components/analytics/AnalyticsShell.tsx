'use client';

import { ReactNode, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  FileDown,
  FileSpreadsheet,
  RefreshCcw,
  Radio,
} from 'lucide-react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { downloadCSV, exportElementToPDF } from '@/lib/analytics/export';
import type { DateRangePreset } from '@/types/analytics';

interface AnalyticsShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  exportRows?: () => Record<string, unknown>[];
  exportFilename?: string;
  liveStrategy?: boolean;
}

const PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7d' },
  { id: '30d', label: 'Last 30d' },
  { id: '90d', label: 'Last 90d' },
  { id: 'custom', label: 'Custom' },
];

export function AnalyticsShell({
  title,
  subtitle,
  children,
  exportRows,
  exportFilename,
  liveStrategy = false,
}: AnalyticsShellProps) {
  const { range, setPreset, setCustomRange, toggleCompare, refresh, loading, source } =
    useAnalytics();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(range.from.slice(0, 10));
  const [to, setTo] = useState(range.to.slice(0, 10));
  const containerRef = useRef<HTMLDivElement>(null);

  const onCsv = () => {
    if (!exportRows) return;
    const rows = exportRows();
    if (!rows.length) return;
    downloadCSV(`${exportFilename ?? 'analytics'}.csv`, rows);
  };

  const onPdf = async () => {
    if (!containerRef.current) return;
    await exportElementToPDF(containerRef.current, `${exportFilename ?? 'analytics'}.pdf`);
  };

  const activeLabel =
    PRESETS.find((p) => p.id === range.preset)?.label ?? `${range.from} → ${range.to}`;

  return (
    <div ref={containerRef} className="space-y-6 p-4 sm:p-6">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-dark dark:text-white">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-body">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {liveStrategy ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-light-6 px-2.5 py-1 text-2xs font-semibold text-green-dark dark:bg-green/10">
              <Radio className="h-3 w-3" /> Live
            </span>
          ) : null}
          <span className="hidden rounded-full bg-gray-2 px-2.5 py-1 text-2xs font-semibold text-body dark:bg-dark-3 sm:inline">
            Source: {source}
          </span>

          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-3 bg-white px-3 py-2 text-xs font-semibold text-dark shadow-1 hover:bg-gray-1 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            >
              <CalendarDays className="h-4 w-4 text-body" />
              {activeLabel}
              <ChevronDown className="h-3 w-3 text-body" />
            </button>
            {open ? (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-gray-2 bg-white p-3 shadow-2 dark:border-dark-3 dark:bg-dark-2"
              >
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPreset(p.id);
                        setOpen(false);
                      }}
                      className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                        range.preset === p.id
                          ? 'bg-blue-light-5 text-blue-dark dark:bg-blue/20'
                          : 'text-body hover:bg-gray-1 dark:hover:bg-dark-3'
                      }`}
                    >
                      {p.label}
                      {range.preset === p.id ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : null}
                    </button>
                  ))}
                </div>
                {range.preset === 'custom' ? (
                  <div className="mt-3 space-y-2 border-t border-gray-2 pt-3 dark:border-dark-3">
                    <div className="flex items-center gap-2">
                      <label className="w-12 text-2xs text-meta-4">From</label>
                      <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="flex-1 rounded-md border border-gray-3 bg-white px-2 py-1 text-xs dark:border-dark-3 dark:bg-dark"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="w-12 text-2xs text-meta-4">To</label>
                      <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="flex-1 rounded-md border border-gray-3 bg-white px-2 py-1 text-xs dark:border-dark-3 dark:bg-dark"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setCustomRange(from, to);
                        setOpen(false);
                      }}
                      className="w-full rounded-md bg-blue py-1.5 text-xs font-semibold text-white"
                    >
                      Apply
                    </button>
                  </div>
                ) : null}
              </motion.div>
            ) : null}
          </div>

          <button
            onClick={toggleCompare}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              range.comparePrevious
                ? 'border-blue bg-blue text-white'
                : 'border-gray-3 bg-white text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white'
            }`}
          >
            Compare Previous
          </button>

          <button
            onClick={() => refresh()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-3 bg-white px-3 py-2 text-xs font-semibold text-dark disabled:opacity-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {exportRows ? (
            <button
              onClick={onCsv}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-3 bg-white px-3 py-2 text-xs font-semibold text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            >
              <FileSpreadsheet className="h-4 w-4" /> CSV
            </button>
          ) : null}

          <button
            onClick={onPdf}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue to-blue-dark px-3 py-2 text-xs font-semibold text-white shadow-1 hover:opacity-95"
          >
            <FileDown className="h-4 w-4" /> PDF
          </button>
        </div>
      </motion.header>

      {children}
    </div>
  );
}

export function AnalyticsLoading() {
  return (
    <div className="flex h-64 items-center justify-center text-body">
      <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Loading analytics…
    </div>
  );
}

export function AnalyticsEmpty({ label = 'No data for this range.' }: { label?: string }) {
  return (
    <div className="flex h-32 items-center justify-center gap-2 rounded-xl border border-dashed border-gray-3 text-sm text-body dark:border-dark-3">
      <Download className="h-4 w-4" /> {label}
    </div>
  );
}
