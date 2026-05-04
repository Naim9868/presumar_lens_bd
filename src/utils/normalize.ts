// utils/normalize.ts
export function normalizeString(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}