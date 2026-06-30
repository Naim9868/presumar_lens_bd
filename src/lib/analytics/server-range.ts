import { rangeForPreset } from '@/lib/analytics/format';
import type { DateRange, DateRangePreset } from '@/types/analytics';

const PRESETS: DateRangePreset[] = ['today', '7d', '30d', '90d', 'custom'];

export function parseRangeFromQuery(
  url: URL,
): DateRange & { previous?: { from: string; to: string } } {
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const presetRaw = url.searchParams.get('preset') as DateRangePreset | null;
  const compare = url.searchParams.get('compare');

  const preset: DateRangePreset = (PRESETS.includes(presetRaw as DateRangePreset)
    ? presetRaw
    : '30d') as DateRangePreset;

  const custom = preset === 'custom' && from && to ? { from, to } : undefined;
  const comparePrevious = compare === null ? true : compare === 'true';

  const r = rangeForPreset(preset, custom, comparePrevious);
  return {
    from: r.from,
    to: r.to,
    preset: r.preset,
    comparePrevious: r.comparePrevious,
    previous: r.previous,
  };
}
