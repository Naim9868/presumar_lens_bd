// Formatting helpers used across analytics UI.

import type { KpiDelta } from '@/types/analytics';

const BDT = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const BDT_DEC = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const INT = new Intl.NumberFormat('en-US');

export function formatCurrency(
  value: number,
  opts: { decimals?: boolean; currency?: string } = {}
): string {
  const fmt = opts.decimals ? BDT_DEC : BDT;
  const prefix = opts.currency === 'USD' ? '$' : '৳';
  // For USD-style we still want thousands separators.
  if (opts.currency === 'USD') {
    return `$${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: opts.decimals ? 2 : 0,
      maximumFractionDigits: opts.decimals ? 2 : 0,
    }).format(value)}`;
  }
  return `${prefix}${fmt.format(value)}`;
}

export function formatNumber(value: number): string {
  return INT.format(Math.round(value));
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(
  value: number,
  opts: { digits?: number; signed?: boolean } = {},
): string {
  const digits = opts.digits ?? 1;
  const signed = opts.signed ?? false;
  if (!Number.isFinite(value)) return '—';
  const sign = signed && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

export function deltaLabel(delta: KpiDelta): string {
  if (delta.changePct === null) return '—';
  const sign = delta.changePct > 0 ? '+' : '';
  return `${sign}${delta.changePct.toFixed(1)}%`;
}

export function buildDelta(
  current: number,
  previous: number
): KpiDelta {
  if (!previous || previous === 0) {
    return { current, previous, changePct: null, trend: 'flat' };
  }
  const changePct = ((current - previous) / previous) * 100;
  let trend: KpiDelta['trend'] = 'flat';
  if (changePct > 0.5) trend = 'up';
  else if (changePct < -0.5) trend = 'down';
  return { current, previous, changePct, trend };
}

// ─── Date helpers ───────────────────────────────────────────────────────────

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export function diffDays(from: string, to: string): number {
  const a = parseISODate(from).getTime();
  const b = parseISODate(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function rangeForPreset(
  preset: 'today' | '7d' | '30d' | '90d' | 'custom',
  custom?: { from: string; to: string },
  comparePrevious = true
): { from: string; to: string; preset: typeof preset; comparePrevious: boolean; previous: { from: string; to: string } } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let from: Date;
  let to: Date = today;
  switch (preset) {
    case 'today':
      from = today;
      break;
    case '7d':
      from = addDays(today, -6);
      break;
    case '30d':
      from = addDays(today, -29);
      break;
    case '90d':
      from = addDays(today, -89);
      break;
    case 'custom':
      from = parseISODate(custom?.from || toISODate(today));
      to = parseISODate(custom?.to || toISODate(today));
      break;
  }
  const fromIso = toISODate(from);
  const toIso = toISODate(to);
  const days = diffDays(fromIso, toIso) + 1;
  const prevFrom = toISODate(addDays(from, -days));
  const prevTo = toISODate(addDays(from, -1));
  return {
    from: fromIso,
    to: toIso,
    preset,
    comparePrevious,
    previous: { from: prevFrom, to: prevTo },
  };
}
