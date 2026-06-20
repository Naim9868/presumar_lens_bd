// src/lib/utm.ts — Run this on every page load

export function captureUTM() {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};

  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
   'fbclid', 'gclid', 'ttclid'].forEach((key) => {
    const val = params.get(key);
    if (val) utm[key] = val;
  });

  if (Object.keys(utm).length > 0) {
    sessionStorage.setItem('utm_data', JSON.stringify(utm));
    sessionStorage.setItem('referrer', document.referrer);
  }
}

export function getUTM(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem('utm_data') || '{}');
  } catch {
    return {};
  }
}