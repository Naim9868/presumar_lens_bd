// CSV export + print-to-PDF helpers used by analytics pages.
// CSV: zero-dependency, browser-native.
// PDF: uses window.print() with a print stylesheet — no extra deps, sharp text,
//      and the user can save as PDF from the browser's print dialog.

export function downloadCSV(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

const PRINT_STYLES = `
  body { background: #fff !important; color: #000 !important; }
  body > * { display: none !important; }
  #analytics-print-root { display: block !important; }
  #analytics-print-root { padding: 24px; font-family: ui-sans-serif, system-ui, sans-serif; }
  @page { size: A4 landscape; margin: 12mm; }
`;

export function exportElementToPDF(
  element: HTMLElement,
  _filename: string
): void {
  if (typeof window === 'undefined') return;
  const win = window.open('', '_blank', 'width=1280,height=900');
  if (!win) {
    // Popup blocked — fall back to in-page print.
    window.print();
    return;
  }
  const html = element.outerHTML;
  win.document.open();
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Analytics</title><style>${PRINT_STYLES}</style></head><body><div id="analytics-print-root">${html}</div></body></html>`);
  win.document.close();
  // Wait for the new window to render, then open the print dialog.
  win.addEventListener('load', () => {
    win.focus();
    win.print();
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
