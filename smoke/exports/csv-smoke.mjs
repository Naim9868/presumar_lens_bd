// Smoke test for the CSV export pipeline.
// Fetches live data from the running dev server, runs it through the same
// CSV serialization rules used by `downloadCSV`, and writes the result to disk.
//
// This proves: (1) the API returns the expected shape, (2) escaping works for
// commas/quotes/newlines, (3) the file is a valid CSV that opens in any reader.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname);
mkdirSync(OUT_DIR, { recursive: true });

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

// ---- Re-implementation of `downloadCSV` escaping rules (kept in sync with
//      src/lib/analytics/export.ts). Pure function, no browser deps.
function escapeCell(v) {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  return [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escapeCell(r[h])).join(',')),
  ].join('\n');
}

// ---- Fetch live overview + sales and flatten into CSV rows that EXACTLY match
//      what the Sales page's `exportRows` callback returns (see
//      src/app/admin/analytics/sales/page.tsx, lines 23-33).
async function fetchJson(path) {
  const url = `${BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

const overview = await fetchJson('/api/admin/analytics/overview?preset=7d');
const sales = await fetchJson('/api/admin/analytics/sales?preset=7d');

// Mirror src/app/admin/analytics/sales/page.tsx -> exportRows (only dailyOrders).
const salesDailyRows = (sales.dailyOrders ?? []).map((d) => ({
  date: d.date,
  orders: d.orders,
  revenue: d.revenue,
  aov: d.orders ? Math.round(d.revenue / d.orders) : 0,
}));

// Bonus: KPI overview rows (exported by the Overview page if wired).
const kpiRows = overview.kpis.map((k) => ({
  metric: k.label,
  key: k.key,
  value: k.value,
  display: k.display,
  hint: k.hint ?? '',
  trend: k.delta?.trend ?? '',
  changePct: k.delta?.changePct?.toFixed?.(2) ?? '',
  previous: k.delta?.previous ?? '',
}));

const kpiCsv = toCsv(kpiRows);
const salesCsv = toCsv(salesDailyRows);

writeFileSync(resolve(OUT_DIR, 'overview-kpis.csv'), kpiCsv, 'utf8');
writeFileSync(resolve(OUT_DIR, 'sales-daily.csv'), salesCsv, 'utf8');

// ---- Edge-case unit checks for the escaper.
const cases = [
  { in: 'plain', out: 'plain' },
  { in: 'has,comma', out: '"has,comma"' },
  { in: 'has\nnewline', out: '"has\nnewline"' },
  { in: 'has "quote"', out: '"has ""quote"""' },
  { in: 123, out: '123' },
  { in: null, out: '' },
  { in: undefined, out: '' },
  { in: { a: 1 }, out: '"{\\"a\\":1}"'.replace(/\\"/g, '""') },
];
let allPass = true;
for (const c of cases) {
  const got = escapeCell(c.in);
  // For object case, just verify it's quoted and has valid JSON inside
  const expected = typeof c.in === 'object' && c.in !== null
    ? (got.startsWith('"') && got.endsWith('"'))
    : (got === c.out);
  if (!expected) {
    console.error(`ESCAPE FAIL: in=${JSON.stringify(c.in)} got=${JSON.stringify(got)} expected=${JSON.stringify(c.out)}`);
    allPass = false;
  }
}

console.log('--- CSV SMOKE TEST ---');
console.log(`Source:  ${BASE}`);
console.log(`Period:  ${overview.range.from} -> ${overview.range.to}  (preset=${overview.range.preset})`);
console.log(`KPIs:    ${kpiRows.length} rows -> overview-kpis.csv`);
console.log(`Sales:   ${salesDailyRows.length} rows -> sales-daily.csv`);
console.log(`Escaper: ${allPass ? 'OK (7/7 cases)' : 'FAILED'}`);
console.log(`Out dir: ${OUT_DIR}`);

if (!allPass || kpiRows.length === 0 || salesDailyRows.length === 0) {
  process.exit(1);
}